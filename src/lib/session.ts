/**
 * Session Management with Supabase Auth
 * Wrapper functions for Supabase Auth session management
 */

import { supabase } from './supabase/client';

/**
 * Check if user is authenticated
 * @returns true if user has a valid session
 */
export async function isSessionValid(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return session !== null;
}

/**
 * Get current user ID from Supabase Auth session
 * @returns User ID or null if not authenticated
 */
export async function getUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

/**
 * Get current user email from Supabase Auth session
 * @returns User email or null if not authenticated
 */
export async function getUserEmail(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.email ?? null;
}

/**
 * Get current session
 * @returns Supabase session or null
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
