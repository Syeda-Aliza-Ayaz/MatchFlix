-- =============================================================================
-- MATCHFLIX — Supabase (PostgreSQL) Database Schema
-- Translated from Oracle SQL
-- =============================================================================

-- =============================================================================
-- SECTION 1: UTILITY FUNCTIONS (For Updated At Triggers)
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================================================
-- SECTION 2: CREATE TABLES & RLS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 2.1 USERS
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    user_id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username        VARCHAR(50) NOT NULL UNIQUE,
    email           VARCHAR(120) NOT NULL UNIQUE,
    password_hash   VARCHAR(255), 
    display_name    VARCHAR(80),
    age             INTEGER CHECK (age BETWEEN 0 AND 150),
    mbti_type       VARCHAR(4) CHECK (mbti_type IN (
                        'INTJ','INTP','ENTJ','ENTP',
                        'INFJ','INFP','ENFJ','ENFP',
                        'ISTJ','ISFJ','ESTJ','ESFJ',
                        'ISTP','ISFP','ESTP','ESFP'
                    )),
    avatar_url      TEXT,
    is_deleted      BOOLEAN DEFAULT FALSE NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER handle_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2.2 USER_DIMENSION_WEIGHTS
-- -----------------------------------------------------------------------------
CREATE TABLE user_dimension_weights (
    weight_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    dimension   VARCHAR(30) NOT NULL CHECK (dimension IN (
                    'emotional_impact','cinematography','audio_design',
                    'narrative_coherence','moral_conflict','thematic_depth',
                    'pacing','rewatch_value'
                )),
    weight      NUMERIC(4,2) DEFAULT 1.00 NOT NULL CHECK (weight > 0),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    UNIQUE (user_id, dimension)
);

CREATE TRIGGER handle_udw_updated_at
BEFORE UPDATE ON user_dimension_weights
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
ALTER TABLE user_dimension_weights ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2.3 MOVIES
-- -----------------------------------------------------------------------------
CREATE TABLE movies (
    movie_id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title               VARCHAR(255) NOT NULL,
    release_year        INTEGER CHECK (release_year BETWEEN 1888 AND 2100),
    runtime_minutes     INTEGER CHECK (runtime_minutes > 0),
    director            VARCHAR(120),
    poster_url          TEXT,
    synopsis            TEXT,
    tmdb_id             BIGINT UNIQUE,
    imdb_id             VARCHAR(20) UNIQUE,
    is_deleted          BOOLEAN DEFAULT FALSE NOT NULL,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    UNIQUE (title, release_year)
);
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2.4 GENRES
-- -----------------------------------------------------------------------------
CREATE TABLE genres (
    genre_id    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(60) NOT NULL UNIQUE
);
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2.5 MOVIE_GENRE_MAP
-- -----------------------------------------------------------------------------
CREATE TABLE movie_genre_map (
    movie_id    BIGINT NOT NULL REFERENCES movies(movie_id) ON DELETE CASCADE,
    genre_id    INTEGER NOT NULL REFERENCES genres(genre_id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, genre_id)
);
ALTER TABLE movie_genre_map ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2.6 USER_RATINGS
-- -----------------------------------------------------------------------------
CREATE TABLE user_ratings (
    rating_id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    movie_id            BIGINT NOT NULL REFERENCES movies(movie_id) ON DELETE CASCADE,

    emotional_impact    NUMERIC(4,2) NOT NULL CHECK (emotional_impact BETWEEN 1.00 AND 10.00),
    cinematography      NUMERIC(4,2) NOT NULL CHECK (cinematography BETWEEN 1.00 AND 10.00),
    audio_design        NUMERIC(4,2) NOT NULL CHECK (audio_design BETWEEN 1.00 AND 10.00),
    narrative_coherence NUMERIC(4,2) NOT NULL CHECK (narrative_coherence BETWEEN 1.00 AND 10.00),
    moral_conflict      NUMERIC(4,2) NOT NULL CHECK (moral_conflict BETWEEN 1.00 AND 10.00),
    thematic_depth      NUMERIC(4,2) NOT NULL CHECK (thematic_depth BETWEEN 1.00 AND 10.00),
    pacing              NUMERIC(4,2) NOT NULL CHECK (pacing BETWEEN 1.00 AND 10.00),
    rewatch_value       NUMERIC(4,2) NOT NULL CHECK (rewatch_value BETWEEN 1.00 AND 10.00),

    overall_score       NUMERIC(4,2) CHECK (overall_score BETWEEN 1.00 AND 10.00),
    review_text         TEXT,
    watched_at          DATE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    UNIQUE (user_id, movie_id)
);

