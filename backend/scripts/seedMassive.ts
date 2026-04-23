import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MOCK_USERS = [
  { name: "Alexander Kim", mbti: "INTJ", age: 28, avatar: "https://i.pravatar.cc/150?u=alex" },
  { name: "Sarah Jenkins", mbti: "ENFP", age: 24, avatar: "https://i.pravatar.cc/150?u=sarah" },
  { name: "Marcus Thorne", mbti: "ENTP", age: 32, avatar: "https://i.pravatar.cc/150?u=marcus" },
  { name: "Elena Rossi", mbti: "INFJ", age: 29, avatar: "https://i.pravatar.cc/150?u=elena" },
  { name: "David Chen", mbti: "ISTP", age: 35, avatar: "https://i.pravatar.cc/150?u=david" },
  { name: "Olivia Vance", mbti: "ENFJ", age: 27, avatar: "https://i.pravatar.cc/150?u=olivia" },
  { name: "Julian Gray", mbti: "INFP", age: 22, avatar: "https://i.pravatar.cc/150?u=julian" },
  { name: "Sofia Mendez", mbti: "ESFP", age: 31, avatar: "https://i.pravatar.cc/150?u=sofia" },
  { name: "Liam O'Connor", mbti: "ESTJ", age: 40, avatar: "https://i.pravatar.cc/150?u=liam" },
  { name: "Isabella Wu", mbti: "ISFJ", age: 26, avatar: "https://i.pravatar.cc/150?u=isabella" }
];

const REVIEWS = [
  "Breathtaking cinematography. Every frame felt like a painting.",
  "The philosophical depth here is unmatched. A modern masterpiece.",
  "Strong emotional core but the pacing felt slightly off in the second act.",
  "A visceral experience. The sound design alone is worth a second watch.",
  "Incredible narrative coherence for such a complex premise.",
  "The moral ambiguity of the protagonist left me thinking for days.",
  "Technically flawless. Highly recommended for fans of the genre.",
  "A refreshing take on a tired trope. Truly cinematic.",
  "The emotional impact stayed with me long after the credits rolled.",
  "A bit slow-burn for some, but the payoff is absolutely worth it."
];

async function seedMassive() {
  console.log("🚀 Initializing Neural Collective Expansion...");

  // 1. Create or Update Users
  const usersWithIds = [];
  for (const mu of MOCK_USERS) {
    const { data: user, error } = await supabase.from('users').upsert({
      username: mu.name.toLowerCase().replace(' ', '_'),
      display_name: mu.name,
      mbti_type: mu.mbti,
      age: mu.age,
      avatar_url: mu.avatar,
      email: `${mu.name.toLowerCase().replace(' ', '.')}@example.com`
    }, { onConflict: 'username' }).select().single();
    
    if (user) usersWithIds.push(user);
    if (error) console.error("Error creating user:", error);
  }

  // 2. Fetch Movies
  const { data: movies } = await supabase.from('movies').select('*').limit(100);
  if (!movies || movies.length === 0) return console.log("Aborting: No movies in DB.");

  const ratingsToInsert = [];
  
  for (const user of usersWithIds) {
    // Generate 20-30 ratings per user
    const movieCount = 20 + Math.floor(Math.random() * 20);
    const shuffled = [...movies].sort(() => 0.5 - Math.random());
    const userBestMovies = shuffled.slice(0, movieCount);

    for (const movie of userBestMovies) {
      const score = 6 + (Math.random() * 4);
      const randomDaysAgo = Math.random() * 90;
      const watchTime = new Date(Date.now() - (randomDaysAgo * 24 * 60 * 60 * 1000)).toISOString();

      ratingsToInsert.push({
        user_id: user.user_id,
        movie_id: movie.movie_id,
        overall_score: parseFloat(score.toFixed(1)),
        emotional_impact: parseFloat((1 + Math.random() * 9).toFixed(1)),
        cinematography: parseFloat((1 + Math.random() * 9).toFixed(1)),
        audio_design: parseFloat((1 + Math.random() * 9).toFixed(1)),
        narrative_coherence: parseFloat((1 + Math.random() * 9).toFixed(1)),
        moral_conflict: parseFloat((1 + Math.random() * 9).toFixed(1)),
        thematic_depth: parseFloat((1 + Math.random() * 9).toFixed(1)),
        pacing: parseFloat((1 + Math.random() * 9).toFixed(1)),
        rewatch_value: parseFloat((1 + Math.random() * 9).toFixed(1)),
        review_text: REVIEWS[Math.floor(Math.random() * REVIEWS.length)],
        watched_at: watchTime,
        created_at: watchTime
      });
    }
    
    // Seed Weights for these users
    const weights = [
      { user_id: user.user_id, dimension: 'emotional_impact', weight: 4 + Math.random() * 6 },
      { user_id: user.user_id, dimension: 'cinematography', weight: 4 + Math.random() * 6 },
      { user_id: user.user_id, dimension: 'audio_design', weight: 4 + Math.random() * 6 },
      { user_id: user.user_id, dimension: 'narrative_coherence', weight: 4 + Math.random() * 6 },
      { user_id: user.user_id, dimension: 'moral_conflict', weight: 4 + Math.random() * 6 },
      { user_id: user.user_id, dimension: 'thematic_depth', weight: 4 + Math.random() * 6 },
      { user_id: user.user_id, dimension: 'pacing', weight: 4 + Math.random() * 6 },
      { user_id: user.user_id, dimension: 'rewatch_value', weight: 4 + Math.random() * 6 }
    ];
    await supabase.from('user_dimension_weights').upsert(weights, { onConflict: 'user_id,dimension' });
  }

  // Bulk Insert Ratings
  const { error: rErr } = await supabase.from('user_ratings').upsert(ratingsToInsert, { onConflict: 'user_id,movie_id' });
  if (rErr) console.error("Error seeding ratings:", rErr);

  console.log(`✅ Collective Expanded: ${usersWithIds.length} Users | ${ratingsToInsert.length} Ratings`);
}

seedMassive();
