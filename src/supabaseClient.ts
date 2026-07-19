import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta.env !== 'undefined' ? import.meta.env : {}) as any;
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://supabasekong-c4czoot39vrokbodehd9vinu.84.234.99.41.sslip.io';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3OTkwOTMwMCwiZXhwIjo0OTM1NTgyOTAwLCJyb2xlIjoiYW5vbiJ9.EMb7Jld34ITYxbGKVwbD3XQTbgJ04C1CUUjW4Z5H7dw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