CREATE TRIGGER handle_ur_updated_at
BEFORE UPDATE ON user_ratings
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2.7 COMPATIBILITY_CACHE
-- -----------------------------------------------------------------------------
CREATE TABLE compatibility_cache (
    cache_id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_a_id           BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    user_b_id           BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

    overall_score       NUMERIC(5,4) NOT NULL CHECK (overall_score BETWEEN 0 AND 1),
    emotional_align     NUMERIC(5,4) NOT NULL CHECK (emotional_align BETWEEN 0 AND 1),
    cinematography_align NUMERIC(5,4) NOT NULL CHECK (cinematography_align BETWEEN 0 AND 1),
    audio_align         NUMERIC(5,4) NOT NULL CHECK (audio_align BETWEEN 0 AND 1),
    narrative_align     NUMERIC(5,4) NOT NULL CHECK (narrative_align BETWEEN 0 AND 1),
    moral_align         NUMERIC(5,4) NOT NULL CHECK (moral_align BETWEEN 0 AND 1),
    thematic_align      NUMERIC(5,4) NOT NULL CHECK (thematic_align BETWEEN 0 AND 1),
    pacing_align        NUMERIC(5,4) NOT NULL CHECK (pacing_align BETWEEN 0 AND 1),
    rewatch_align       NUMERIC(5,4) NOT NULL CHECK (rewatch_align BETWEEN 0 AND 1),

    most_aligned_dim    VARCHAR(30) CHECK (most_aligned_dim IN (
                            'emotional_impact','cinematography','audio_design',
                            'narrative_coherence','moral_conflict','thematic_depth',
                            'pacing','rewatch_value'
                        )),
    least_aligned_dim   VARCHAR(30) CHECK (least_aligned_dim IN (
                            'emotional_impact','cinematography','audio_design',
                            'narrative_coherence','moral_conflict','thematic_depth',
                            'pacing','rewatch_value'
                        )),
    shared_movie_count  INTEGER DEFAULT 0 NOT NULL,
    is_stale            BOOLEAN DEFAULT FALSE NOT NULL,
    archetype           VARCHAR(60),
    conflict_triggers   JSONB,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    calculated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    UNIQUE (user_a_id, user_b_id),
    CHECK (user_a_id < user_b_id)
);
ALTER TABLE compatibility_cache ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2.8 MATCH_SESSIONS
-- -----------------------------------------------------------------------------
CREATE TABLE match_sessions (
    session_id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    initiated_by        BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    matched_with        BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    compatibility_score NUMERIC(5,4) NOT NULL CHECK (compatibility_score BETWEEN 0 AND 1),
    archetype           VARCHAR(60),
    conflict_triggers   JSONB,
    most_aligned_dim    VARCHAR(30) CHECK (most_aligned_dim IN (
                            'emotional_impact','cinematography','audio_design',
                            'narrative_coherence','moral_conflict','thematic_depth',
                            'pacing','rewatch_value'
                        )),
    least_aligned_dim   VARCHAR(30) CHECK (least_aligned_dim IN (
                            'emotional_impact','cinematography','audio_design',
                            'narrative_coherence','moral_conflict','thematic_depth',
                            'pacing','rewatch_value'
                        )),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
ALTER TABLE match_sessions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2.9 SESSION_SHARED_MOVIES
-- -----------------------------------------------------------------------------
CREATE TABLE session_shared_movies (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id  BIGINT NOT NULL REFERENCES match_sessions(session_id) ON DELETE CASCADE,
    movie_id    BIGINT NOT NULL REFERENCES movies(movie_id) ON DELETE CASCADE,
    rank        INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 10),

    UNIQUE (session_id, rank),
    UNIQUE (session_id, movie_id)
);
ALTER TABLE session_shared_movies ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2.10 MOVIE_RECOMMENDATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE movie_recommendations (
    rec_id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id      BIGINT NOT NULL REFERENCES match_sessions(session_id) ON DELETE CASCADE,
    movie_id        BIGINT NOT NULL REFERENCES movies(movie_id) ON DELETE CASCADE,
    rank            INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 5),
    reason_code     VARCHAR(20) NOT NULL CHECK (reason_code IN (
                        'UNWATCHED','SIMILAR_USERS','TOP_ALIGNED'
                    )),
    conflict_flags  JSONB,
    score           NUMERIC(5,4) NOT NULL CHECK (score BETWEEN 0 AND 1),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    UNIQUE (session_id, rank)
);
ALTER TABLE movie_recommendations ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2.11 SOLO_SESSIONS
-- -----------------------------------------------------------------------------
CREATE TABLE solo_sessions (
    session_id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    filter_weights      JSONB NOT NULL,
    dimension_filters   JSONB,
    genre_filter        JSONB,
    mood_tag            VARCHAR(60),
    status              VARCHAR(10) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN (
                            'ACTIVE','COMPLETED','EXPIRED'
                        )),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    completed_at        TIMESTAMP WITH TIME ZONE
);
ALTER TABLE solo_sessions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2.12 SOLO_SESSION_ANSWERS
-- -----------------------------------------------------------------------------
CREATE TABLE solo_session_answers (
    answer_id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id          BIGINT NOT NULL REFERENCES solo_sessions(session_id) ON DELETE CASCADE,
    question_key        VARCHAR(60) NOT NULL,
    question_text       TEXT NOT NULL,
    answer_value        VARCHAR(120) NOT NULL,
    weight_contribution JSONB,
    answered_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
ALTER TABLE solo_session_answers ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2.13 SOLO_RECOMMENDATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE solo_recommendations (
    rec_id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id          BIGINT NOT NULL REFERENCES solo_sessions(session_id) ON DELETE CASCADE,
    movie_id            BIGINT NOT NULL REFERENCES movies(movie_id) ON DELETE CASCADE,
    rank                INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 10),
    final_score         NUMERIC(5,4) NOT NULL CHECK (final_score BETWEEN 0 AND 1),
    shown_to_user       BOOLEAN DEFAULT FALSE NOT NULL,
    randomization_seed  BIGINT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    UNIQUE (session_id, rank),
    UNIQUE (session_id, movie_id)
);
ALTER TABLE solo_recommendations ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SECTION 3: INDEXES
-- =============================================================================
CREATE INDEX idx_users_deleted          ON users (is_deleted, user_id);
CREATE INDEX idx_movies_title           ON movies (title);
CREATE INDEX idx_movies_deleted         ON movies (is_deleted, movie_id);
CREATE INDEX idx_mgm_genre              ON movie_genre_map (genre_id);
CREATE INDEX idx_ur_movie               ON user_ratings (movie_id);
CREATE INDEX idx_ur_user                ON user_ratings (user_id);
CREATE INDEX idx_cc_stale               ON compatibility_cache (is_stale, calculated_at);
CREATE INDEX idx_ms_users               ON match_sessions (initiated_by, matched_with);
CREATE INDEX idx_mr_session             ON movie_recommendations (session_id);
CREATE INDEX idx_ss_user_status         ON solo_sessions (user_id, status);
CREATE INDEX idx_sr_session_shown       ON solo_recommendations (session_id, shown_to_user);

