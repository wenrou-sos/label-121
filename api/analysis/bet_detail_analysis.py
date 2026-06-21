import pandas as pd
import numpy as np
import random
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

_base_odds = {
    'home_win': 1.8, 'away_win': 2.1, 'handicap': 1.92,
    'total': 1.87, 'first_kill': 2.5, 'first_turret': 2.7
}

def _mask_user_id(uid: str) -> str:
    if len(uid) <= 4:
        return 'usr_' + '*' * len(uid)
    return f'usr_{uid[:2]}****{uid[-2:]}'

def _generate_bet_splits(total_amount: float, seed: int) -> list:
    random.seed(seed)
    if total_amount < 2000:
        count = random.randint(3, 6)
    elif total_amount < 10000:
        count = random.randint(6, 12)
    elif total_amount < 50000:
        count = random.randint(12, 20)
    else:
        count = random.randint(20, 35)

    weights = [random.uniform(0.5, 3.0) for _ in range(count)]
    total_weight = sum(weights)
    amounts = [int(total_amount * w / total_weight) for w in weights]

    diff = int(total_amount) - sum(amounts)
    for i in range(abs(diff)):
        idx = random.randint(0, count - 1)
        amounts[idx] += 1 if diff > 0 else -1

    amounts = sorted(amounts, reverse=True)
    return amounts

def _generate_bet_times(base_date: datetime, count: int, seed: int) -> list:
    random.seed(seed + 100)
    times = []
    for i in range(count):
        hour_offset = random.uniform(-12, 12)
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        bet_time = base_date + timedelta(hours=hour_offset, minutes=minute, seconds=second)
        times.append(bet_time)
    times.sort(reverse=True)
    return times

def _generate_user_ids(count: int, seed: int) -> list:
    random.seed(seed + 200)
    uids = []
    for i in range(count):
        uid_num = random.randint(1000, 99999)
        uids.append(f'uid{uid_num:05d}')
    return uids

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

    league_id = league_id.upper()
    filtered = bet_df[
        (bet_df['leagueId'] == league_id) &
        (bet_df['betType'] == bet_type)
    ].copy()

    league_info = leagues_df[leagues_df['leagueId'] == league_id]
    league_name = league_info.iloc[0]['name'] if not league_info.empty else league_id

    if filtered.empty:
        return {
            'leagueId': league_id,
            'leagueName': league_name,
            'betType': bet_type,
            'betTypeName': _bet_type_mapping.get(bet_type, bet_type),
            'total': 0,
            'page': page,
            'pageSize': page_size,
            'totalPages': 0,
            'records': []
        }

    seed = hash(f'{league_id}_{bet_type}') % 100000
    total_amount = float(filtered['amount'].sum())
    base_date = datetime(2026, 6, 20, 18, 0, 0)

    amounts = _generate_bet_splits(total_amount, seed)
    bet_times = _generate_bet_times(base_date, len(amounts), seed)
    user_ids = _generate_user_ids(len(amounts), seed)

    match_info = matches_df[matches_df['leagueId'] == league_id]
    match_names = []
    if not match_info.empty:
        for _, m in match_info.iterrows():
            t1 = teams_df[teams_df['teamId'] == m['team1Id']]
            t2 = teams_df[teams_df['teamId'] == m['team2Id']]
            t1n = t1.iloc[0]['name'] if not t1.empty else m['team1Id']
            t2n = t2.iloc[0]['name'] if not t2.empty else m['team2Id']
            match_names.append({'matchId': m['matchId'], 'name': f'{t1n} vs {t2n}'})

    random.seed(seed + 300)
    base_odds = _base_odds.get(bet_type, 2.0)

    records = []
    for i in range(len(amounts)):
        odds_jitter = random.uniform(-0.08, 0.08)
        bet_odds = round(base_odds + odds_jitter, 2)

        if match_names:
            match_sel = random.choice(match_names)
            match_id = match_sel['matchId']
            match_name = match_sel['name']
        else:
            match_id = ''
            match_name = ''

        records.append({
            'betId': f'B{league_id[:2]}{10000 + i:05d}',
            'matchId': match_id,
            'matchName': match_name,
            'userId': _mask_user_id(user_ids[i]),
            'amount': float(amounts[i]),
            'odds': bet_odds,
            'side': filtered.iloc[i % len(filtered)]['side'] if len(filtered) > 0 else 'home',
            'betTime': bet_times[i].strftime('%Y-%m-%d %H:%M:%S')
        })

    total = len(records)
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
        'totalAmount': total_amount,
        'page': page,
        'pageSize': page_size,
        'totalPages': total_pages,
        'records': page_records
    }
