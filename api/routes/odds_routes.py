from flask import Blueprint, request, jsonify
from api.analysis.odds_analysis import get_odds_tracking

odds_bp = Blueprint('odds', __name__)

@odds_bp.route('/odds-tracking', methods=['GET'])
def odds_tracking():
    match_id = request.args.get('matchId', None)
    timestamp = request.args.get('timestamp', None)
    result = get_odds_tracking(match_id, timestamp)
    return jsonify(result)
