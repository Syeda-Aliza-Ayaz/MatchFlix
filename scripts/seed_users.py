"""
Matchflix — User & Dimension Weights Seeder
============================================
Populates:
    - users                  (50 synthetic users)
    - user_dimension_weights (8 rows per user = 400 rows total)

Run this BEFORE matchflix_loader.py.

Install dependencies:
    pip install oracledb faker bcrypt
"""

import random
import bcrypt
import oracledb
from faker import Faker

fake = Faker()
random.seed(42)  # reproducible results — remove for fresh random each run

# =============================================================================
# CONFIG
# =============================================================================

import os
from dotenv import load_dotenv

# Load the .env file from the parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

DB_CONFIG = {
    "user":     os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "dsn":      os.getenv("DB_DSN")
}

NUM_USERS = 300  # increase to 100+ for a fuller dataset

# =============================================================================
# MBTI DISTRIBUTION
# Real-world approximate population percentages so your dataset
# doesn't just have 3 INFJs and 15 ESTJs
# =============================================================================

MBTI_DISTRIBUTION = [
    ("ISTJ", 11.6), ("ISFJ", 13.8), ("INFJ",  1.5), ("INTJ",  2.1),
    ("ISTP",  5.4), ("ISFP",  8.8), ("INFP",  4.4), ("INTP",  3.3),
    ("ESTP",  4.3), ("ESFP",  8.5), ("ENFP",  8.1), ("ENTP",  3.2),
    ("ESTJ",  8.7), ("ESFJ", 12.3), ("ENFJ",  2.5), ("ENTJ",  1.8),
]

MBTI_TYPES  = [m[0] for m in MBTI_DISTRIBUTION]
MBTI_WEIGHTS = [m[1] for m in MBTI_DISTRIBUTION]

# =============================================================================
# DEFAULT DIMENSION WEIGHTS
# Slight random variation per user around the system defaults
# so compatibility calculations produce realistic spread
# =============================================================================

DIMENSION_DEFAULTS = {
    "emotional_impact":    1.3,
    "cinematography":      1.0,
    "audio_design":        1.0,
    "narrative_coherence": 1.2,
    "moral_conflict":      1.1,
    "thematic_depth":      1.2,
    "pacing":              0.9,
    "rewatch_value":       1.0,
}

# =============================================================================
# MBTI PERSONALITY → DIMENSION WEIGHT BIASES
# Each type nudges certain dimensions up or down slightly.
# This means two INFJs will naturally have higher compatibility
# with each other than an INTJ and an ESFP.
# =============================================================================

MBTI_WEIGHT_BIAS = {
    # Analysts
    "INTJ": {"thematic_depth": +0.3, "narrative_coherence": +0.2, "pacing": -0.1},
    "INTP": {"thematic_depth": +0.2, "moral_conflict": +0.3,      "rewatch_value": -0.1},
    "ENTJ": {"narrative_coherence": +0.3, "pacing": +0.2,         "emotional_impact": -0.1},
    "ENTP": {"moral_conflict": +0.3, "thematic_depth": +0.2,      "rewatch_value": +0.1},
    # Diplomats
    "INFJ": {"emotional_impact": +0.3, "thematic_depth": +0.3,    "pacing": -0.1},
    "INFP": {"emotional_impact": +0.4, "moral_conflict": +0.2,    "cinematography": +0.1},
    "ENFJ": {"emotional_impact": +0.3, "narrative_coherence": +0.2, "thematic_depth": +0.1},
    "ENFP": {"emotional_impact": +0.3, "rewatch_value": +0.2,     "pacing": +0.1},
    # Sentinels
    "ISTJ": {"narrative_coherence": +0.3, "pacing": +0.1,         "moral_conflict": -0.1},
    "ISFJ": {"emotional_impact": +0.2, "rewatch_value": +0.3,     "thematic_depth": -0.1},
    "ESTJ": {"narrative_coherence": +0.3, "pacing": +0.2,         "thematic_depth": -0.2},
    "ESFJ": {"emotional_impact": +0.2, "rewatch_value": +0.3,     "moral_conflict": -0.1},
    # Explorers
    "ISTP": {"cinematography": +0.3, "audio_design": +0.2,        "thematic_depth": -0.1},
    "ISFP": {"cinematography": +0.3, "emotional_impact": +0.2,    "narrative_coherence": -0.1},
    "ESTP": {"pacing": +0.4, "audio_design": +0.2,                "thematic_depth": -0.2},
    "ESFP": {"pacing": +0.3, "rewatch_value": +0.3,               "thematic_depth": -0.2},
}

# =============================================================================
# HELPERS
# =============================================================================

def hash_password(plain: str) -> str:
    """bcrypt hash — matches what your Python backend should use."""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def generate_username(first: str, last: str, existing: set) -> str:
    """Generate a unique username from name parts."""
    base_options = [
        f"{first.lower()}_{last.lower()}",
        f"{first.lower()}{random.randint(10, 99)}",
        f"{first.lower()[0]}{last.lower()}{random.randint(10, 99)}",
        f"{last.lower()}_{first.lower()[0]}{random.randint(10, 99)}",
    ]
    for candidate in base_options:
        clean = candidate.replace(" ", "_").replace("-", "_")[:50]
        if clean not in existing:
            return clean
    # fallback — add random suffix
    fallback = f"{first.lower()[:6]}_{random.randint(1000, 9999)}"
    return fallback[:50]


