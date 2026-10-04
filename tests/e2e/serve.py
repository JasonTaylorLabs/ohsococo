# Serves the static export like GitHub Pages: unmatched paths get out/404.html with a 404 status.
# usage: python3 tests/e2e/serve.py <port> <dir>
import functools
import http.server
import os
import sys


class Handler(http.server.SimpleHTTPRequestHandler):
    def send_error(self, code, message=None, explain=None):
        page = os.path.join(self.directory, "404.html")
        if code != 404 or not os.path.isfile(page):
            return super().send_error(code, message, explain)
        with open(page, "rb") as f:
            body = f.read()
        self.send_response(404)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)


port, directory = int(sys.argv[1]), sys.argv[2]
http.server.ThreadingHTTPServer(("", port), functools.partial(Handler, directory=directory)).serve_forever()
