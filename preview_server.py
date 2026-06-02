#!/usr/bin/env python3
"""Local preview server that mirrors Cloudflare Pages/Workers static-asset
behavior: clean URLs (/about -> about.html), root -> index.html, and a
404.html fallback. Serves the sherlock-research/ asset directory.

Usage: python preview_server.py [port]
"""
import http.server
import socketserver
import os
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sherlock-research")


class CleanURLHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def translate_path(self, path):
        p = super().translate_path(path)
        if os.path.isdir(p):
            index = os.path.join(p, "index.html")
            if os.path.exists(index):
                return index
        if not os.path.exists(p):
            html = p + ".html"
            if os.path.exists(html):
                return html
        return p

    def send_error(self, code, message=None, explain=None):
        if code == 404:
            page = os.path.join(ROOT, "404.html")
            if os.path.exists(page):
                with open(page, "rb") as f:
                    body = f.read()
                self.send_response(404)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                try:
                    self.wfile.write(body)
                except BrokenPipeError:
                    pass
                return
        return super().send_error(code, message, explain)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8732
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", port), CleanURLHandler) as httpd:
        print(f"Preview (clean URLs) serving {ROOT} on http://localhost:{port}")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
