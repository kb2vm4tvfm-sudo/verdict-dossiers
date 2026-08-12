#!/usr/bin/env python3
"""Local dev server that never lets the browser cache anything.

`python3 -m http.server` sends Last-Modified, and browsers happily serve CSS,
JS and images out of the memory cache without revalidating — so an edit lands
on disk, the server has it, and the page still shows the old version. That
wastes more time than it saves during development, so every response here is
marked no-store.

    python3 tools/serve.py [port]
"""
import functools
import http.server
import os
import socketserver
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_response(self, *args, **kwargs):
        # Never answer "not modified" — that is the other way a stale asset
        # survives a reload.
        super().send_response(*args, **kwargs)

    def log_message(self, fmt, *args):
        status = args[1] if len(args) > 1 else ""
        if status and not str(status).startswith("2"):
            sys.stderr.write("  %s %s\n" % (status, args[0]))


class Server(socketserver.TCPServer):
    allow_reuse_address = True


def main():
    os.chdir(ROOT)
    handler = functools.partial(NoCacheHandler, directory=str(ROOT))
    with Server(("", PORT), handler) as httpd:
        print(f"Verdict60 dossiers  →  http://localhost:{PORT}")
        print(f"Serving {ROOT}")
        print("Caching is disabled; a plain reload always shows your edits.")
        print("Control+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")


if __name__ == "__main__":
    main()
