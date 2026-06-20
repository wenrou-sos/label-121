import pandas as pd
import numpy as np
from api.data_loader import load_upset_history, load_leagues

def get_upset_analysis():
    upset_df = load_upset_history()
    leagues_df = load_leagues()
    
    league_level_map = dict(zip(leagues_df['leagueId'], leagues_df['level']))
    
    region_stats = []
    
    all_leagues = upset_df['league'].unique()
    
    for league_id in all_leagues:
        league_data = upset_df[upset_df['league'] == league_id]
        league_info = leagues_df[leagues_df['leagueId'] == league_id]
        
        total_matches = len(league_data)
        upset_count = len(league_data[league_data['winner'] == league_data['underdog']])
        
        if not league_info.empty:
            region_name = league_info.iloc[0]['name']
            region_level = league_info.iloc[0]['level']
        else:
            region_name = league_id
            region_level = league_level_map.get(league_id, 'wildcard')
        
        region_stats.append({
            'region': league_id,
            'regionName': region_name,
            'regionLevel': region_level,
            'totalMatches': int(total_matches),
            'upsetCount': int(upset_count),
            'upsetRate': float(upset_count / total_matches) if total_matches > 0 else 0
        })
    
    region_stats.sort(key=lambda x: x['upsetRate'], reverse=True)
    
    upset_history = []
    for _, row in upset_df.iterrows():
        upset_history.append({
            'matchId': row['matchId'],
            'date': row['date'].strftime('%Y-%m-%d'),
            'league': row['league'],
            'favorite': row['favorite'],
            'underdog': row['underdog'],
            'winner': row['winner'],
            'upsetMagnitude': float(row['upsetMagnitude']),
            'preMatchOddsFavorite': float(row['preMatchOddsFavorite']),
            'preMatchOddsUnderdog': float(row['preMatchOddsUnderdog']),
            'isUpset': row['winner'] == row['underdog']
        })
    
    upset_history.sort(key=lambda x: x['upsetMagnitude'], reverse=True)
    
    major_regions = [r for r in region_stats if r['regionLevel'] == 'major']
    wildcard_regions = [r for r in region_stats if r['regionLevel'] == 'wildcard']
    
    major_avg_upset = sum(r['upsetRate'] for r in major_regions) / len(major_regions) if major_regions else 0
    wildcard_avg_upset = sum(r['upsetRate'] for r in wildcard_regions) / len(wildcard_regions) if wildcard_regions else 0
    
    return {
        'regionStats': region_stats,
        'upsetHistory': upset_history,
        'summary': {
            'totalUpsets': len([u for u in upset_history if u['isUpset']]),
            'majorAvgUpsetRate': float(major_avg_upset),
            'wildcardAvgUpsetRate': float(wildcard_avg_upset),
            'biggestUpset': max(upset_history, key=lambda x: x['upsetMagnitude']) if upset_history else None
        }
    }
