import { createClient } from '@supabase/supabase-js';

const supabaseUrl = REACT_APP_SUPABASE_URL || 'https://kzrfxoxiizedyaacngto.supabase.co';
const supabaseAnonKey = REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cmZ4b3hpaXplZHlhYWNuZ3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MzU0ODUsImV4cCI6MjA5MTExMTQ4NX0.gxSeJjwg2HD8uA9ifyw47EYiMUfhy0F-rCIH9aMvpUQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
