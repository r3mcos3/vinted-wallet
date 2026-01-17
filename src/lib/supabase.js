import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true'

// Only require Supabase credentials when not in mock mode
if (!isMockMode && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('Missing Supabase environment variables. Set VITE_MOCK_MODE=true to use mock data instead.')
}

// Create a dummy client in mock mode to prevent import errors
export const supabase = isMockMode
  ? null
  : createClient(supabaseUrl, supabaseAnonKey)

// Storage bucket name
export const PRODUCTS_BUCKET = 'product-images'
