import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from api.data_loader import load_odds_history, load_matches, load_teams
from api.analysis.alert_analysis import get_latest_alert_for_match, _detect_anomalies_in_window


def _build_match_list(all_odds_df, matches_df, teams_df):
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
    return match_list

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

    match_list = _build_match_list(all_odds_df, matches_df, teams_df)
    all_match_ids = all_odds_df['matchId'].unique()
    
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


def _format_history(odds_df):
    rows = []
    for _, row in odds_df.sort_values('timestamp').iterrows():
        rows.append({
            'timestamp': row['timestamp'].strftime('%Y-%m-%d %H:%M:%S'),
            'homeOdds': float(row['homeOdds']),
            'awayOdds': float(row['awayOdds']),
            'handicapOdds': float(row['handicapOdds']),
            'totalOdds': float(row['totalOdds'])
        })
    return rows


def _normalize_series(values):
    arr = np.asarray(values, dtype=float)
    if len(arr) == 0:
        return arr
    min_v = np.nanmin(arr)
    max_v = np.nanmax(arr)
    if max_v - min_v < 1e-9:
        return np.full_like(arr, 0.5)
    return (arr - min_v) / (max_v - min_v)


def get_odds_comparison(match_id_1, match_id_2):
    all_odds_df = load_odds_history()
    matches_df = load_matches()
    teams_df = load_teams()
    match_list = _build_match_list(all_odds_df, matches_df, teams_df)

    def match_info(mid):
        m = next((x for x in match_list if x['id'] == mid), None)
        return m or {'id': mid, 'name': mid, 'team1': '主队', 'team2': '客队'}

    m1 = match_info(match_id_1)
    m2 = match_info(match_id_2)

    df1 = all_odds_df[all_odds_df['matchId'] == match_id_1].sort_values('timestamp').reset_index(drop=True)
    df2 = all_odds_df[all_odds_df['matchId'] == match_id_2].sort_values('timestamp').reset_index(drop=True)

    if df1.empty or df2.empty:
        return {
            'match1': m1,
            'match2': m2,
            'matchList': match_list,
            'alignedTimestamps': [],
            'match1History': [],
            'match2History': [],
            'match1NormalizedHome': [],
            'match1NormalizedAway': [],
            'match2NormalizedHome': [],
            'match2NormalizedAway': [],
            'diffSeries': [],
            'maxDiffRegion': None,
            'summary': {
                'match1Points': len(df1),
                'match2Points': len(df2),
                'alignedPoints': 0
            }
        }

    def to_relative_minutes(df):
        if len(df) == 0:
            return df
        start = df['timestamp'].iloc[0]
        df = df.copy()
        df['relMinutes'] = ((df['timestamp'] - start).dt.total_seconds() / 60.0).round(2)
        return df

    df1_r = to_relative_minutes(df1)
    df2_r = to_relative_minutes(df2)

    merged = pd.merge_asof(
        df1_r.sort_values('relMinutes'),
        df2_r.sort_values('relMinutes'),
        on='relMinutes',
        direction='nearest',
        tolerance=5.0,
        suffixes=('_m1', '_m2')
    )

    merged = merged.dropna(subset=['homeOdds_m1', 'homeOdds_m2']).reset_index(drop=True)

    timestamps = [t.strftime('%Y-%m-%d %H:%M:%S') for t in merged['timestamp_m1']]
    m1_home = merged['homeOdds_m1'].tolist()
    m1_away = merged['awayOdds_m1'].tolist()
    m2_home = merged['homeOdds_m2'].tolist()
    m2_away = merged['awayOdds_m2'].tolist()

    m1_norm_home = _normalize_series(m1_home).tolist()
    m1_norm_away = _normalize_series(m1_away).tolist()
    m2_norm_home = _normalize_series(m2_home).tolist()
    m2_norm_away = _normalize_series(m2_away).tolist()

    diff = np.abs(np.asarray(m1_norm_home) - np.asarray(m2_norm_home)).tolist()

    max_diff_region = None
    if len(diff) > 0:
        window = min(10, max(3, len(diff) // 10))
        diff_arr = np.asarray(diff)
        if len(diff_arr) >= window:
            kernel = np.ones(window) / window
            smoothed = np.convolve(diff_arr, kernel, mode='valid')
            best_idx = int(np.argmax(smoothed))
            start_idx = best_idx
            end_idx = min(len(timestamps) - 1, best_idx + window - 1)
            max_diff_region = {
                'startTimestamp': timestamps[start_idx],
                'endTimestamp': timestamps[end_idx],
                'startIndex': start_idx,
                'endIndex': end_idx,
                'avgDiff': float(smoothed[best_idx]),
                'maxDiff': float(np.max(diff_arr[start_idx:end_idx + 1])),
                'windowSize': window
            }
        else:
            best_idx = int(np.argmax(diff_arr))
            max_diff_region = {
                'startTimestamp': timestamps[max(0, best_idx - 1)],
                'endTimestamp': timestamps[min(len(timestamps) - 1, best_idx + 1)],
                'startIndex': max(0, best_idx - 1),
                'endIndex': min(len(timestamps) - 1, best_idx + 1),
                'avgDiff': float(diff_arr[best_idx]),
                'maxDiff': float(diff_arr[best_idx]),
                'windowSize': 1
            }

    match1_hist = [
        {'timestamp': t, 'homeOdds': h, 'awayOdds': a, 'handicapOdds': 0.0, 'totalOdds': 0.0}
        for t, h, a in zip(timestamps, m1_home, m1_away)
    ]
    match2_hist = [
        {'timestamp': t, 'homeOdds': h, 'awayOdds': a, 'handicapOdds': 0.0, 'totalOdds': 0.0}
        for t, h, a in zip(timestamps, m2_home, m2_away)
    ]

    return {
        'match1': m1,
        'match2': m2,
        'matchList': match_list,
        'alignedTimestamps': timestamps,
        'match1History': match1_hist,
        'match2History': match2_hist,
        'match1NormalizedHome': m1_norm_home,
        'match1NormalizedAway': m1_norm_away,
        'match2NormalizedHome': m2_norm_home,
        'match2NormalizedAway': m2_norm_away,
        'diffSeries': diff,
        'maxDiffRegion': max_diff_region,
        'summary': {
            'match1Points': int(len(df1)),
            'match2Points': int(len(df2)),
            'alignedPoints': int(len(timestamps)),
            'match1HomeStart': float(m1_home[0]) if m1_home else 0.0,
            'match1HomeEnd': float(m1_home[-1]) if m1_home else 0.0,
            'match1AwayStart': float(m1_away[0]) if m1_away else 0.0,
            'match1AwayEnd': float(m1_away[-1]) if m1_away else 0.0,
            'match2HomeStart': float(m2_home[0]) if m2_home else 0.0,
            'match2HomeEnd': float(m2_home[-1]) if m2_home else 0.0,
            'match2AwayStart': float(m2_away[0]) if m2_away else 0.0,
            'match2AwayEnd': float(m2_away[-1]) if m2_away else 0.0,
        }
    }
