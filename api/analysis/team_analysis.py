import pandas as pd
import numpy as np
from api.data_loader import load_head_to_head, load_teams

def get_team_history(team1=None, team2=None):
    h2h_df = load_head_to_head()
    teams_df = load_teams()
    
    all_teams = []
    for team_id in pd.concat([h2h_df['team1Id'], h2h_df['team2Id']]).unique():
        team_info = teams_df[teams_df['teamId'] == team_id]
        if not team_info.empty:
            all_teams.append({
                'id': team_id,
                'name': team_info.iloc[0]['name'],
                'league': team_info.iloc[0]['leagueId']
            })
    
    if not team1 or not team2:
        team1 = 'T1'
        team2 = 'GEN'
    
    mask = ((h2h_df['team1Id'] == team1) & (h2h_df['team2Id'] == team2)) | \
           ((h2h_df['team1Id'] == team2) & (h2h_df['team2Id'] == team1))
    
    history = h2h_df[mask].sort_values('date', ascending=False)
    
    if history.empty:
        team1 = 'T1'
        team2 = 'GEN'
        mask = ((h2h_df['team1Id'] == 'T1') & (h2h_df['team2Id'] == 'GEN'))
        history = h2h_df[mask].sort_values('date', ascending=False)
    
    team1_info = teams_df[teams_df['teamId'] == team1]
    team2_info = teams_df[teams_df['teamId'] == team2]
    
    team1_name = team1_info.iloc[0]['name'] if not team1_info.empty else team1
    team2_name = team2_info.iloc[0]['name'] if not team2_info.empty else team2
    
    team1_wins = len(history[history['winner'] == team1])
    team2_wins = len(history[history['winner'] == team2])
    total_matches = len(history)
    
    bo3_matches = history[history['boFormat'] == 3]
    avg_bo3_duration = bo3_matches['duration'].mean() if len(bo3_matches) > 0 else 0
    
    full_sets = len(history[history['score'].isin(['2-1', '1-2', '3-2', '2-3'])])
    full_set_rate = full_sets / total_matches if total_matches > 0 else 0
    
    match_history = []
    for _, row in history.iterrows():
        match_history.append({
            'date': row['date'].strftime('%Y-%m-%d'),
            'winner': row['winner'],
            'winnerName': team1_name if row['winner'] == team1 else team2_name,
            'score': row['score'],
            'duration': int(row['duration']),
            'boFormat': int(row['boFormat']),
            'team1Score': int(row['score'].split('-')[0]) if row['winner'] == row['team1Id'] else int(row['score'].split('-')[1]),
            'team2Score': int(row['score'].split('-')[1]) if row['winner'] == row['team1Id'] else int(row['score'].split('-')[0])
        })
    
    win_trend = []
    cumulative = 0
    for match in reversed(match_history):
        cumulative += 1 if match['winner'] == team1 else -1
        win_trend.append({
            'date': match['date'],
            'value': cumulative
        })
    
    return {
        'team1': team1,
        'team2': team2,
        'team1Name': team1_name,
        'team2Name': team2_name,
        'totalMatches': int(total_matches),
        'team1Wins': int(team1_wins),
        'team2Wins': int(team2_wins),
        'team1WinRate': float(team1_wins / total_matches) if total_matches > 0 else 0,
        'team2WinRate': float(team2_wins / total_matches) if total_matches > 0 else 0,
        'avgBo3Duration': float(avg_bo3_duration),
        'fullSetRate': float(full_set_rate),
        'matchHistory': match_history,
        'winTrend': win_trend,
        'allTeams': all_teams
    }
