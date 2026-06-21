import pandas as pd
import numpy as np
from datetime import timedelta
from api.data_loader import load_odds_history, load_matches, load_teams


def _detect_anomalies_in_window(odds_df: pd.DataFrame, window_minutes: int = 5, threshold: float = 0.3):
    if len(odds_df) < 2:
        return []
    match_now = odds_df['timestamp'].max()
    window_start = match_now - timedelta(minutes=window_minutes)
    window_df = odds_df[odds_df['timestamp'] >= window_start].copy().sort_values('timestamp')
    if len(window_df) < 2:
        return []
    anomalies = []
    for col in ['homeOdds', 'awayOdds']:
        pct = window_df[col].pct_change()
        anomaly_mask = pct.abs() >= threshold
        for idx in window_df[anomaly_mask].index:
            change_val = pct[idx]
            pos = window_df.index.get_loc(idx)
            prev_val = window_df[col].iloc[pos - 1] if pos > 0 else window_df[col].iloc[0]
            curr_val = window_df.loc[idx, col]
            anomalies.append({
                'timestamp': window_df.loc[idx, 'timestamp'],
                'changePercent': float(change_val),
                'type': 'home' if col == 'homeOdds' else 'away',
                'startOdds': float(prev_val),
                'endOdds': float(curr_val)
            })
    return anomalies


def get_alerts(match_id=None, window_minutes: int = 180, threshold: float = 0.3):
    all_odds_df = load_odds_history()
    matches_df = load_matches()
    teams_df = load_teams()

    odds_df = all_odds_df
    if match_id:
        odds_df = all_odds_df[all_odds_df['matchId'] == match_id]

    alerts = []
    for mid in odds_df['matchId'].unique():
        mid_df = odds_df[odds_df['matchId'] == mid]
        mid_anoms = _detect_anomalies_in_window(mid_df, window_minutes=window_minutes, threshold=threshold)
        if not mid_anoms:
            continue

        match = matches_df[matches_df['matchId'] == mid]
        if match.empty:
            continue
        m = match.iloc[0]
        t1_df = teams_df[teams_df['teamId'] == m['team1Id']]
        t2_df = teams_df[teams_df['teamId'] == m['team2Id']]
        t1_name = t1_df.iloc[0]['name'] if not t1_df.empty else m['team1Id']
        t2_name = t2_df.iloc[0]['name'] if not t2_df.empty else m['team2Id']
        match_name = f'{t1_name} vs {t2_name}'

        for a in mid_anoms:
            team_name = t1_name if a['type'] == 'home' else t2_name
            direction = '上涨' if a['changePercent'] > 0 else '下跌'
            alerts.append({
                'id': f'{mid}-{a["type"]}-{int(a["timestamp"].timestamp())}',
                'matchId': mid,
                'matchName': match_name,
                'team1': t1_name,
                'team2': t2_name,
                'team': team_name,
                'type': a['type'],
                'changePercent': a['changePercent'],
                'startOdds': a['startOdds'],
                'endOdds': a['endOdds'],
                'timestamp': a['timestamp'].strftime('%Y-%m-%d %H:%M:%S'),
                'description': f'{team_name} 赔率{direction} {abs(a["changePercent"]) * 100:.1f}%（{a["startOdds"]:.2f} → {a["endOdds"]:.2f}）'
            })

    alerts.sort(key=lambda x: x['timestamp'], reverse=True)
    return alerts


def get_latest_alert_for_match(match_id: str):
    if not match_id:
        return None
    alerts = get_alerts(match_id=match_id, window_minutes=24 * 60, threshold=0.3)
    return alerts[0] if alerts else None
