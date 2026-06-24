import { createClient } from "@supabase/supabase-js";

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const rawSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

function normalizeSupabaseUrl(value: string) {
  return value.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

export function getSupabaseUrl() {
  return normalizeSupabaseUrl(rawSupabaseUrl);
}

export const isSupabaseConfigured = Boolean(getSupabaseUrl() && rawSupabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(getSupabaseUrl()!, rawSupabaseAnonKey!)
  : createClient("https://example.supabase.co", "public-anon-key");

export function getSupabaseErrorMessage(error: { message?: string } | null | undefined) {
  return error?.message || "Something went wrong. Please try again.";
}
