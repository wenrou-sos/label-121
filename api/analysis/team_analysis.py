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
    
    team1_info = teams_df[teams_df['teamId'] == team1]
    team2_info = teams_df[teams_df['teamId'] == team2]
    
    team1_name = team1_info.iloc[0]['name'] if not team1_info.empty else team1
    team2_name = team2_info.iloc[0]['name'] if not team2_info.empty else team2
    
    if history.empty:
        return {
            'team1': team1,
            'team2': team2,
            'team1Name': team1_name,
            'team2Name': team2_name,
            'totalMatches': 0,
            'team1Wins': 0,
            'team2Wins': 0,
            'team1WinRate': 0,
            'team2WinRate': 0,
            'avgBo3Duration': 0,
            'fullSetRate': 0,
            'matchHistory': [],
            'winTrend': [],
            'allTeams': all_teams,
            'hasHistory': False
        }
    
    team1_wins = len(history[history['winner'] == team1])
    team2_wins = len(history[history['winner'] == team2])
    total_matches = len(history)
    
    bo3_matches = history[history['boFormat'] == 3]
    avg_bo3_duration = bo3_matches['duration'].mean() if len(bo3_matches) > 0 else 0
    
    full_sets = len(history[history['score'].isin(['2-1', '1-2', '3-2', '2-3'])])
    full_set_rate = full_sets / total_matches if total_matches > 0 else 0
    
    match_history = []
    for _, row in history.iterrows():
        csv_team1 = row['team1Id']
        csv_team2 = row['team2Id']
        csv_score = row['score']
        score_parts = csv_score.split('-')
        csv_t1_score = int(score_parts[0])
        csv_t2_score = int(score_parts[1])
        
        if csv_team1 == team1 and csv_team2 == team2:
            t1_score = csv_t1_score
            t2_score = csv_t2_score
        elif csv_team1 == team2 and csv_team2 == team1:
            t1_score = csv_t2_score
            t2_score = csv_t1_score
        else:
            t1_score = csv_t1_score
            t2_score = csv_t2_score
        
        display_score = f'{t1_score}-{t2_score}'
        
        match_history.append({
            'date': row['date'].strftime('%Y-%m-%d'),
            'winner': row['winner'],
            'winnerName': team1_name if row['winner'] == team1 else team2_name,
            'score': display_score,
            'duration': int(row['duration']),
            'boFormat': int(row['boFormat']),
            'team1Score': t1_score,
            'team2Score': t2_score
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
        'allTeams': all_teams,
        'hasHistory': True
    }
