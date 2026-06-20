import pandas as pd
import numpy as np
from api.data_loader import load_odds_history, load_matches, load_teams

def detect_anomaly(odds_history: pd.DataFrame, threshold: float = 0.3):
    anomalies = []
    for col in ['homeOdds', 'awayOdds']:
        pct_change = odds_history[col].pct_change()
        anomaly_mask = pct_change.abs() > threshold
        for idx in odds_history[anomaly_mask].index:
            change_val = pct_change[idx]
            anomalies.append({
                'timestamp': odds_history.loc[idx, 'timestamp'].strftime('%Y-%m-%d %H:%M:%S'),
                'changePercent': float(change_val),
                'type': 'home' if col == 'homeOdds' else 'away',
                'description': f'{("主队" if col == "homeOdds" else "客队")}赔率{"下跌" if change_val < 0 else "上涨"}{abs(change_val)*100:.1f}%'
            })
    return anomalies

def get_odds_tracking(match_id=None):
    odds_df = load_odds_history()
    matches_df = load_matches()
    teams_df = load_teams()
    
    if match_id:
        odds_df = odds_df[odds_df['matchId'] == match_id]
    
    if odds_df.empty:
        match_id = 'M003'
        odds_df = load_odds_history()
        odds_df = odds_df[odds_df['matchId'] == 'M003']
    
    match_ids = odds_df['matchId'].unique()
    match_list = []
    
    for mid in match_ids:
        match = matches_df[matches_df['matchId'] == mid]
        if not match.empty:
            t1 = teams_df[teams_df['teamId'] == match.iloc[0]['team1Id']]
            t2 = teams_df[teams_df['teamId'] == match.iloc[0]['team2Id']]
            t1_name = t1.iloc[0]['name'] if not t1.empty else match.iloc[0]['team1Id']
            t2_name = t2.iloc[0]['name'] if not t2.empty else match.iloc[0]['team2Id']
            match_list.append({
                'id': mid,
                'name': f'{t1_name} vs {t2_name}',
                'team1': t1_name,
                'team2': t2_name,
                'date': match.iloc[0]['matchDate']
            })
    
    current_match = match_list[0] if match_list else {'id': match_id, 'name': '未知比赛'}
    
    odds_history = []
    for _, row in odds_df.iterrows():
        odds_history.append({
            'timestamp': row['timestamp'].strftime('%Y-%m-%d %H:%M:%S'),
            'homeOdds': float(row['homeOdds']),
            'awayOdds': float(row['awayOdds']),
            'handicapOdds': float(row['handicapOdds']),
            'totalOdds': float(row['totalOdds'])
        })
    
    anomalies = detect_anomaly(odds_df)
    
    return {
        'matchId': match_id if match_id else match_ids[0],
        'matchName': current_match['name'],
        'team1': current_match.get('team1', '主队'),
        'team2': current_match.get('team2', '客队'),
        'matchList': match_list,
        'oddsHistory': odds_history,
        'anomalies': anomalies
    }
