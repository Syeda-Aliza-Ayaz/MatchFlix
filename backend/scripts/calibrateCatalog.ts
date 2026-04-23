
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MOODS = ["Visceral", "Melancholic", "Philosophical", "Mind-bending", "Adrenaline-fueled", "Heart-wrenching", "Atmospheric"];

async function calibrate() {
  console.log("🧠 Starting Neural Calibration of Catalog...");

  // 1. Fetch all movies with genres
  const { data: movies, error } = await supabase
    .from('movies')
    .select('movie_id, title, movie_genre_map(genres(name))');

  if (error || !movies) return console.error("Failed to fetch movies", error);

  console.log(`Analyzing ${movies.length} cinematic signatures...`);

  const updates = movies.map(m => {
    const genres = m.movie_genre_map ? (m.movie_genre_map as any).map((j: any) => j.genres?.name) : [];
    
    // Baseline Dimensions (1.0 - 10.0)
    let emotional = 4 + Math.random() * 4;
    let cinematography = 5 + Math.random() * 4;
    let audio = 5 + Math.random() * 4;
    let narrative = 5 + Math.random() * 4;
    let thematic = 4 + Math.random() * 4;
    let pacing = 5 + Math.random() * 4;
    let moral = 4 + Math.random() * 4;
    let rewatch = 5 + Math.random() * 4;

    // Genre Bias
    if (genres.includes("Action")) { pacing += 2; audio += 1.5; }
    if (genres.includes("Drama")) { emotional += 2.5; narrative += 1; }
    if (genres.includes("Sci-Fi")) { thematic += 2; cinematography += 1.5; }
    if (genres.includes("Horror")) { audio += 2; emotional += 1.5; pacing += 1; }
    if (genres.includes("Thriller")) { pacing += 1.5; narrative += 1.5; }
    if (genres.includes("Animation")) { cinematography += 2; rewatch += 1.5; }
    if (genres.includes("Crime")) { moral += 2.5; narrative += 1.5; }

    // Clamp values
    const clamp = (v: number) => Math.max(1, Math.min(10, parseFloat(v.toFixed(2))));

    return {
      movie_id: m.movie_id,
      emotional_impact: clamp(emotional),
      cinematography: clamp(cinematography),
      audio_design: clamp(audio),
      narrative_coherence: clamp(narrative),
      moral_conflict: clamp(moral),
      thematic_depth: clamp(thematic),
      pacing: clamp(pacing),
      rewatch_value: clamp(rewatch),
      mood_tags: [MOODS[Math.floor(Math.random() * MOODS.length)]],
      mbti_affinity: { 
        "INTJ": 7 + Math.random() * 3, 
        "ENFP": 6 + Math.random() * 4,
        "INFJ": 8 + Math.random() * 2
      }
    };
  });

  // Individual Updates to avoid IDENTITY column errors
  let successCount = 0;
  for (const update of updates) {
    const { movie_id, ...data } = update;
    const { error: uErr } = await supabase
      .from('movies')
      .update(data)
      .eq('movie_id', movie_id);
    
    if (uErr) console.error(`Error calibrating movie ${movie_id}:`, uErr);
    else successCount++;

    if (successCount % 50 === 0) console.log(`Calibrated ${successCount} cinematic signatures...`);
  }

  console.log(`✅ Catalog Calibration Complete. ${successCount} movies updated. Engine is now LIVE.`);
}

calibrate();
