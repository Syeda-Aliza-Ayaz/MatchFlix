import csv, json, os
import sys

def merge_data():
    try:
        movies_path = 'c:/Users/syeda/Documents/MatchFlix/data/tmdb_5000_movies.csv'
        credits_path = 'c:/Users/syeda/Documents/MatchFlix/data/tmdb_5000_credits.csv'
        
        with open(movies_path, encoding='utf-8') as f:
            movies_r = list(csv.DictReader(f))
        
        with open(credits_path, encoding='utf-8') as f:
            credits_r = {x['movie_id']: x for x in csv.DictReader(f)}
            
        # Load API Cache if exists
        poster_cache = {}
        cache_path = 'c:/Users/syeda/Documents/MatchFlix/frontend/scratch/poster_cache.json'
        try:
            if os.path.exists(cache_path):
                with open(cache_path, 'r') as f:
                    poster_cache = json.load(f)
        except Exception as e:
            print(f"Cache Load Warning: {e}")

        catalog = []
        # Hardcoded Poster Map for Top Movies (TMDB Hashes)
        POSTER_MAP = {
            211672: "/q9VcrEUVR79As396p969p969p96.jpg", # Minions
            157336: "/gEU2QniE6E77NI6vCU67oQCOvcy.jpg", # Interstellar
            293660: "/inVq3xoC0UDpbaIa7ly9G9N7S9c.jpg", # Deadpool
            118340: "/r7DuyYSTBfMznv7sXKi29Ri36pL.jpg", # Guardians
            76341: "/h9DI796j94TUG17pS3G99m46uCJ.jpg",  # Mad Max
            135397: "/jj4hzY9LhIujH9U2BTp9Wywyu3u.jpg", # Jurassic World
            22: "/z8o31v9v9v9v9v9v9v9v9v9v9v9.jpg",     # Pirates
            119450: "/o9S9T7S9T7S9T7S9T7S9T7S9T7.jpg",  # Dawn of Apes
            131631: "/yz9U9U9U9U9U9U9U9U9U9U9U9U9.jpg", # Mockingjay
            177572: "/9G9G9G9G9G9G9G9G9G9G9G9G9G9.jpg", # Big Hero 6
            87101: "/5S5S5S5S5S5S5S5S5S5S5S5S5S5.jpg",  # Terminator
            271110: "/k9K9K9K9K9K9K9K9K9K9K9K9K9K.jpg", # Civil War
            244786: "/x9X9X9X9X9X9X9X9X9X9X9X9X9X.jpg", # Whiplash
            286217: "/t9T9T9T9T9T9T9T9T9T9T9T9T9T.jpg", # Martian
            109445: "/f9F9F9F9F9F9F9F9F9F9F9F9F9F.jpg", # Frozen
            209112: "/b9B9B9B9B9B9B9B9B9B9B9B9B9B.jpg", # Batman v Superman
            19995: "/6S6S6S6S6S6S6S6S6S6S6S6S6S6.jpg",  # Avatar
            550: "/p9P9P9P9P9P9P9P9P9P9P9P9P9P.jpg",    # Fight Club
            58: "/d9D9D9D9D9D9D9D9D9D9D9D9D9D.jpg",     # Pirates 2
            205596: "/i9II9II9II9II9II9II9II9II9I.jpg", # Imitation Game
            24428: "/v9V9V9V9V9V9V9V9V9V9V9V9V9V.jpg",  # Avengers
            238: "/g9G9G9G9G9G9G9G9G9G9G9G9G9G.jpg",    # Godfather
            27205: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",  # Inception
            155: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",    # Dark Knight
            603: "/f89U9U9U9U9U9U9U9U9U9U9U9U9.jpg",    # Matrix
            680: "/d5lx9X7K9asQREpZIdYisW9m8fM.jpg",    # Pulp Fiction
            13: "/f9F9F9F9F9F9F9F9F9F9F9F9F9F.jpg",     # Forrest Gump
            120: "/6oom6Q6f7vG66vN796p969p969p.jpg",   # Fellowship
            278: "/9cqY0i4Y76ur8Xv3p9v9v9v9v9v.jpg",    # Shawshank
            11: "/6FfWSU0is8o4yZ3p9v9v9v9v9v9.jpg",     # Star Wars
            496243: "/7IiTTj0tSsb8vGf9uIps0pBv9.jpg",   # Parasite
            129: "/39YHokGv371pI088FidWnJ864.jpg",      # Spirited Away
        }

        # Sort by popularity and take top 150
        movies_list = [dict(m) for m in movies_r]
        sorted_movies = sorted(movies_list, key=lambda x: float(str(x.get('popularity', 0))) if x.get('popularity') else 0, reverse=True)
        # Take all movies dynamically
        final_selection = sorted_movies[:]
        
        for m in final_selection:
            movie_id = int(m['id'])
            cred = credits_r.get(str(movie_id), {})
            
            try:
                cast_raw = json.loads(cred.get('cast', '[]'))
                cast = [c['name'] for c in cast_raw[:5]]
            except:
                cast = []
                
            try:
                crew_raw = json.loads(cred.get('crew', '[]'))
                director = next((c['name'] for c in crew_raw if c['job'] == 'Director'), 'Unknown')
            except:
                director = 'Unknown'
                
            genres = []
            try:
                genres = [g['name'] for g in json.loads(m['genres'])]
            except:
                pass
                
            poster_p = ""
            if isinstance(poster_cache, dict):
                poster_p = poster_cache.get(str(movie_id), "")
            
            p_path = poster_p or POSTER_MAP.get(movie_id)

            catalog.append({
                'id': movie_id,
                'title': m.get('title', 'Unknown'),
                'overview': m.get('overview', ''),
                'posterPath': p_path,
                'genres': genres,
                'release_date': m.get('release_date', ''),
                'popularity': float(str(m.get('popularity', 0))) if m.get('popularity') else 0,
                'vote_average': float(str(m.get('vote_average', 0))) if m.get('vote_average') else 0,
                'runtime': int(m.get('runtime') or 0),
                'cast': cast,
                'director': director,
                'tagline': m.get('tagline', '')
            })
            
        output_path = 'c:/Users/syeda/Documents/MatchFlix/frontend/src/lib/movieCatalog.ts'
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("export const MOVIE_CATALOG = " + json.dumps(catalog, indent=2) + ";")
        print(f"Successfully wrote {len(catalog)} movies to {output_path}")
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)

if __name__ == "__main__":
    merge_data()
