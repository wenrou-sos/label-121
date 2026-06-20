import sys
import os

api_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(api_dir)
if api_dir not in sys.path:
    sys.path.insert(0, api_dir)
if project_dir not in sys.path:
    sys.path.insert(0, project_dir)

from flask import Flask
from flask_cors import CORS

from routes.bet_routes import bet_bp
from routes.odds_routes import odds_bp
from routes.upset_routes import upset_bp
from routes.team_routes import team_bp
from routes.live_routes import live_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(bet_bp, url_prefix='/api')
app.register_blueprint(odds_bp, url_prefix='/api')
app.register_blueprint(upset_bp, url_prefix='/api')
app.register_blueprint(team_bp, url_prefix='/api')
app.register_blueprint(live_bp, url_prefix='/api')

@app.route('/api/health')
def health():
    return {'status': 'ok', 'message': '电竞赛事投注数据分析看板API运行正常'}

@app.route('/api/dashboard-summary')
def dashboard_summary():
    from analysis.bet_analysis import get_bet_distribution
    from analysis.live_analysis import get_live_analysis
    from analysis.upset_analysis import get_upset_analysis
    
    bet_data = get_bet_distribution()
    live_data = get_live_analysis()
    upset_data = get_upset_analysis()
    
    return {
        'totalBetAmount': bet_data['totalAmount'],
        'todayMatches': 8,
        'liveMatches': live_data['totalLiveMatches'],
        'valueOpportunities': live_data['totalValueOpportunities'],
        'anomaliesDetected': 3,
        'avgUpsetRate': upset_data['summary']['majorAvgUpsetRate'],
        'biggestUpset': upset_data['summary']['biggestUpset']
    }

if __name__ == '__main__':
    print('🚀 电竞赛事投注数据分析看板API启动中...')
    print('📊 监听端口: 5001')
    print('🔗 API基地址: http://localhost:5001/api')
    app.run(host='0.0.0.0', port=5001, debug=False)
