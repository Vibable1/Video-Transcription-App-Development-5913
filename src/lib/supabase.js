import { createClient } from '@supabase/supabase-js'

// Project credentials from Supabase
const SUPABASE_URL = 'https://jpnzvtkgubhxcrgyzcfa.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwbnp2dGtndWJoeGNyZ3l6Y2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NDEwNzIsImV4cCI6MjA2OTAxNzA3Mn0.HuJH9yFcHCYr4KbI6FV4DqFQPQyhUAjuQFMK7ZORXDE'

if (SUPABASE_URL === 'https://<PROJECT-ID>.supabase.co' || SUPABASE_ANON_KEY === '<ANON_KEY>') {
  throw new Error('Missing Supabase variables');
}

// Create a single supabase client for interacting with your database
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})

export default supabase;