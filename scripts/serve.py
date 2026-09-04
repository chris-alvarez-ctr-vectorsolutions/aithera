#!/usr/bin/env python3
"""Static preview server for the ux-mockups repo.

Prototypes use fetch() and ES modules, which file:// blocks — so they have to be
served. This serves the repo root on http://localhost:4599, the port the README
and .claude/launch.json already standardise on, so preview URLs never move.

Two details the bare `python3 -m http.server` doesn't give us:

  * Cache-Control: no-store on every response. Without it the browser can hand
    back a cached copy of a prototype after an edit, so a refresh shows stale
    markup and you go hunting for a bug that isn't there.
  * Bound to 127.0.0.1 only, so the repo is never exposed to the network.

Run it directly (python3 scripts/serve.py) or let the LaunchAgent keep it up —
see "Preview locally" in README.md.
"""

import functools
import http.server
import os
import socketserver
import sys

PORT = int(os.environ.get('UX_PREVIEW_PORT', '4599'))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()


class Server(socketserver.ThreadingTCPServer):
    # Without this a restart inside the TIME_WAIT window fails to bind.
    allow_reuse_address = True
    daemon_threads = True


def main():
    os.chdir(ROOT)
    handler = functools.partial(Handler, directory=ROOT)
    try:
        with Server(('127.0.0.1', PORT), handler) as httpd:
            print('Serving %s on http://localhost:%d (no-cache)' % (ROOT, PORT), flush=True)
            httpd.serve_forever()
    except OSError as e:
        # Most often: something else already holds the port.
        print('Could not bind 127.0.0.1:%d — %s' % (PORT, e), file=sys.stderr, flush=True)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
