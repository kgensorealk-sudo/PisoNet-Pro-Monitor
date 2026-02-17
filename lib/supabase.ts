
import { createClient } from '@supabase/supabase-js';

// Configuration updated with user-provided project credentials
const supabaseUrl = 'https://tuqecpveltzeaudcffqh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1cWVjcHZlbHR6ZWF1ZGNmZnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTgwMTQsImV4cCI6MjA4Njg3NDAxNH0.hK1x70KOatWtkNO2MDV-ImMCOR3kvxEGgXmG6ZDy53E';

export const supabase = createClient(supabaseUrl, supabaseKey);
