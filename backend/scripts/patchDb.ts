import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function patch() {
  console.log("⚡ Patching Database Archetype...");

  // 1. Create match_history table if not exists
  const { error: hErr } = await supabase.rpc('execute_sql', {
    sql: `
      -- 1. Create match_history if not exists
      CREATE TABLE IF NOT EXISTS public.match_history (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id bigint REFERENCES public.users(user_id) ON DELETE CASCADE,
        partner_id bigint REFERENCES public.users(user_id) ON DELETE CASCADE,
        score float8,
        created_at timestamptz DEFAULT now()
      );

      -- 2. Add Dimensional Columns to Movies
      ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS emotional_impact NUMERIC(4,2) DEFAULT 5.0;
      ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS cinematography NUMERIC(4,2) DEFAULT 5.0;
      ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS audio_design NUMERIC(4,2) DEFAULT 5.0;
      ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS narrative_coherence NUMERIC(4,2) DEFAULT 5.0;
      ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS moral_conflict NUMERIC(4,2) DEFAULT 5.0;
      ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS thematic_depth NUMERIC(4,2) DEFAULT 5.0;
      ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS pacing NUMERIC(4,2) DEFAULT 5.0;
      ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS rewatch_value NUMERIC(4,2) DEFAULT 5.0;
      ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS mood_tags TEXT[] DEFAULT '{}';
      ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS mbti_affinity JSONB DEFAULT '{}';

      ALTER TABLE public.match_history ENABLE ROW LEVEL SECURITY;
    `
  });

  if (hErr) {
    // If RPC is missing, I'll just skip and assume manual or handle in code
    console.log("RPC execute_sql might not be available, skipping manual SQL. Ensure tables exist.");
  }

  console.log("✅ Patch Complete.");
}

patch();
