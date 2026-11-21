import { createClient } from '@supabase/supabase-js'

// Publishable key: safe to ship in the browser (access is controlled by RLS in the database).
const url = import.meta.env.VITE_SUPABASE_URL || 'https://ptmspriwtxutctziyqyk.supabase.co'
const key = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_ZWjlEOxtSMqi9Yv2g4mVMA_wwB50Nz1'

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
})
export const SUPABASE_URL = url