-- =============================================================================
-- SECTION 4: COMMENTS
-- =============================================================================
COMMENT ON TABLE  users               IS 'Central user entity';
COMMENT ON COLUMN users.mbti_type     IS 'DB-enforced ENUM of all 16 MBTI types';
COMMENT ON COLUMN users.is_deleted    IS 'Soft delete flag — never hard delete';
COMMENT ON COLUMN users.updated_at    IS 'Update via trigger — see SECTION 5';

COMMENT ON TABLE  user_dimension_weights            IS 'Per-user weights for each of the 8 rating dimensions';
COMMENT ON COLUMN user_dimension_weights.dimension  IS 'One of 8 fixed dimension keys';

COMMENT ON TABLE  movies            IS 'Master movie catalog — soft delete only';
COMMENT ON COLUMN movies.synopsis   IS 'CLOB — Oracle equivalent of TEXT';

COMMENT ON TABLE  user_ratings                  IS 'Core rating engine — one row per user per movie';
COMMENT ON COLUMN user_ratings.overall_score    IS 'Optional — separate from the 8 dimension scores';

COMMENT ON COLUMN compatibility_cache.conflict_triggers IS 'JSON array of dimension keys where gap > 6, e.g. ["moral_conflict","pacing"]';
COMMENT ON COLUMN compatibility_cache.created_at        IS 'First creation — distinct from calculated_at which updates on recalc';
COMMENT ON COLUMN compatibility_cache.is_stale          IS '1 = needs background recalculation';

COMMENT ON COLUMN match_sessions.conflict_triggers IS 'JSON array — dims where pair gap > 6';
COMMENT ON COLUMN match_sessions.archetype         IS 'e.g. The Philosophers, The Technicians';

COMMENT ON TABLE session_shared_movies IS 'Replaces top_shared_movie_1/2/3 — normalised junction table';

COMMENT ON COLUMN movie_recommendations.conflict_flags IS 'JSON array — subset of pair conflict_triggers relevant to this movie';
COMMENT ON COLUMN movie_recommendations.reason_code    IS 'UNWATCHED | SIMILAR_USERS | TOP_ALIGNED';

COMMENT ON COLUMN solo_sessions.filter_weights    IS 'QnA-derived weights e.g. {"pacing": 1.5, "thematic_depth": 1.2}';
COMMENT ON COLUMN solo_sessions.dimension_filters IS 'Slider thresholds e.g. {"pacing": {"min": 7}, "thematic_depth": {"min": 6, "max": 9}}';
COMMENT ON COLUMN solo_sessions.genre_filter      IS 'JSON array of genre_id values e.g. [1, 4, 7]';

COMMENT ON COLUMN solo_session_answers.weight_contribution IS 'JSON — how this answer modified filter_weights';

COMMENT ON COLUMN solo_recommendations.shown_to_user      IS '1 = displayed in final top 3 to user';
COMMENT ON COLUMN solo_recommendations.randomization_seed IS 'Seed used for shuffle — enables reproducible results';
