import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from api.data_loader import load_bet_distribution, load_leagues, load_teams, load_matches

_bet_type_mapping = {
    'home_win': '主队胜',
    'away_win': '客队胜',
    'handicap': '让分盘',
    'total': '大小盘',
    'first_kill': '首杀',
    'first_turret': '首塔'
}

def _generate_user_id(bet_id: str) -> str:
    suffix = bet_id[-4:] if len(bet_id) >= 4 else bet_id
    return f'usr_{"*" * (8 - len(suffix))}{suffix}'

def _generate_odds(bet_type: str, amount: float, idx: int) -> float:
    base = {
        'home_win': 1.8, 'away_win': 2.1, 'handicap': 1.9,
        'total': 1.85, 'first_kill': 2.5, 'first_turret': 2.7
    }
    seed = (idx * 13 + amount % 100) / 1000
    return round(base.get(bet_type, 2.0) + seed, 2)

def _generate_timestamp(bet_id: str, idx: int) -> str:
    base = datetime(2026, 6, 20, 12, 0, 0)
    delta = timedelta(
        hours=(idx % 8),
        minutes=((idx * 17) % 60),
        seconds=((idx * 23) % 60)
    )
    return (base + delta).strftime('%Y-%m-%d %H:%M:%S')

def get_bet_details(
    league_id: str,
    bet_type: str,
    page: int = 1,
    page_size: int = 10
) -> dict:
    bet_df = load_bet_distribution()
    leagues_df = load_leagues()
    matches_df = load_matches()
    teams_df = load_teams()

    filtered = bet_df[
        (bet_df['leagueId'] == league_id.upper()) &
        (bet_df['betType'] == bet_type)
    ].copy()

    total = len(filtered)

    if filtered.empty:
        return {
            'leagueId': league_id,
            'leagueName': '',
            'betType': bet_type,
            'betTypeName': _bet_type_mapping.get(bet_type, bet_type),
            'total': 0,
            'page': page,
            'pageSize': page_size,
            'totalPages': 0,
            'records': []
        }

    league_info = leagues_df[leagues_df['leagueId'] == league_id.upper()]
    league_name = league_info.iloc[0]['name'] if not league_info.empty else league_id

    filtered = filtered.reset_index(drop=True)
    records = []
    for i, row in filtered.iterrows():
        match_info = matches_df[matches_df['matchId'] == row['matchId']]
        match_name = ''
        if not match_info.empty:
            t1 = teams_df[teams_df['teamId'] == match_info.iloc[0]['team1Id']]
            t2 = teams_df[teams_df['teamId'] == match_info.iloc[0]['team2Id']]
            t1n = t1.iloc[0]['name'] if not t1.empty else match_info.iloc[0]['team1Id']
            t2n = t2.iloc[0]['name'] if not t2.empty else match_info.iloc[0]['team2Id']
            match_name = f'{t1n} vs {t2n}'

        records.append({
            'betId': row['betId'],
            'matchId': row['matchId'],
            'matchName': match_name,
            'userId': _generate_user_id(row['betId']),
            'amount': float(row['amount']),
            'odds': _generate_odds(row['betType'], row['amount'], i),
            'side': row['side'],
            'betTime': _generate_timestamp(row['betId'], i)
        })

    records.sort(key=lambda x: x['betTime'], reverse=True)

    total_pages = (total + page_size - 1) // page_size
    start = (page - 1) * page_size
    end = start + page_size
    page_records = records[start:end]

    return {
        'leagueId': league_id,
        'leagueName': league_name,
        'betType': bet_type,
        'betTypeName': _bet_type_mapping.get(bet_type, bet_type),
        'total': total,
        'page': page,
        'pageSize': page_size,
        'totalPages': total_pages,
        'records': page_records
    }
