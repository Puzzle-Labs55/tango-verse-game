
import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  'https://aofvzqxjepgnokxoejaw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZnZ6cXhqZXBnbm9reG9lamF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MzY2OTEsImV4cCI6MjA1NTMxMjY5MX0.YKno39PuRrjb0iDlZ-RDdY_kySpWTjYTu0xVOLI5fDU'
);
