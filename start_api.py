import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api.main import app

if __name__ == '__main__':
    print('🚀 电竞赛事投注数据分析看板API启动中...')
    print('📊 监听端口: 5001')
    print('🔗 API基地址: http://localhost:5001/api')
    print('Registered routes:')
    for rule in app.url_map.iter_rules():
        if not rule.rule.startswith('/static'):
            print(f'  {rule.rule}')
    app.run(host='0.0.0.0', port=5001, debug=False)
