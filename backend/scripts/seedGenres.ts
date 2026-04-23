import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GENRE_MAP: Record<string, string[]> = {
  "Action": ["kill", "war", "knight", "batman", "mission", "fast", "furious", "die", "hard", "terminator", "ninja"],
  "Sci-Fi": ["space", "alien", "star", "trek", "dune", "matrix", "blade", "runner", "interstellar", "inception", "future"],
  "Horror": ["scream", "dead", "evil", "conjuring", "nightmare", "halloween", "blood", "quiet", "place", "witch"],
  "Drama": ["godfather", "list", "story", "life", "man", "woman", "love", "heart", "beautiful", "mind", "social"],
  "Thriller": ["seven", "gone", "girl", "shutter", "island", "memento", "joker", "parasite", "silence", "lambs"],
  "Comedy": ["hangover", "jump", "street", "deadpool", "toy", "story", "lego", "shrek", "superbad"],
  "Animation": ["spider-man", "verse", "lion", "king", "frozen", "nemo", "pixar", "anime", "monsters"],
  "Crime": ["pulp", "fiction", "goodfellas", "irishman", "heist", "robbery", "detective"]
};

async function seedGenres() {
  console.log("🧠 Starting Global Genre Calibration...");

  // 1. Ensure Genres exist
  const genreNames = Object.keys(GENRE_MAP);
  const { data: existingGenres } = await supabase.from('genres').select('*');
  
  for (const name of genreNames) {
    if (!existingGenres?.find(g => g.name === name)) {
      await supabase.from('genres').insert({ name });
    }
  }

  // Fetch fresh genre list with IDs
  const { data: allGenres } = await supabase.from('genres').select('*');
  if (!allGenres) return;

  // 2. Fetch all movies
  const { data: movies, error } = await supabase.from('movies').select('movie_id, title');
  if (error || !movies) {
    console.error("Failed to fetch movies:", error);
    return;
  }

  console.log(`Analyzing ${movies.length} cinematic signatures...`);

  const mappings: any[] = [];

  for (const movie of movies) {
    const title = movie.title.toLowerCase();
    let assigned = false;

    for (const [genreName, keywords] of Object.entries(GENRE_MAP)) {
      if (keywords.some(k => title.includes(k))) {
        const genreId = allGenres.find(g => g.name === genreName)?.genre_id;
        if (genreId) {
          mappings.push({ movie_id: movie.movie_id, genre_id: genreId });
          assigned = true;
        }
      }
    }

    // Default to Drama/Thriller if no match
    if (!assigned) {
       const dramaId = allGenres.find(g => g.name === "Drama")?.genre_id;
       if (dramaId) mappings.push({ movie_id: movie.movie_id, genre_id: dramaId });
    }
  }

  // 3. Bulk Insert Mappings (Chuncked to avoid timeout)
  console.log(`Inserting ${mappings.length} mappings into the matrix...`);
  const chunkSize = 100;
  for (let i = 0; i < mappings.length; i += chunkSize) {
    const chunk = mappings.slice(i, i + chunkSize);
    const { error: mErr } = await supabase.from('movie_genre_map').upsert(chunk, { onConflict: 'movie_id,genre_id' });
    if (mErr) console.error(`Error in chunk ${i}:`, mErr.message);
  }

  console.log("✅ Global Genre Calibration Complete.");
}

seedGenres();
