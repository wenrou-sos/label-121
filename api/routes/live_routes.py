from flask import Blueprint, jsonify
from api.analysis.live_analysis import get_live_analysis

live_bp = Blueprint('live', __name__)

@live_bp.route('/live-analysis', methods=['GET'])
def live_analysis():
    result = get_live_analysis()
    return jsonify(result)
