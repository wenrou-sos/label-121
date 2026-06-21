from flask import Blueprint, request, jsonify
from api.analysis.alert_analysis import get_alerts

alert_bp = Blueprint('alert', __name__)

@alert_bp.route('/odds-alerts', methods=['GET'])
def odds_alerts():
    match_id = request.args.get('matchId', None)
    try:
        window = int(request.args.get('windowMinutes', 180))
    except (ValueError, TypeError):
        window = 180
    try:
        threshold = float(request.args.get('threshold', 0.3))
    except (ValueError, TypeError):
        threshold = 0.3
    alerts = get_alerts(match_id=match_id, window_minutes=window, threshold=threshold)
    return jsonify({
        'count': len(alerts),
        'alerts': alerts
    })
