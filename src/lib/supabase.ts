
import { createClient } from '@supabase/supabase-js';

// Get the Supabase URL and anon key from Lovable's Supabase integration
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);
