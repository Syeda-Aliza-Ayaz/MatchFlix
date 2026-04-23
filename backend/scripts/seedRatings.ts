import path from 'path';
import dotenv from 'dotenv';
import { supabase } from '../src/config/supabase';

// Reload env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DIMENSIONS = [
  'emotional_impact', 'cinematography', 'audio_design', 'narrative_coherence',
  'moral_conflict', 'thematic_depth', 'pacing', 'rewatch_value'
];

const DUMMY_REVIEWS = [
  "A profound exploration of the human condition. The visual language here is unparalleled.",
  "The narrative coherence was slightly fragmented, but the emotional impact was undeniable.",
  "Cinematography that breathes life into every frame. A masterclass in pacing.",
  "An auditory experience unlike any other. The soundscape perfectly complements the thematic depth.",
  "While the moral conflict was interesting, the pacing felt slightly off in the second act.",
  "A hauntingly beautiful piece of cinema that will stay with me for a long time.",
  "The rewatch value is incredibly high. Every viewing reveals new layers of complexity.",
  "Technically flawless, though it lacked the emotional resonance I was expecting.",
  "A bold and ambitious project that mostly succeeds in its vision.",
  "The director's unique voice is evident in every scene. Truly original.",
  "A stark, uncompromising vision of the future. The audio design creates an oppressive, brilliant atmosphere.",
  "Sublime editing choices. The transition between timelines feels almost telepathic.",
  "Occasionally self-indulgent, but the sheer thematic ambition makes it essential viewing.",
  "A masterclass in restraint. Every silence is as heavy as a scream.",
  "Visually arresting. It redefines what we expect from modern digital cinematography."
];

async function seedRatings() {
  console.log('Fetching master data records for Rating seeding...');
  
  const { data: users } = await supabase.from('users').select('user_id');
  const { data: movies } = await supabase.from('movies').select('movie_id');

  if (!users || !movies) {
    console.error('Fatal: Missing structural Users/Movies required to cast ratings.');
    return;
  }

  console.log(`Executing Rating Engine... [${users.length} Users · ${movies.length} Movies]`);

  for (const user of users) {
    // Have each user watch and randomly rate 50 unique movies
    const watchedIndexes = new Set<number>();
    while (watchedIndexes.size < 50) {
      watchedIndexes.add(Math.floor(Math.random() * movies.length));
    }

    const ratingsToInsert = [];
    for (const movieIdx of Array.from(watchedIndexes)) {
      const selectedMovie = movies[movieIdx];

      // Formulate 8 psychological dimension scores organically
      let totalValue = 0;
      const dimPayload: any = {};
      
      for (const d of DIMENSIONS) {
        // Random rating logic (bias towards high but with scattering)
        const dimVal = parseFloat((Math.random() * (10 - 3) + 3).toFixed(2)); 
        dimPayload[d] = dimVal;
        totalValue += dimVal;
      }
      
      const overallAvg = parseFloat((totalValue / 8).toFixed(2));
      
      // Interleave dates by giving every user a similar range of recent to old dates
      const randomDaysAgo = Math.random() * 60; // Spread across 60 days
      const watchTime = new Date(Date.now() - (randomDaysAgo * 24 * 60 * 60 * 1000)).toISOString();

      ratingsToInsert.push({
        user_id: user.user_id,
        movie_id: selectedMovie.movie_id,
        ...dimPayload,
        overall_score: overallAvg,
        review_text: DUMMY_REVIEWS[Math.floor(Math.random() * DUMMY_REVIEWS.length)],
        watched_at: watchTime,
        created_at: watchTime // Set created_at same as watchTime for the deterministic sorting
      });
    }

    // Push block sequentially using Supabase upsert payload
    const { error } = await supabase.from('user_ratings').upsert(ratingsToInsert, { onConflict: 'user_id,movie_id' });
    if (error) {
      console.error(`Failed pushing batch logs for User ${user.user_id}:`, error);
    } else {
      console.log(`Successfully mapped 50 historical film logs for User ID [${user.user_id}]`);
    }
  }

  console.log('Neural Psychological Grid Population Complete!');
}

seedRatings().catch(console.error);
