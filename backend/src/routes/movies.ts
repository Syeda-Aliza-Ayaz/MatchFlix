import { Router } from 'express';
import { supabase } from '../config/supabase';
import { NeuralEngine, NeuralProfile } from '../utils/neuralEngine';

const router = Router();

// Get trending movies (For carousels)
router.get('/trending', async (req, res) => {
  try {
    const timeFilter = req.query.time || 'month';
    
    // We fetch the latest movies, but currently simulating the filters using random seeds
    // based on the query param since we don't have organic live user ratings yet.
    let { data, error } = await supabase
      .from('movies')
      .select('*, movie_genre_map( genres(name) )')
      .limit(30);

    if (error) throw error;
    
    // Map genres array safely from the Supabase inner-join
    if (data) {
      data = data.map((m: any) => ({
        ...m,
        genres: m.movie_genre_map ? m.movie_genre_map.map((j: any) => j.genres?.name).filter(Boolean) : []
      }));
    }
    
    // Simulate 'This Week' vs 'This Month' by shifting the array 
    if (data && data.length > 0) {
      if (timeFilter === 'week') data = [...data.slice(10), ...data.slice(0, 10)];
      if (timeFilter === 'year') data = [...data.slice(20), ...data.slice(0, 20)];
      data = data.slice(0, 20); // Keep top 20
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all movies
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .limit(150);

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get latest reviews (Simplified version to ensure unique users in the feed)
router.get('/reviews/latest', async (req, res) => {
  try {
    // We fetch the latest reviews and manually filter for uniqueness in JS to 
    // keep the query simple while ensuring variety in the UI
    const { data, error } = await supabase
      .from('user_ratings')
      .select(`
        rating_id,
        review_text,
        overall_score,
        created_at,
        users (user_id, display_name, avatar_url, mbti_type),
        movies (movie_id, title, release_year, poster_url)
      `)
      .not('review_text', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100); // Larger pool for better shuffling

    if (error) throw error;

    // Shuffle and filter for STRICT user uniqueness
    const pool = (data || []).sort(() => 0.5 - Math.random());
    const uniqueReviews: any[] = [];
    const seenUsers = new Set();

    for (const rev of pool) {
      const u = Array.isArray(rev.users) ? rev.users[0] : rev.users;
      if (!u || !u.user_id) continue;
      
      if (!seenUsers.has(u.user_id)) {
        uniqueReviews.push(rev);
        seenUsers.add(u.user_id);
      }
      if (uniqueReviews.length >= 8) break;
    }

    res.json(uniqueReviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get total counts for stats bar
router.get('/stats', async (req, res) => {
  try {
    const { count: movieCount } = await supabase.from('movies').select('*', { count: 'exact', head: true });
    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: ratingCount } = await supabase.from('user_ratings').select('*', { count: 'exact', head: true });

    res.json({
      movies: movieCount || 650,
      users: userCount || 7,
      ratings: ratingCount || 350,
      dims: 8 // Fixed architectural constant
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Dynamic Recommendations based on dimensional thresholds (Fuzzy Matching)
router.get('/recommendations', async (req, res) => {
  try {
    const { 
      emotional, cinematography, audio, narrative, 
      moral, thematic, pacing, rewatch, email 
    } = req.query;
    
    // 1. Fetch pool
    const { data: movies, error } = await supabase.from('movies').select('*, movie_genre_map(genres(name))').limit(250);
    if (error) throw error;
    if (!movies) return res.json([]);

    // 2. Build Target Profile (Blend manual sliders with user defaults if email exists)
    let profile: NeuralProfile = {
      emotional_impact: parseFloat(emotional as string) || 5,
      cinematography: parseFloat(cinematography as string) || 5,
      audio_design: parseFloat(audio as string) || 5,
      narrative_coherence: parseFloat(narrative as string) || 5,
      moral_conflict: parseFloat(moral as string) || 5,
      thematic_depth: parseFloat(thematic as string) || 5,
      pacing: parseFloat(pacing as string) || 5,
      rewatch_value: parseFloat(rewatch as string) || 5
    };

    if (email) {
      const { data: user } = await supabase.from('users').select('user_id, mbti_type').eq('email', email).single();
      if (user) {
        const { data: weights } = await supabase.from('user_dimension_weights').select('*').eq('user_id', user.user_id);
        const { data: sessions } = await supabase.from('solo_sessions').select('genre_filter, mood_tag').eq('user_id', user.user_id).order('created_at', { ascending: false }).limit(1);
        
        // Blend permanent weights with manual slider (Slider gets 70% weight)
        weights?.forEach(w => {
          (profile as any)[w.dimension] = ((profile as any)[w.dimension] * 0.7) + (w.weight * 0.3);
        });
        profile.mbti = user.mbti_type;
        profile.genres = sessions?.[0]?.genre_filter || [];
        profile.mood = sessions?.[0]?.mood_tag || undefined;
      }
    }

    // 3. Shuffle and Rank
    const shuffled = (movies as any[]).sort(() => 0.5 - Math.random());
    const ranked = shuffled.map(m => {
      const genres = m.movie_genre_map ? m.movie_genre_map.map((j: any) => j.genres?.name) : [];
      return { ...m, genres, neuralScore: NeuralEngine.calculateScore({ ...m, genres }, profile) };
    }).sort((a,b) => b.neuralScore - a.neuralScore);

    res.json(ranked.slice(0, 10));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Personalized Recommendations based on User Weights
router.get('/personalized', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email required" });

    // 1. Get User
    const { data: user, error: uErr } = await supabase.from('users').select('user_id').eq('email', email).single();
    if (uErr || !user) throw new Error("User not found");

    // 2. Get Weights
    const { data: weights } = await supabase.from('user_dimension_weights').select('*').eq('user_id', user.user_id);
    const weightMap = Object.fromEntries((weights || []).map(w => [w.dimension, w.weight]));

    // 3. Get Genre Preferences and Mood from latest session
    const { data: sessions } = await supabase
      .from('solo_sessions')
      .select('genre_filter, mood_tag')
      .eq('user_id', user.user_id)
      .order('created_at', { ascending: false })
      .limit(1);
    
    const profile: NeuralProfile = {
      ...(Object.fromEntries((weights || []).map(w => [w.dimension, w.weight])) as any),
      genres: sessions?.[0]?.genre_filter || [],
      mood: sessions?.[0]?.mood_tag || undefined
    };

    // 4. Get Movies
    const { data: movies } = await supabase.from('movies').select('*, movie_genre_map(genres(name))').limit(200);
    if (!movies) return res.json([]);

    // 5. Shuffle and Rank
    const shuffled = (movies as any[]).sort(() => 0.5 - Math.random());
    const ranked = shuffled.map(m => {
      const genres = m.movie_genre_map ? m.movie_genre_map.map((j: any) => j.genres?.name) : [];
      const score = NeuralEngine.calculateScore({ ...m, genres }, profile);
      return { ...m, genres, neuralScore: score };
    }).sort((a,b) => b.neuralScore - a.neuralScore);

    res.json(ranked.slice(0, 10));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
