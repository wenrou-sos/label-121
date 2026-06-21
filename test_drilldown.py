import urllib.request, json

BASE = 'http://localhost:5001/api'

print('=== 投注明细 (LPL + 主队胜) ===')
r = urllib.request.urlopen(BASE + '/bet-details?leagueId=LPL&betType=home_win&page=1&pageSize=10')
d = json.loads(r.read().decode())
print(f'总记录数: {d["total"]}')
print(f'总金额: ¥{d.get("totalAmount", 0):,.0f}')
print(f'总页数: {d["totalPages"]}')
for rec in d['records']:
    print(f'  {rec["betId"]:8} | {rec["userId"]:14} | ¥{rec["amount"]:>8,.0f} | @{rec["odds"]:.2f} | {rec["betTime"]}')

print()
print('=== 赔率快照 (M003 04:00) ===')
r2 = urllib.request.urlopen(BASE + '/odds-tracking?matchId=M003&timestamp=2026-06-20%2004:00:00')
d2 = json.loads(r2.read().decode())
det = d2['detail']
print(f'快照点数: {len(det["snapshot"])}')
print(f'异常数: {len(det["anomalies"])}')
for a in det['anomalies']:
    print(f'  ⚠️ {a["description"]}')
