from flask import Blueprint, jsonify
from api.analysis.upset_analysis import get_upset_analysis

upset_bp = Blueprint('upset', __name__)

@upset_bp.route('/upset-analysis', methods=['GET'])
def upset_analysis():
    result = get_upset_analysis()
    return jsonify(result)
