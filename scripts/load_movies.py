"""
Matchflix — TMDB Dataset Loader
================================
Dataset: https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata
Required files (place in data directory as this script):
    - tmdb_5000_movies.csv
    - tmdb_5000_credits.csv

Install dependencies:
    pip install pandas oracledb
"""

import json
import random
import pandas as pd
import oracledb

# =============================================================================
# CONFIG — update these before running
# =============================================================================

import os
from dotenv import load_dotenv

# Load the .env file from the parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

DB_CONFIG = {
    "user":     os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "dsn":      os.getenv("DB_DSN") # host:port/service_name
}

# The user_id that all seed ratings will be attributed to.
# Must already exist in your users table.
SEED_USER_ID = 1

# TMDB poster base URL — poster_path from dataset completes this
POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500"

# =============================================================================
# GENRE-BIASED DIMENSION SCORE GENERATOR
# =============================================================================

def get_dimension_scores(genres: list[str]) -> dict:
    """
    Generates realistic dimension scores (1.00–10.00) biased by genre.
    Returns a dict with all 8 dimension keys.
    """
    scores = {
        "emotional_impact":    round(random.uniform(4.0, 9.0), 2),
        "cinematography":      round(random.uniform(5.0, 9.5), 2),
        "audio_design":        round(random.uniform(4.0, 9.0), 2),
        "narrative_coherence": round(random.uniform(5.0, 9.5), 2),
        "moral_conflict":      round(random.uniform(3.0, 8.0), 2),
        "thematic_depth":      round(random.uniform(3.0, 8.0), 2),
        "pacing":              round(random.uniform(4.0, 9.0), 2),
        "rewatch_value":       round(random.uniform(2.0, 9.0), 2),
    }

    # Genre biases — nudge specific dimensions upward
    genre_set = {g.lower() for g in genres}

    if genre_set & {"action", "thriller"}:
        scores["pacing"]         = round(random.uniform(7.0, 10.0), 2)
        scores["audio_design"]   = round(random.uniform(6.5, 10.0), 2)

    if "drama" in genre_set:
        scores["thematic_depth"]    = round(random.uniform(7.0, 10.0), 2)
        scores["emotional_impact"]  = round(random.uniform(7.0, 10.0), 2)

    if "horror" in genre_set:
        scores["audio_design"]      = round(random.uniform(7.5, 10.0), 2)
        scores["moral_conflict"]    = round(random.uniform(6.0, 10.0), 2)

    if genre_set & {"science fiction", "sci-fi"}:
        scores["thematic_depth"]    = round(random.uniform(6.5, 10.0), 2)
        scores["narrative_coherence"] = round(random.uniform(6.0, 10.0), 2)

    if "romance" in genre_set:
        scores["emotional_impact"]  = round(random.uniform(7.0, 10.0), 2)
        scores["rewatch_value"]     = round(random.uniform(6.0, 10.0), 2)

    if "documentary" in genre_set:
        scores["thematic_depth"]    = round(random.uniform(7.5, 10.0), 2)
        scores["narrative_coherence"] = round(random.uniform(7.0, 10.0), 2)
        scores["rewatch_value"]     = round(random.uniform(3.0, 7.0), 2)

    if "animation" in genre_set:
        scores["cinematography"]    = round(random.uniform(7.0, 10.0), 2)
        scores["rewatch_value"]     = round(random.uniform(7.0, 10.0), 2)

    # Clamp all scores to valid range just in case
    for k in scores:
        scores[k] = max(1.0, min(10.0, scores[k]))

    return scores


# =============================================================================
# HELPERS
# =============================================================================

def parse_json_column(raw) -> list:
    """Safely parse a JSON string column from the CSV."""
    try:
        return json.loads(raw) if pd.notnull(raw) else []
    except (json.JSONDecodeError, TypeError):
        return []


def extract_director(crew_json: str) -> str | None:
    """Extract director name from credits crew JSON string."""
    crew = parse_json_column(crew_json)
    for member in crew:
        if member.get("job") == "Director":
            return member.get("name")
    return None


def extract_genre_names(genres_json: str) -> list[str]:
    """Extract list of genre name strings from genres JSON column."""
    genres = parse_json_column(genres_json)
    return [g["name"] for g in genres if "name" in g]


def safe_year(release_date) -> int:
    """Parse year from YYYY-MM-DD string, default 2000 on failure."""
    try:
        return int(str(release_date).split("-")[0])
    except (ValueError, AttributeError):
        return 2000


def safe_runtime(runtime) -> int:
    """Return runtime or default 120 if null/invalid."""
    try:
        val = int(runtime)
        return val if val > 0 else 120
    except (ValueError, TypeError):
        return 120


def build_poster_url(poster_path) -> str | None:
    """Build full poster URL from poster_path column."""
    if pd.notnull(poster_path) and str(poster_path).startswith("/"):
        return f"{POSTER_BASE_URL}{poster_path}"
    return None


# =============================================================================
# GENRE CACHE — ensures genres table is not duplicated
# =============================================================================

