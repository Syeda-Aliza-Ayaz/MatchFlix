import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function syncGenres() {
  console.log("🚀 Starting High-Fidelity Genre Synchronization...");

  // 1. Load CSV Data
  const csvPath = path.resolve(__dirname, '../../data/tmdb_5000_movies.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });

  console.log(`📂 Loaded ${records.length} records from TMDB source.`);

  // 2. Extract and Sync Unique Genres
  const allGenreNames = new Set<string>();
  records.forEach((r: any) => {
    try {
      const genres = JSON.parse(r.genres);
      genres.forEach((g: any) => allGenreNames.add(g.name));
    } catch (e) {}
  });

  console.log(`✨ Found ${allGenreNames.size} unique genres. Synchronizing registry...`);
  
  for (const name of Array.from(allGenreNames)) {
    await supabase.from('genres').upsert({ name }, { onConflict: 'name' });
  }

  // Fetch genres with IDs
  const { data: dbGenres } = await supabase.from('genres').select('*');
  const genreMap = Object.fromEntries((dbGenres || []).map(g => [g.name, g.genre_id]));

  // 3. Fetch Local Movies
  const { data: dbMovies } = await supabase.from('movies').select('movie_id, title');
  if (!dbMovies) return;

  console.log(`🔍 Matching ${dbMovies.length} local movies to TMDB source...`);

  const mappings: any[] = [];
  const csvTitleMap = new Map();
  records.forEach((r: any) => csvTitleMap.set(r.title.toLowerCase(), r.genres));

  for (const movie of dbMovies) {
    const genresJson = csvTitleMap.get(movie.title.toLowerCase());
    if (genresJson) {
      try {
        const genres = JSON.parse(genresJson);
        genres.forEach((g: any) => {
          const genreId = genreMap[g.name];
          if (genreId) {
            mappings.push({ movie_id: movie.movie_id, genre_id: genreId });
          }
        });
      } catch (e) {}
    }
  }

  // 4. Inject Mappings
  console.log(`💉 Injecting ${mappings.length} honest mappings into the database...`);
  
  // Clear old mappings first to avoid mess
  await supabase.from('movie_genre_map').delete().neq('movie_id', -1);

  const chunkSize = 100;
  for (let i = 0; i < mappings.length; i += chunkSize) {
    const chunk = mappings.slice(i, i + chunkSize);
    const { error } = await supabase.from('movie_genre_map').insert(chunk);
    if (error) console.error(`Error in chunk ${i}:`, error.message);
  }

  console.log("✅ High-Fidelity Genre Synchronization Complete.");
}

syncGenres();
