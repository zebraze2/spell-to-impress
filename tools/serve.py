# Dev server with caching off, so edits always show on reload.
import http.server, functools, os, sys
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
port = int(sys.argv[1]) if len(sys.argv) > 1 else 5177
http.server.ThreadingHTTPServer(('', port), functools.partial(H, directory=root)).serve_forever()