def get_dimension_weights_for_mbti(mbti: str) -> dict:
    """
    Returns personalized dimension weights for a user based on their MBTI type.
    Applies type-specific biases + small random noise for individuality.
    All weights clamped to 0.5–2.0 range.
    """
    biases = MBTI_WEIGHT_BIAS.get(mbti, {})
    weights = {}

    for dim, default in DIMENSION_DEFAULTS.items():
        bias  = biases.get(dim, 0.0)
        noise = random.uniform(-0.05, 0.05)   # tiny random variation
        val   = round(default + bias + noise, 2)
        weights[dim] = max(0.5, min(2.0, val))  # clamp to valid range

    return weights


# =============================================================================
# MAIN SEEDER
# =============================================================================

def seed_users():
    print(f"Generating {NUM_USERS} users...\n")

    try:
        conn   = oracledb.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("Connected to Oracle Database.")

        existing_usernames = set()
        existing_emails    = set()
        inserted_users     = 0
        inserted_weights   = 0

        for i in range(NUM_USERS):

            # ── Generate profile ──────────────────────────────────────────────
            first        = fake.first_name()
            last         = fake.last_name()
            username     = generate_username(first, last, existing_usernames)
            email        = f"{username}@{fake.free_email_domain()}"
            display_name = f"{first} {last}"
            age          = random.randint(16, 45)
            mbti_type    = random.choices(MBTI_TYPES, weights=MBTI_WEIGHTS, k=1)[0]
            password     = hash_password(f"pass_{username}")   # test password
            avatar_url   = f"https://api.dicebear.com/7.x/thumbs/svg?seed={username}"

            # Guard uniqueness locally before hitting DB
            if email in existing_emails:
                email = f"{username}{random.randint(100,999)}@{fake.free_email_domain()}"

            existing_usernames.add(username)
            existing_emails.add(email)

            # ── Insert user ───────────────────────────────────────────────────
            try:
                user_id_var = cursor.var(oracledb.NUMBER)
                cursor.execute(
                    """
                    INSERT INTO users
                        (username, email, password_hash, display_name,
                         age, mbti_type, avatar_url)
                    VALUES (:1, :2, :3, :4, :5, :6, :7)
                    RETURNING user_id INTO :8
                    """,
                    [username, email, password, display_name,
                     age, mbti_type, avatar_url,
                     user_id_var]
                )
                new_user_id = int(user_id_var.getvalue()[0])
                inserted_users += 1

            except oracledb.IntegrityError as e:
                print(f"  Skipped user {username} — duplicate: {e}")
                conn.rollback()
                continue

            # ── Insert dimension weights (8 rows per user) ────────────────────
            weights = get_dimension_weights_for_mbti(mbti_type)

            for dimension, weight in weights.items():
                cursor.execute(
                    """
                    INSERT INTO user_dimension_weights
                        (user_id, dimension, weight)
                    VALUES (:1, :2, :3)
                    """,
                    [new_user_id, dimension, weight]
                )
                inserted_weights += 1

            # Progress + commit every 10 users
            if (i + 1) % 10 == 0:
                conn.commit()
                print(f"  [{i+1}/{NUM_USERS}] users inserted: {inserted_users}")

        # Final commit
        conn.commit()

        print(f"\n{'='*50}")
        print(f"  Users inserted            : {inserted_users}")
        print(f"  Dimension weights inserted : {inserted_weights}")
        print(f"  Weights per user           : {inserted_weights // max(inserted_users, 1)}")
        print(f"{'='*50}")
        print("\nDone. You can now run matchflix_loader.py")
        print(f"Set SEED_USER_ID = 1 in matchflix_loader.py (or any valid user_id above)")

    except Exception as e:
        print(f"\nFatal error: {e}")
        raise

    finally:
        if "conn" in locals() and conn:
            conn.close()
            print("Connection closed.")


# =============================================================================
# VERIFICATION QUERY — run after seeding to confirm
# =============================================================================

def verify():
    """Quick sanity check — prints user count and MBTI distribution."""
    try:
        conn   = oracledb.connect(**DB_CONFIG)
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM users WHERE is_deleted = 0")
        user_count = cursor.fetchone()[0]

        cursor.execute("""
            SELECT mbti_type, COUNT(*) AS cnt
            FROM users
            WHERE is_deleted = 0
            GROUP BY mbti_type
            ORDER BY cnt DESC
        """)
        mbti_dist = cursor.fetchall()

        cursor.execute("""
            SELECT COUNT(*) FROM user_dimension_weights
        """)
        weight_count = cursor.fetchone()[0]

        print(f"\n{'='*40}")
        print(f"  Total users   : {user_count}")
        print(f"  Total weights : {weight_count} ({weight_count // max(user_count,1)} per user)")
        print(f"\n  MBTI Distribution:")
        for mbti, cnt in mbti_dist:
            bar = "█" * cnt
            print(f"    {mbti:4s}  {bar}  ({cnt})")
        print(f"{'='*40}")

    except Exception as e:
        print(f"Verify error: {e}")
    finally:
        if "conn" in locals() and conn:
            conn.close()


if __name__ == "__main__":
    seed_users()
    verify()