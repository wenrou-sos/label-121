from flask import Blueprint, request, jsonify
from api.analysis.odds_analysis import get_odds_tracking, get_odds_comparison

odds_bp = Blueprint('odds', __name__)

@odds_bp.route('/odds-tracking', methods=['GET'])
def odds_tracking():
    match_id = request.args.get('matchId', None)
    timestamp = request.args.get('timestamp', None)
    result = get_odds_tracking(match_id, timestamp)
    return jsonify(result)


@odds_bp.route('/odds-comparison', methods=['GET'])
def odds_comparison():
    match_id_1 = request.args.get('matchId1')
    match_id_2 = request.args.get('matchId2')
    if not match_id_1 or not match_id_2:
        return jsonify({'error': 'matchId1 和 matchId2 都是必填参数'}), 400
    result = get_odds_comparison(match_id_1, match_id_2)
    return jsonify(result)
