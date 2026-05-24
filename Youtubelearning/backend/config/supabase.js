const { createClient } = require("@supabase/supabase-js");
const env = require("./env");

let adminClient = null;
let publicClient = null;

function isSupabaseConfigured() {
  return Boolean(env.SUPABASE_URL && (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY));
}

function getSupabaseAdmin() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  if (!adminClient) {
    adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}

function getSupabasePublic() {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return null;
  }

  if (!publicClient) {
    publicClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
      },
    });
  }

  return publicClient;
}

async function getSupabaseHealth() {
  const client = getSupabaseAdmin();

  if (!client) {
    return {
      configured: false,
      status: "disabled",
    };
  }

  const startedAt = Date.now();
  const { error } = await client.from("app_health").select("id").limit(1);

  return {
    configured: true,
    status: error && error.code !== "42P01" ? "error" : "reachable",
    latencyMs: Date.now() - startedAt,
    details: error && error.code !== "42P01" ? error.message : undefined,
  };
}

module.exports = {
  getSupabaseAdmin,
  getSupabasePublic,
  getSupabaseHealth,
  isSupabaseConfigured,
};
