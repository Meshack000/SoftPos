// Server only. Never import this file into a "use client" component,
// because it uses the Supabase secret key.
import { createClient } from "@supabase/supabase-js";

let client;

export function db() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL or SUPABASE_SECRET_KEY is missing. Add them to .env.local and restart the server."
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
