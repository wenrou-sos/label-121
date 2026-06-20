import pandas as pd
import numpy as np
from api.data_loader import load_live_matches

def calculate_win_probability(gold_diff, kill_diff, dragon_diff, baron_diff, tower_diff, game_time=30):
    weights = {
        'gold': 0.35,
        'kill': 0.25,
        'dragon': 0.15,
        'baron': 0.15,
        'tower': 0.10
    }
    
    normalized = {
        'gold': np.tanh(abs(gold_diff) / 5000) * np.sign(gold_diff),
        'kill': np.tanh(abs(kill_diff) / 10) * np.sign(kill_diff),
        'dragon': np.tanh(abs(dragon_diff) / 3) * np.sign(dragon_diff),
        'baron': np.tanh(abs(baron_diff) / 2) * np.sign(baron_diff),
        'tower': np.tanh(abs(tower_diff) / 5) * np.sign(tower_diff)
    }
    
    score = sum(weights[k] * normalized[k] for k in weights)
    prob_team1 = 1 / (1 + np.exp(-score * 3))
    
    return prob_team1, 1 - prob_team1

def identify_value_bet(win_probability, current_odds, threshold=0.05):
    implied_probs = (1 / current_odds[0], 1 / current_odds[1])
    edges = (
        win_probability[0] - implied_probs[0],
        win_probability[1] - implied_probs[1]
    )
    
    if edges[0] > threshold:
        return {
            'side': 'team1',
            'edge': float(edges[0]),
            'recommendation': f'建议投注主队，价值边缘{edges[0]*100:.1f}%'
        }
    elif edges[1] > threshold:
        return {
            'side': 'team2',
            'edge': float(edges[1]),
            'recommendation': f'建议投注客队，价值边缘{edges[1]*100:.1f}%'
        }
    return None

def get_live_analysis():
    live_df = load_live_matches()
    
    live_matches = []
    for _, row in live_df.iterrows():
        dragon_diff = row['dragon1'] - row['dragon2']
        baron_diff = row['baron1'] - row['baron2']
        tower_diff = row['tower1'] - row['tower2']
        
        calc_prob1, calc_prob2 = calculate_win_probability(
            row['goldDiff'], row['killDiff'],
            dragon_diff, baron_diff, tower_diff
        )
        
        win_prob = (calc_prob1, calc_prob2)
        current_odds = (row['currentOdds1'], row['currentOdds2'])
        
        value_bet = identify_value_bet(win_prob, current_odds)
        
        live_matches.append({
            'matchId': row['matchId'],
            'team1': row['team1'],
            'team2': row['team2'],
            'currentScore': [int(row['currentScore1']), int(row['currentScore2'])],
            'gameTime': row['gameTime'],
            'goldDiff': int(row['goldDiff']),
            'killDiff': int(row['killDiff']),
            'dragonCount': [int(row['dragon1']), int(row['dragon2'])],
            'baronCount': [int(row['baron1']), int(row['baron2'])],
            'towerCount': [int(row['tower1']), int(row['tower2'])],
            'winProbability': [float(calc_prob1), float(calc_prob2)],
            'currentOdds': [float(row['currentOdds1']), float(row['currentOdds2'])],
            'impliedProbability': [float(1/row['currentOdds1']), float(1/row['currentOdds2'])],
            'valueBet': value_bet,
            'momentum': 'team1' if calc_prob1 > 0.6 else 'team2' if calc_prob2 > 0.6 else 'neutral'
        })
    
    value_opportunities = [m for m in live_matches if m['valueBet']]
    
    return {
        'liveMatches': live_matches,
        'valueOpportunities': value_opportunities,
        'totalLiveMatches': len(live_matches),
        'totalValueOpportunities': len(value_opportunities)
    }