def get_or_create_genre(cursor, name: str, genre_cache: dict) -> int:
    """Return genre_id for name, inserting if not already present."""
    if name in genre_cache:
        return genre_cache[name]

    # Check if already in DB
    cursor.execute("SELECT genre_id FROM genres WHERE name = :1", [name])
    row = cursor.fetchone()
    if row:
        genre_cache[name] = row[0]
        return row[0]

    # Insert new genre
    cursor.execute(
        "INSERT INTO genres (name) VALUES (:1) RETURNING genre_id INTO :2",
        [name, cursor.var(oracledb.NUMBER)]
    )
    # Re-fetch since RETURNING with oracledb needs var
    cursor.execute("SELECT genre_id FROM genres WHERE name = :1", [name])
    genre_id = cursor.fetchone()[0]
    genre_cache[name] = genre_id
    return genre_id


# =============================================================================
# MAIN LOADER
# =============================================================================

def load_data():
    print("Loading CSV files...")

    movies_df = pd.read_csv("../data/tmdb_5000_movies.csv")
    credits_df = pd.read_csv("../data/tmdb_5000_credits.csv")

    # credits CSV uses 'movie_id' column to join with movies 'id'
    credits_df = credits_df.rename(columns={"movie_id": "id"})
    df = pd.merge(movies_df, credits_df[["id", "crew"]], on="id", how="left")

    print(f"Loaded {len(df)} movies. Connecting to Oracle...")

    try:
        conn = oracledb.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("Connected to Oracle Database.\n")

        genre_cache = {}          # name → genre_id
        skipped_dupes = 0
        skipped_errors = 0
        inserted = 0

        for index, row in df.iterrows():
            title        = str(row["title"]).strip()
            release_year = safe_year(row.get("release_date"))
            runtime      = safe_runtime(row.get("runtime"))
            synopsis     = str(row["overview"]).strip() if pd.notnull(row.get("overview")) else "No synopsis available."
            tmdb_id      = int(row["id"]) if pd.notnull(row.get("id")) else None
            poster_url   = build_poster_url(row.get("poster_path"))
            director     = extract_director(row.get("crew", "[]"))
            genre_names  = extract_genre_names(row.get("genres", "[]"))

            # ── INSERT MOVIE ─────────────────────────────────────────────────
            try:
                movie_id_var = cursor.var(oracledb.NUMBER)
                cursor.execute(
                    """
                    INSERT INTO movies
                        (title, release_year, runtime_minutes, synopsis,
                         tmdb_id, poster_url, director)
                    VALUES (:1, :2, :3, :4, :5, :6, :7)
                    RETURNING movie_id INTO :8
                    """,
                    [title, release_year, runtime, synopsis,
                     tmdb_id, poster_url, director,
                     movie_id_var]
                )
                new_movie_id = int(movie_id_var.getvalue()[0])

            except oracledb.IntegrityError as e:
                # uq_movie_identity or uq_movies_tmdb fired — skip duplicate
                if "ORA-00001" in str(e):
                    skipped_dupes += 1
                    conn.rollback()
                    continue
                else:
                    print(f"  Row {index} — unexpected IntegrityError: {e}")
                    skipped_errors += 1
                    conn.rollback()
                    continue

            # ── INSERT GENRE MAPPINGS ─────────────────────────────────────────
            for genre_name in genre_names:
                try:
                    genre_id = get_or_create_genre(cursor, genre_name, genre_cache)
                    cursor.execute(
                        "INSERT INTO movie_genre_map (movie_id, genre_id) VALUES (:1, :2)",
                        [new_movie_id, genre_id]
                    )
                except oracledb.IntegrityError:
                    pass  # duplicate genre mapping — safe to skip

            # ── INSERT SEED RATING ────────────────────────────────────────────
            # Generates genre-biased scores so your compatibility math has data
            scores = get_dimension_scores(genre_names)
            overall = round(
                sum(scores.values()) / len(scores), 2
            )

            try:
                cursor.execute(
                    """
                    INSERT INTO user_ratings (
                        user_id, movie_id,
                        emotional_impact, cinematography, audio_design,
                        narrative_coherence, moral_conflict, thematic_depth,
                        pacing, rewatch_value, overall_score
                    ) VALUES (
                        :1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11
                    )
                    """,
                    [
                        SEED_USER_ID, new_movie_id,
                        scores["emotional_impact"],
                        scores["cinematography"],
                        scores["audio_design"],
                        scores["narrative_coherence"],
                        scores["moral_conflict"],
                        scores["thematic_depth"],
                        scores["pacing"],
                        scores["rewatch_value"],
                        overall
                    ]
                )
            except oracledb.IntegrityError:
                # user already rated this movie — skip
                pass

            inserted += 1

            # Commit in batches of 100
            if index % 100 == 0 and index > 0:
                conn.commit()
                print(f"  [{index}] inserted={inserted}  skipped_dupes={skipped_dupes}  errors={skipped_errors}")

        # Final commit
        conn.commit()
        print(f"\nDone.")
        print(f"  Movies inserted : {inserted}")
        print(f"  Dupes skipped   : {skipped_dupes}")
        print(f"  Errors skipped  : {skipped_errors}")

    except Exception as e:
        print(f"\nFatal error: {e}")
        raise

    finally:
        if "conn" in locals() and conn:
            conn.close()
            print("Connection closed.")


if __name__ == "__main__":
    load_data()