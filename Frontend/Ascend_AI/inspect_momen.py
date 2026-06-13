import json
import urllib.request

url = "https://villa.momen.app/zero/bZ7yl9D9ojv/api/graphql-v2"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJkZWZhdWx0Um9sZSI6ImFkbWluIiwiWkVST19VU0VSX0lEIjoiMTAwOTk5OTk5OTk5OTk5OSIsInJvbGVzIjpbImFkbWluIl0sInplcm8iOnt9LCJoYXN1cmFfY2xhaW1zIjp7IngtaGFzdXJhLWRlZmF1bHQtcm9sZSI6ImFkbWluIiwieC1oYXN1cmEtYWxsb3dlZC1yb2xlcyI6WyJhZG1pbiJdLCJ4LWhhc3VyYS11c2VyLWlkIjoiMTAwOTk5OTk5OTk5OTk5OSJ9fQ.adrkfKrEatWjfNECdKBjP51iRAe9nPtr8yvpvzmm9tA"
}
query = "query Introspect { __schema { queryType { name } mutationType { name } types { name kind fields { name } } } }"
body = json.dumps({"query": query}).encode("utf-8")
req = urllib.request.Request(url, data=body, headers=headers)
with urllib.request.urlopen(req, timeout=20) as resp:
    print(resp.read().decode("utf-8"))
