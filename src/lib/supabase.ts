
import { createClient } from '@supabase/supabase-js';

// Use the values from the Supabase integration
const supabaseUrl = 'https://gswwmieyrfdhrfwsgjnw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd3dtaWV5cmZkaHJmd3Nnam53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MjkzNjksImV4cCI6MjA2MDAwNTM2OX0.pmF7VFMO2Pu34mDWz-XnleqY0mdsePVMwltY5D4Wjvw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Check if Supabase is configured properly
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Supabase connection error:', error.message);
  } else {
    console.log('Supabase connection successful');
  }
});
