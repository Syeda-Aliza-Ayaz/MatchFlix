import { Router } from 'express';
import { supabase } from '../config/supabase';
import { NeuralEngine, NeuralProfile } from '../utils/neuralEngine';

const router = Router();

const DIMENSIONS = [
  'emotional_impact', 'cinematography', 'audio_design', 'narrative_coherence',
  'moral_conflict', 'thematic_depth', 'pacing', 'rewatch_value'
];

// Execute Live Neural Compatibility Math Matrix
router.get('/calculate', async (req, res) => {
  try {
    const { userA, userB } = req.query;
    if (!userA || !userB) return res.status(400).json({ error: "Missing users" });

    // Extract names properly
    const nameA = String(userA).split(' (')[0];
    const nameB = String(userB).split(' (')[0];

    const { data: dbUserA } = await supabase.from('users').select('*').eq('display_name', nameA).single();
    const { data: dbUserB } = await supabase.from('users').select('*').eq('display_name', nameB).single();

    if (!dbUserA || !dbUserB) return res.status(404).json({ error: "Users not found in Matrix" });

    // Fetch user dimensional profiles
    const { data: weightsA } = await supabase.from('user_dimension_weights').select('dimension, weight').eq('user_id', dbUserA.user_id);
    const { data: weightsB } = await supabase.from('user_dimension_weights').select('dimension, weight').eq('user_id', dbUserB.user_id);

    if (!weightsA || !weightsB) return res.status(500).json({ error: "Dimensional signatures missing" });

    let totalGap = 0;
    const conflicts: string[] = [];

    const matchDims = DIMENSIONS.map(dim => {
      const aW = weightsA.find(w => w.dimension === dim)?.weight || 5;
      const bW = weightsB.find(w => w.dimension === dim)?.weight || 5;
      const gap = Math.abs(aW - bW);
      totalGap += gap;

      if (gap > 4) {
        if (dim === 'pacing') conflicts.push("Severe pacing disconnect detected");
        if (dim === 'moral_conflict') conflicts.push("High ethical friction on moral narratives");
        if (dim === 'narrative_coherence') conflicts.push("Abstract vs Linear structure conflict");
      }

      return {
        dimension: dim,
        userA: parseFloat(aW.toFixed(2)),
        userB: parseFloat(bW.toFixed(2)),
        fullMark: 10
      };
    });

    // Score Calculation
    const normGap = totalGap / 40;
    const finalScore = Math.max(5, Math.min(100, Math.round(100 - (normGap * 85))));

    // Build Archetype
    let archetype = { name: "The Stabilizers", desc: "Different tastes that complement and balance each other." };
    if (finalScore > 90) archetype = { name: "The Soulmates", desc: "Perfect alignment. You share a single cinematic soul." };
    else if (finalScore > 75) archetype = { name: "The Visionaries", desc: "High alignment in vision and thematic depth." };
    else if (finalScore < 45) archetype = { name: "The Paradox", desc: "You agree on the technicals but clash on the emotions." };
    else if (finalScore < 25) archetype = { name: "The Antagonists", desc: "Cinematic opposites. Your watch sessions will be battlefields." };

    // Fetch Shared Favorites
    const { data: ratsA } = await supabase.from('user_ratings').select('movie_id').eq('user_id', dbUserA.user_id).gt('overall_score', 8);
    const { data: ratsB } = await supabase.from('user_ratings').select('movie_id').eq('user_id', dbUserB.user_id).gt('overall_score', 8);
    const sharedIds = (ratsA || []).map(r => r.movie_id).filter(id => (ratsB || []).map(r => r.movie_id).includes(id));
    const { data: sharedMoviesRaw } = await supabase.from('movies').select('*, movie_genre_map(genres(name))').in('movie_id', sharedIds.length > 0 ? sharedIds : [-1]).limit(3);
    const sharedMovies = (sharedMoviesRaw || []).map(m => ({
      ...m,
      genres: m.movie_genre_map ? m.movie_genre_map.map((j: any) => j.genres?.name).filter(Boolean) : []
    }));

    // DYNAMIC RECS (Blended Neural Profile)
    const profA: NeuralProfile = Object.fromEntries(weightsA.map(w => [w.dimension, w.weight])) as any;
    const profB: NeuralProfile = Object.fromEntries(weightsB.map(w => [w.dimension, w.weight])) as any;
    const blended = NeuralEngine.blendProfiles(profA, profB);

    const { data: pool } = await supabase.from('movies').select('*, movie_genre_map(genres(name))').limit(150);
    const shuffledPool = (pool || []).sort(() => 0.5 - Math.random());
    
    const recs = shuffledPool.map(m => {
      const genres = m.movie_genre_map ? m.movie_genre_map.map((j: any) => j.genres?.name) : [];
      return { ...m, genres, neuralScore: NeuralEngine.calculateScore({ ...m, genres }, blended) };
    }).sort((a,b) => b.neuralScore - a.neuralScore).slice(0, 4);

    return res.json({
      score: finalScore,
      matchDims,
      archetype,
      conflictWarnings: conflicts.length > 0 ? conflicts : ["Deep Neural Alignment"],
      sharedMovies,
      recommendations: recs,
      partnerId: dbUserB.user_id
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
