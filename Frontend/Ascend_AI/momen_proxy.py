import json
import os
import time
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler, HTTPServer

MOMEN_ENDPOINT = "https://villa.momen.app/zero/bZ7yl9D9ojv/api/graphql-v2"
MOMEN_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJkZWZhdWx0Um9sZSI6ImFkbWluIiwiWkVST19VU0VSX0lEIjoiMTAwOTk5OTk5OTk5OTk5OSIsInJvbGVzIjpbImFkbWluIl0sInplcm8iOnt9LCJoYXN1cmFfY2xhaW1zIjp7IngtaGFzdXJhLWRlZmF1bHQtcm9sZSI6ImFkbWluIiwieC1oYXN1cmEtYWxsb3dlZC1yb2xlcyI6WyJhZG1pbiJdLCJ4LWhhc3VyYS11c2VyLWlkIjoiMTAwOTk5OTk5OTk5OTk5OSJ9fQ.adrkfKrEatWjfNECdKBjP51iRAe9nPtr8yvpvzmm9tA"
PROXY_PORT = 5501
LOG_PATH = os.path.join(os.path.dirname(__file__), 'momen_proxy.log')


def write_log(line: str):
    ts = time.strftime('%Y-%m-%d %H:%M:%S')
    out = f"[{ts}] {line}\n"
    try:
        # print to stdout for immediate visibility
        print(out, end='', flush=True)
    except Exception:
        pass
    try:
        with open(LOG_PATH, 'a', encoding='utf-8') as lf:
            lf.write(out)
            lf.flush()
            try:
                os.fsync(lf.fileno())
            except Exception:
                pass
    except Exception as e:
        try:
            print(f"Failed to write proxy log: {e}", flush=True)
        except Exception:
            pass


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
        try:
            decoded = body.decode('utf-8')
        except Exception:
            decoded = '<binary body>'
        snippet = decoded[:1000]
        write_log(f"Incoming POST /graphql, body (first 1000 chars): {snippet}")

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
                status = response.getcode()
                try:
                    resp_decoded = response_body.decode('utf-8')
                except Exception:
                    resp_decoded = '<binary response>'
                resp_snip = resp_decoded[:1000]
                write_log(f"Forwarded to Momen: status={status}, response (first 1000 chars): {resp_snip}")
                self._set_headers(status)
                self.wfile.write(response_body)
        except urllib.error.HTTPError as e:
            err_body = e.read()
            try:
                err_text = err_body.decode('utf-8')
            except Exception:
                err_text = '<binary error body>'
            write_log(f"Momen HTTPError: code={e.code}, body={err_text[:1000]}")
            self._set_headers(e.code)
            self.wfile.write(err_body)
        except Exception as e:
            write_log(f"Unexpected error when forwarding: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def log_message(self, format, *args):
        # mirror standard logs into our file for easier tracing
        try:
            write_log(f"http: {format % args}")
        except Exception:
            pass


if __name__ == '__main__':
    server = HTTPServer(('localhost', PROXY_PORT), ProxyHandler)
    write_log(f'Running Momen proxy on http://localhost:{PROXY_PORT}/graphql')
    write_log(f'Log path: {LOG_PATH}')
    server.serve_forever()
