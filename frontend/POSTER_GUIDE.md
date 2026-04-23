# Matchflix Poster Hydration Guide

To populate the cinematic matrix with real film posters for all 5,000+ movies, follow these steps:

## 1. Obtain TMDB API Key
1. Go to [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).
2. Register for a free Developer API key.
3. Copy the **API Read Access Token** (or API Key).

## 2. Configure Environment
Create a `.env.local` file in the `frontend` directory (if it doesn't exist) and add:
```env
NEXT_PUBLIC_TMDB_API_KEY=your_api_key_here
```

## 3. Hydrate Post-Process
Run the automated fetch script to build the local poster cache:
```bash
python frontend/scratch/setup_posters.py
```

## 4. Re-Generate Catalog
After the cache is built, re-run the main ingestion script:
```bash
python frontend/scratch/merge_tmdb.py
```

The system will now prioritize real TMDB posters over the "Signal Lost" placeholders.
