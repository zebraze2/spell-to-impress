# Dev server with caching off, so edits always show on reload.
import http.server, functools, os, sys
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 128     # the page asks for ~20 modules at once; the default backlog of 5 drops some (connection reset)
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
port = int(sys.argv[1]) if len(sys.argv) > 1 else 5177
Server(('', port), functools.partial(H, directory=root)).serve_forever()
