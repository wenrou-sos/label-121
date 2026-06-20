import pandas as pd
import numpy as np
from api.data_loader import load_bet_distribution, load_leagues

def get_bet_distribution(league=None):
    bet_df = load_bet_distribution()
    
    if league:
        bet_df = bet_df[bet_df['leagueId'] == league.upper()]
    
    total_amount = bet_df['amount'].sum()
    
    bet_type_mapping = {
        'home_win': '主队胜',
        'away_win': '客队胜',
        'handicap': '让分盘',
        'total': '大小盘',
        'first_kill': '首杀',
        'first_turret': '首塔'
    }
    
    bet_types = []
    for bet_type, group in bet_df.groupby('betType'):
        type_amount = group['amount'].sum()
        bet_types.append({
            'type': bet_type,
            'typeName': bet_type_mapping.get(bet_type, bet_type),
            'amount': float(type_amount),
            'percentage': float(type_amount / total_amount)
        })
    
    bet_types.sort(key=lambda x: x['amount'], reverse=True)
    
    leagues = load_leagues()
    all_league_df = load_bet_distribution()
    
    all_league_ids = all_league_df['leagueId'].unique()
    league_list = []
    for lid in all_league_ids:
        league_info = leagues[leagues['leagueId'] == lid]
        if not league_info.empty:
            league_list.append({
                'id': lid,
                'name': league_info.iloc[0]['name']
            })
    
    heatmap_league_ids = bet_df['leagueId'].unique() if league else all_league_ids
    heat_map_data = []
    for lid in heatmap_league_ids:
        league_bets = all_league_df[all_league_df['leagueId'] == lid] if not league else bet_df[bet_df['leagueId'] == lid]
        row = []
        for bt in ['home_win', 'away_win', 'handicap', 'total', 'first_kill', 'first_turret']:
            amount = league_bets[league_bets['betType'] == bt]['amount'].sum()
            row.append(float(amount))
        heat_map_data.append(row)
    
    heatmap_labels = []
    for lid in heatmap_league_ids:
        league_info = leagues[leagues['leagueId'] == lid]
        if not league_info.empty:
            heatmap_labels.append(league_info.iloc[0]['name'])
    
    return {
        'league': league,
        'totalAmount': float(total_amount),
        'betTypes': bet_types,
        'heatMapData': heat_map_data,
        'leagues': league_list,
        'betTypeLabels': [bet_type_mapping[bt] for bt in ['home_win', 'away_win', 'handicap', 'total', 'first_kill', 'first_turret']],
        'leagueLabels': heatmap_labels
    }
