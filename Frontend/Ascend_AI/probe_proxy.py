import urllib.request, json
url = 'http://localhost:5501/graphql'
data = json.dumps({"query": "query { __typename }"}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type':'application/json'})
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        print('Status:', resp.getcode())
        print(resp.read().decode('utf-8'))
except Exception as e:
    print('Error:', e)
