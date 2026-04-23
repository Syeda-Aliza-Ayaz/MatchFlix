import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import { supabase } from '../src/config/supabase';

// Reload env to ensure TMDB config is caught if run directly
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MOVIES_CSV = path.resolve(__dirname, '../../data/tmdb_5000_movies.csv');
const CREDITS_CSV = path.resolve(__dirname, '../../data/tmdb_5000_credits.csv');
const POSTER_CACHE = path.resolve(__dirname, '../../../frontend/scratch/poster_cache.json');
const TMDB_API_KEY = process.env.TMDB_API_KEY;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const MOCK_USERS = [
  { username: 'emma_t', email: 'emma@matchflix.db', display_name: 'Emma Thompson', age: 27, mbti_type: 'INFP', avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Emma' },
  { username: 'sara_p', email: 'sara@matchflix.db', display_name: 'Sara Patel', age: 24, mbti_type: 'INTJ', avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sara' },
  { username: 'davec', email: 'dave@matchflix.db', display_name: 'David Chen', age: 31, mbti_type: 'ENTP', avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Dave' },
  { username: 'mia_j', email: 'mia@matchflix.db', display_name: 'Mia Johnson', age: 22, mbti_type: 'ISFP', avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Mia' },
  { username: 'andy_m', email: 'andy@matchflix.db', display_name: 'Andrew Miller', age: 29, mbti_type: 'ESTJ', avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Andy' },
  { username: 'sarah_c', email: 'sarahc@matchflix.db', display_name: 'Sarah Connor', age: 35, mbti_type: 'ISTP', avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sarah' },
  { username: 'alex_k', email: 'alex@matchflix.db', display_name: 'Alexander Kim', age: 26, mbti_type: 'ENFJ', avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alex' }
];

const DIMENSIONS = [
  'emotional_impact', 'cinematography', 'audio_design', 'narrative_coherence',
  'moral_conflict', 'thematic_depth', 'pacing', 'rewatch_value'
];

async function fetchTmdbPosterWithRetry(tmdbId: number): Promise<string | null> {
  if (!TMDB_API_KEY) return null;
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`);
    if (res.ok) {
      const data = await res.json();
      return data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null;
    }
  } catch (err) { }
  return null;
}

async function seed() {
  console.log('Starting advanced data seeding process...');
  
  // 1. Setup Mock Users
  console.log('Seeding Mock Users...');
  for (const user of MOCK_USERS) {
    const { data: insertedUser, error: ue } = await supabase.from('users').upsert(user, { onConflict: 'email' }).select().single();
    if (ue) {
      console.error(`Failed to insert user ${user.email}:`, ue.message);
      continue;
    }
    
    // Seed dimensions for user
    for (const dim of DIMENSIONS) {
      const randomWeight = parseFloat((Math.random() * (10 - 2) + 2).toFixed(2));
      await supabase.from('user_dimension_weights').upsert({
        user_id: insertedUser.user_id,
        dimension: dim,
        weight: randomWeight
      }, { onConflict: 'user_id,dimension' });
    }
  }

  // 2. Load Poster Cache
  let posterMap: Record<string, string> = {};
  if (fs.existsSync(POSTER_CACHE)) {
    posterMap = JSON.parse(fs.readFileSync(POSTER_CACHE, 'utf-8'));
  }

  // 3. Load Credits (For Director)
  console.log('Parsing credits CSV...');
  const creditsRows: any[] = [];
  await new Promise((resolve) => {
    fs.createReadStream(CREDITS_CSV).pipe(csv())
      .on('data', (d) => creditsRows.push(d))
      .on('end', resolve);
  });

  const directorMap = new Map();
  for (const row of creditsRows) {
    try {
      // Fix: Let csv-parser's native unescaped string parse securely. Occasional single corrupted lines are caught.
      const crewArray = JSON.parse(row.crew.replace(/'/g, '"').replace(/\\\\"/g, '"'));
      const directorObj = crewArray.find((c: any) => c.job === 'Director');
      if (directorObj) directorMap.set(row.movie_id, directorObj.name);
    } catch(e) { }
  }

  // 4. Load Movies
  console.log('Parsing movies CSV...');
  const movies: any[] = [];
  await new Promise((resolve) => {
    fs.createReadStream(MOVIES_CSV).pipe(csv())
      .on('data', (d) => movies.push(d))
      .on('end', resolve);
  });
  
  console.log(`Parsed ${movies.length} movies. Resolving exactly 650 complete entries...`);
  const sortedMovies = movies
    .filter(m => m.popularity && m.release_date && m.runtime) 
    .sort((a, b) => parseFloat(b.popularity) - parseFloat(a.popularity));
  
  console.log('Upserting highly-validated movies to Supabase and resolving TMDB Images...');
  
  // console.log('Flushing old table data perfectly to destroy NULLs...');
  // const { error: wipeError } = await supabase.from('movies').delete().gt('tmdb_id', 0);
  // if (wipeError) {
  //   console.error('Wipe error:', wipeError);
  // } else {
  //   console.log('Database table cleaned completely. Commencing population...');
  // }

  let successfulUpserts = 0;
  for (const movieRow of sortedMovies) {
    if (successfulUpserts >= 650) {
      console.log('Reached 650 valid movies target. Halting processing.');
      break;
    }

    try {
      const dir = directorMap.get(movieRow.id);
      if (!dir) continue; // Skip if no director resolved

      const release_year = movieRow.release_date ? parseInt(movieRow.release_date.substring(0, 4)) : null;
      let posterPath = posterMap[movieRow.id];
      let fullPosterUrl = null;

      // Use perfect high res tmdb URLs if a poster path exists locally
      if (posterPath && posterPath.startsWith('/')) {
        fullPosterUrl = `https://image.tmdb.org/t/p/w500${posterPath}`;
      } else if (posterPath) {
        fullPosterUrl = `https://image.tmdb.org/t/p/w500/${posterPath}`;
      } else {
        // Dynamic fetch fallback with standard delay to save rate limits
        const apiKeyLookup = await fetchTmdbPosterWithRetry(parseInt(movieRow.id));
        if (apiKeyLookup) {
          fullPosterUrl = apiKeyLookup;
        }
        await delay(35); 
      }

      if (!fullPosterUrl) continue; // Skip if we completely failed to get a poster

      const { data: insertedMovie, error: me } = await supabase.from('movies').upsert({
        title: movieRow.original_title || movieRow.title,
        release_year: release_year,
        runtime_minutes: parseInt(movieRow.runtime),
        director: dir,
        poster_url: fullPosterUrl,
        synopsis: movieRow.overview,
        tmdb_id: parseInt(movieRow.id),
      }, { onConflict: 'tmdb_id' }).select().single();

      if (me || !insertedMovie) throw me;

      // Map Genres Structurally
      try {
        const genreArr = JSON.parse(movieRow.genres.replace(/'/g, '"').replace(/\\\\"/g, '"'));
        for (const g of genreArr) {
          // Ignore bad parses
          if (!g.name) continue;
          
          let { data: genreRow } = await supabase.from('genres').select('genre_id').eq('name', g.name).single();
          
          if (!genreRow) {
            const { data: ng } = await supabase.from('genres').insert({ name: g.name }).select().single();
            genreRow = ng;
          }
          
          if (genreRow) {
            await supabase.from('movie_genre_map').upsert({
              movie_id: insertedMovie.movie_id,
              genre_id: genreRow.genre_id
            }, { onConflict: 'movie_id,genre_id' });
          }
        }
      } catch(e) {}

      successfulUpserts++;

    } catch (err) {
      console.error(`Skipping ${movieRow.title} due to processing error`, err);
    }
  }
  
  console.log('Data Seeding Pipeline Completed!');
}

seed().catch(console.error);
