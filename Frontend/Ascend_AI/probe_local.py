import urllib.request, json
body = json.dumps({"query":"{ __typename }"}).encode('utf-8')
req = urllib.request.Request('http://localhost:5501/graphql', data=body, headers={'Content-Type':'application/json'})
print(urllib.request.urlopen(req, timeout=10).read().decode())
