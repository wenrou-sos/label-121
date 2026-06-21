import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from api.data_loader import load_odds_history, load_matches, load_teams
from api.analysis.alert_analysis import get_latest_alert_for_match, _detect_anomalies_in_window

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

def get_odds_tracking(match_id=None, timestamp=None):
    all_odds_df = load_odds_history()
    matches_df = load_matches()
    teams_df = load_teams()
    
    all_match_ids = all_odds_df['matchId'].unique()
    match_list = []
    
    for mid in all_match_ids:
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
    
    odds_df = all_odds_df
    if match_id:
        odds_df = all_odds_df[all_odds_df['matchId'] == match_id]
    
    if odds_df.empty:
        default_mid = match_list[0]['id'] if match_list else 'M003'
        match_id = default_mid
        odds_df = all_odds_df[all_odds_df['matchId'] == default_mid]
    
    current_match_id = match_id if match_id else (odds_df['matchId'].iloc[0] if len(odds_df) > 0 else (match_list[0]['id'] if match_list else None))
    current_match = next((m for m in match_list if m['id'] == current_match_id), (match_list[0] if match_list else {'id': current_match_id, 'name': '未知比赛'}))
    
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
    current_match_id_value = match_id if match_id else (all_match_ids[0] if len(all_match_ids) > 0 else None)
    latest_alert = get_latest_alert_for_match(current_match_id_value)

    result = {
        'matchId': current_match_id_value,
        'matchName': current_match['name'],
        'team1': current_match.get('team1', '主队'),
        'team2': current_match.get('team2', '客队'),
        'matchList': match_list,
        'oddsHistory': odds_history,
        'anomalies': anomalies,
        'latestAlert': latest_alert,
        'detail': None
    }

    if timestamp:
        try:
            center_ts = pd.to_datetime(timestamp)
            odds_sorted = odds_df.sort_values('timestamp').reset_index(drop=True)
            
            center_idx = None
            min_diff = None
            for idx, row in odds_sorted.iterrows():
                diff = abs((row['timestamp'] - center_ts).total_seconds())
                if min_diff is None or diff < min_diff:
                    min_diff = diff
                    center_idx = idx
            
            if center_idx is not None:
                window_start_idx = max(0, center_idx - 2)
                window_end_idx = min(len(odds_sorted) - 1, center_idx + 2)
                snapshot_df = odds_sorted.iloc[window_start_idx:window_end_idx + 1].copy()
            else:
                snapshot_df = pd.DataFrame(columns=odds_sorted.columns)
            
            snapshot = []
            for _, row in snapshot_df.iterrows():
                snapshot.append({
                    'timestamp': row['timestamp'].strftime('%Y-%m-%d %H:%M:%S'),
                    'homeOdds': float(row['homeOdds']),
                    'awayOdds': float(row['awayOdds']),
                    'handicapOdds': float(row['handicapOdds']),
                    'totalOdds': float(row['totalOdds'])
                })
            
            window_anomalies = _detect_anomalies_in_window(snapshot_df, window_minutes=300, threshold=0.3)
            formatted_anomalies = []
            for a in window_anomalies:
                formatted_anomalies.append({
                    'timestamp': a['timestamp'].strftime('%Y-%m-%d %H:%M:%S') if hasattr(a['timestamp'], 'strftime') else str(a['timestamp']),
                    'changePercent': float(a['changePercent']),
                    'type': a['type'],
                    'startOdds': float(a['startOdds']),
                    'endOdds': float(a['endOdds']),
                    'description': f'{("主队" if a["type"] == "home" else "客队")}赔率{"下跌" if a["changePercent"] < 0 else "上涨"}{abs(a["changePercent"])*100:.1f}%（{a["startOdds"]:.2f} → {a["endOdds"]:.2f}）'
                })
            
            result['detail'] = {
                'centerTimestamp': center_ts.strftime('%Y-%m-%d %H:%M:%S'),
                'snapshot': snapshot,
                'anomalies': formatted_anomalies,
                'windowSize': len(snapshot)
            }
        except Exception as e:
            result['detail'] = {'error': f'timestamp 解析失败: {str(e)}'}

    return result
