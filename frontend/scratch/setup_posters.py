import csv
import json
import os
import requests
import time
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR.parent / 'data'
SCRATCH_DIR = BASE_DIR / 'scratch'
CACHE_FILE = SCRATCH_DIR / 'poster_cache.json'
ENV_FILE = BASE_DIR / '.env.local'

def get_api_key():
    if ENV_FILE.exists():
        with open(ENV_FILE, 'r') as f:
            for line in f:
                if 'NEXT_PUBLIC_TMDB_API_KEY' in line:
                    return line.split('=')[1].strip()
    return os.environ.get('NEXT_PUBLIC_TMDB_API_KEY')

def setup_posters():
    api_key = get_api_key()
    if not api_key:
        print("ERROR: NEXT_PUBLIC_TMDB_API_KEY not found in .env.local or environment.")
        return

    # Load cache if exists
    cache = {}
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, 'r') as f:
                loaded = json.load(f)
                if isinstance(loaded, dict):
                    cache = loaded
        except:
            pass

    movies_path = DATA_DIR / 'tmdb_5000_movies.csv'
    if not movies_path.exists():
        print(f"ERROR: Movies CSV not found at {movies_path}")
        return

    with open(movies_path, encoding='utf-8') as f:
        reader = csv.DictReader(f)
        movies = list(reader)

    print(f"Starting hydration for {len(movies)} movies...")
    
    count = 0
    # Process all movies
    for m in movies:
        m_id = str(m.get('id', ''))
        if not m_id: continue
        
        # Safe dict check
        if m_id in cache:
            entry = cache.get(m_id)
            if entry is not None: continue
            
        try:
            # TMDB Movie Details Endpoint
            # Handle both standard API Key and Bearer Token
            headers = {}
            params = {}
            if api_key.startswith('eyJ'):
                headers['Authorization'] = f'Bearer {api_key}'
            else:
                params['api_key'] = api_key

            url = f"https://api.themoviedb.org/3/movie/{m_id}"
            resp = requests.get(url, params=params, headers=headers)
            
            if resp.status_code == 200:
                data = resp.json()
                path = data.get('poster_path')
                if path:
                    cache[m_id] = path
                    count += 1
                    print(f"[{count}] Saved poster for {m_id}: {path}")
                    if count % 50 == 0:
                        # Periodic save
                        with open(CACHE_FILE, 'w') as f:
                            json.dump(cache, f)
                else:
                    print(f"No poster_path for {m_id}")
                    cache[m_id] = None
            elif resp.status_code == 429:
                print(f"Rate limited (429) for {m_id}. Skipping for now...")
            else:
                print(f"Failed {m_id} - Status: {resp.status_code} - Error: {resp.text[:100]}")
                cache[m_id] = None # Mark as failed
        except Exception as e:
            print(f"Error fetching {m_id}: {str(e)}")
            continue

    # Final Save
    with open(CACHE_FILE, 'w') as f:
        json.dump(cache, f)
    
    print(f"Hydration complete. Total cached: {len(cache)}")

if __name__ == "__main__":
    setup_posters()
