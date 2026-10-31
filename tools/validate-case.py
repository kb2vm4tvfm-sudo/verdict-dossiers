#!/usr/bin/env python3
"""Check a case file's citation wiring before it ships.

Usage: python3 -I tools/validate-case.py data/cases/193.json
"""
import json, sys, pathlib

path = pathlib.Path(sys.argv[1])
case = json.loads(path.read_text(encoding="utf-8"))
errs, warns = [], []

def rows_of(piece):
    rows = []
    for key in ("rows", "messages", "calls", "pins", "entries"):
        rows += piece.get(key) or []
    for s in piece.get("sessions") or []:
        rows += s.get("lines") or []
    return rows

# ref -> piece num, and duplicate detection
refs = {}
for p in case["pieces"]:
    for r in rows_of(p):
        ref = r.get("ref")
        if not ref:
            continue
        if ref in refs:
            errs.append(f"duplicate ref {ref} (pieces {refs[ref]} and {p['num']})")
        refs[ref] = p["num"]

suspects = case["suspects"]
culprit = case["solution"]["culprit"]

for i, s in enumerate(suspects):
    by = s.get("clearedBy")
    if i == culprit:
        if by:
            errs.append(f"culprit {s['name']} has clearedBy {by} — must be empty")
        continue
    if by is None:
        errs.append(f"{s['name']} has no clearedBy — cannot be ruled out")
    elif not by:
        errs.append(f"{s['name']} has empty clearedBy but is not the culprit")
    else:
        for ref in by:
            if ref not in refs:
                errs.append(f"{s['name']} cleared by {ref}, which no document carries")
        if not s.get("cleared"):
            warns.append(f"{s['name']} has no 'cleared' text to show the player")

for p in case["pieces"]:
    for s in p.get("sessions") or []:
        for li, line in enumerate(s.get("lines") or []):
            cb = line.get("contradictedBy")
            if not cb:
                continue
            if cb not in refs:
                errs.append(f"{s['subject']} line {li} contradictedBy {cb}, which no document carries")
            elif refs[cb] == p["num"]:
                errs.append(f"{s['subject']} line {li} contradictedBy {cb}, which sits in this same piece — unciteable here")
            if not line.get("tell"):
                warns.append(f"{s['subject']} line {li} has no 'tell'")

nums = [p["num"] for p in case["pieces"]]
if len(set(nums)) != len(nums):
    errs.append(f"duplicate piece numbers: {nums}")

print(f"{path.name}: {len(case['pieces'])} pieces, {len(refs)} citable refs, {len(suspects)} suspects")
print("  refs per piece:", {n: sum(1 for v in refs.values() if v == n) for n in nums})
for w in warns:
    print("  warn:", w)
for e in errs:
    print("  ERROR:", e)
print("  OK" if not errs else f"  {len(errs)} ERROR(S)")
sys.exit(1 if errs else 0)
