import pandas as pd
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

def load_leagues():
    return pd.read_csv(os.path.join(DATA_DIR, 'leagues.csv'))

def load_teams():
    return pd.read_csv(os.path.join(DATA_DIR, 'teams.csv'))

def load_matches():
    return pd.read_csv(os.path.join(DATA_DIR, 'matches.csv'))

def load_odds_history():
    df = pd.read_csv(os.path.join(DATA_DIR, 'odds_history.csv'))
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    return df

def load_bet_distribution():
    return pd.read_csv(os.path.join(DATA_DIR, 'bet_distribution.csv'))

def load_head_to_head():
    df = pd.read_csv(os.path.join(DATA_DIR, 'head_to_head.csv'))
    df['date'] = pd.to_datetime(df['date'])
    return df

def load_live_matches():
    return pd.read_csv(os.path.join(DATA_DIR, 'live_matches.csv'))

def load_upset_history():
    df = pd.read_csv(os.path.join(DATA_DIR, 'upset_history.csv'))
    df['date'] = pd.to_datetime(df['date'])
    return df
