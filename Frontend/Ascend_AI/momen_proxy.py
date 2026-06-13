import json
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler, HTTPServer

MOMEN_ENDPOINT = "https://villa.momen.app/zero/bZ7yl9D9ojv/api/graphql-v2"
MOMEN_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJkZWZhdWx0Um9sZSI6ImFkbWluIiwiWkVST19VU0VSX0lEIjoiMTAwOTk5OTk5OTk5OTk5OSIsInJvbGVzIjpbImFkbWluIl0sInplcm8iOnt9LCJoYXN1cmFfY2xhaW1zIjp7IngtaGFzdXJhLWRlZmF1bHQtcm9sZSI6ImFkbWluIiwieC1oYXN1cmEtYWxsb3dlZC1yb2xlcyI6WyJhZG1pbiJdLCJ4LWhhc3VyYS11c2VyLWlkIjoiMTAwOTk5OTk5OTk5OTk5OSJ9fQ.adrkfKrEatWjfNECdKBjP51iRAe9nPtr8yvpvzmm9tA"
PROXY_PORT = 5501

class ProxyHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers()

    def do_POST(self):
        if self.path != '/graphql':
            self._set_headers(404)
            self.wfile.write(b'{"error":"Not found"}')
            return

        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length)

        request = urllib.request.Request(
            MOMEN_ENDPOINT,
            data=body,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {MOMEN_TOKEN}',
            },
            method='POST',
        )

        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                response_body = response.read()
                self._set_headers(response.getcode())
                self.wfile.write(response_body)
        except urllib.error.HTTPError as e:
            self._set_headers(e.code)
            self.wfile.write(e.read())
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def log_message(self, format, *args):
        return

if __name__ == '__main__':
    server = HTTPServer(('localhost', PROXY_PORT), ProxyHandler)
    print(f'Running Momen proxy on http://localhost:{PROXY_PORT}/graphql')
    server.serve_forever()
