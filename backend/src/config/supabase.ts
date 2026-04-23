import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// We use the service role key on the backend to bypass RLS when necessary
// such as seeding data or performing admin operations.
// WARNING: Never expose this key to the frontend.
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
