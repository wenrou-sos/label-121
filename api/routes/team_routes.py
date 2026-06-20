from flask import Blueprint, request, jsonify
from api.analysis.team_analysis import get_team_history

team_bp = Blueprint('team', __name__)

@team_bp.route('/team-history', methods=['GET'])
def team_history():
    team1 = request.args.get('team1', None)
    team2 = request.args.get('team2', None)
    result = get_team_history(team1, team2)
    return jsonify(result)
