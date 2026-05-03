// backend/utils/supabase.js
const { createClient } = require('@supabase/supabase-js');

// Admin client (service role) — server use only
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Anon client — for verifying user JWTs
const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = { supabaseAdmin, supabaseAnon };
