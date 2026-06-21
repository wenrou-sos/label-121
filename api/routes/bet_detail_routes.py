from flask import Blueprint, request, jsonify
from api.analysis.bet_detail_analysis import get_bet_details

bet_detail_bp = Blueprint('bet_detail', __name__)

@bet_detail_bp.route('/bet-details', methods=['GET'])
def bet_details_endpoint():
    league_id = request.args.get('leagueId')
    bet_type = request.args.get('betType')
    page = int(request.args.get('page', 1))
    page_size = int(request.args.get('pageSize', 10))

    if not league_id or not bet_type:
        return jsonify({'error': 'leagueId 和 betType 参数必填'}), 400

    if page < 1:
        page = 1
    if page_size < 1 or page_size > 100:
        page_size = 10

    result = get_bet_details(league_id, bet_type, page, page_size)
    return jsonify(result)
