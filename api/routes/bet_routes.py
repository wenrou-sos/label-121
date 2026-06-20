from flask import Blueprint, request, jsonify
from api.analysis.bet_analysis import get_bet_distribution

bet_bp = Blueprint('bet', __name__)

@bet_bp.route('/bet-distribution', methods=['GET'])
def bet_distribution():
    league = request.args.get('league', None)
    result = get_bet_distribution(league)
    return jsonify(result)
