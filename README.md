# Verdict60 — Case dossiers

A free, browser-based platform where people solve the cases published on the
Instagram feed. Read the file, work through the documents, name a suspect, get
the answer on the spot.

**This is a standalone project.** It shares nothing with the VerdictIn60 desktop
app — no imports, no shared files, no shared settings. The only thing they have
in common is the brand.

## What it is technically

A static site. No build step, no framework, no dependencies, no server code, no
database, no accounts. Three JS files, one CSS file, and your cases as JSON.

That is deliberate: it drops onto GitHub Pages, Netlify, Cloudflare Pages or any
static host for free, and it keeps the promise the gate card makes — nothing to
pay, no account, no email.

```
index.html
assets/css/app.css      the whole black/crimson theme
assets/js/store.js      localStorage: language, follow, progress, notes
assets/js/i18n.js       interface copy, EN + NL
assets/js/app.js        router, data loading, the seven document renderers
data/manifest.json      the case list that fills the index grid
data/cases/184.json     one case = one file
data/cases/_template.json
```

## Run it locally

The site fetches JSON, so `file://` will not work — it needs a real server.

```bash
cd "$HOME/Desktop/vibecoded apps/verdict-dossiers" && python3 -m http.server 8000
```

Then open <http://localhost:8000>. Or double-click `serve.command`.

## Adding a case

1. Copy `data/cases/_template.json` to `data/cases/<id>.json`.
2. Fill it in. Every player-facing string can be a plain string or an
   `{"en": …, "nl": …}` pair — a case written in one language still renders.
3. Add an entry to `data/manifest.json`.

The manifest holds only what the index card needs; everything else lives in the
case file, so nothing is duplicated between the two.

```json
{
  "id": "185",
  "path": "data/cases/185.json",
  "file":    { "en": "File 185", "nl": "Dossier 185" },
  "title":   { "en": "…", "nl": "…" },
  "tagline": { "en": "…", "nl": "…" },
  "badge": "real",
  "meta":  { "en": "Homicide · 70 min", "nl": "Doodslag · 70 min" },
  "level": 2,
  "documents": 7,
  "cover": "assets/covers/185.jpg"
}
```

`badge` is one of `real`, `constructed`, `open`, `new` — it drives both the card
label and the index filters. **Mark real cases honestly**: the FAQ promises
players that real files are factual and documented, and that constructed ones
are labelled as constructed.

### Document types

`pieces` is an array; the sidebar, the progress bar and the unlock order all
follow it. Use as many or as few as the case needs — case 176 ships with five.

| `type` | Renders | Key fields |
|---|---|---|
| `report` | Report blocks + attachment list | `blocks[]`, `attachments[]` |
| `scene` | Floor plan + numbered pins | `image`, `pins[]` |
| `forensics` | Findings table (restacks on mobile) | `rows[]`, `conclusive: true` for crimson |
| `comms` | Chat thread + call log | `messages[]` (`side: "them"` / `"subject"`), `calls[]` |
| `suspects` | Suspect wall | reads top-level `suspects[]` |
| `database` | Working search over the rows | `rows[]` |
| `notepad` | Saving notepad + flagged findings | `pinned[]` |

`suspects[]` lives at the top level of the case file because both the suspect
wall and the accusation screen read it — define each person once.

### The answer

```json
"solution": {
  "culprit": 0,
  "correct": { "en": "…why this is the answer…" },
  "wrong":   { "en": "…generic nudge back into the file…" }
}
```

`culprit` is an index into `suspects[]`. Give a suspect its own `cleared` text
to explain why *that specific* person is ruled out; it falls back to
`solution.wrong` when absent. Per-suspect reasons are worth the effort — a wrong
answer is the moment someone is most willing to re-read the file.

## Images

Drop artwork in `assets/covers/` and point at it from the case JSON (`cover`,
`keyArt`, a scene `image`, a suspect `photo`). Any slot left `null` renders the
dashed placeholder from the design, so a dossier can go live before its art
does.

## Behaviour you can change

Top of `assets/js/app.js`:

- `gateEnabled` — the follow-to-open card. Asked once, then remembered on the
  device; a deep link into a document falls back to the landing page until it is
  passed.
- `progressiveUnlock` — documents release as earlier ones are read
  (`3 + read − 1`). Set to `false` to open the whole file at once.
- `instagram` — also settable from `manifest.json`.

## Deep links

Every screen is addressable, which is the point when the traffic comes from a
link in a bio or a story sticker:

```
#/                     the index
#/how                  how it works
#/case/184             the Ashfield landing page
#/case/184/03          straight to the forensic report
#/case/184/accuse      the accusation screen
```

## Notes on the build

- **Mobile first in practice, not in theory.** The design doc is a 1440×960
  desktop canvas; Instagram traffic is overwhelmingly phones. Every grid
  collapses, the workspace sidebar becomes a scrolling tab strip, and the
  four-column forensics table restacks into labelled cards.
- **Progress, notes and accusations are per case** and survive a reload. If
  storage is blocked (Safari private mode), the site still works and the notepad
  says so rather than silently losing work.
- **No text is injected as HTML.** Case content is rendered through
  `textContent`, so an apostrophe or a `<` in a witness statement cannot break
  the page.
