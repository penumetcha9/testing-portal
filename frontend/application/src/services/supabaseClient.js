// src/services/supabaseClient.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export { supabase }          // named export  → import { supabase } from '...'
export default supabase      // default export → import supabase from '...'