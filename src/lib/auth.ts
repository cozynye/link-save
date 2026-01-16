/**
 * Authentication Module with Supabase Auth
 * Handles email/password authentication using Supabase built-in Auth
 */

import { supabase } from './supabase/client';
import { isSessionValid, getUserId } from './session';

export interface LoginResult {
  success: boolean;
  error?: string;
}

/**
 * Login with email and password using Supabase Auth
 * @param email - User's email address
 * @param password - User's password
 * @returns Login result with success status and optional error message
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message === 'Invalid login credentials'
          ? '이메일 또는 비밀번호가 올바르지 않습니다.'
          : '로그인에 실패했습니다. 다시 시도해주세요.'
      };
    }

    if (!data.session) {
      return { success: false, error: '로그인에 실패했습니다.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected login error:', error);
    return { success: false, error: '로그인 중 오류가 발생했습니다.' };
  }
}

/**
 * Logout current user using Supabase Auth
 */
export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Check if user is authenticated
 * @returns true if user has a valid session
 */
export async function isAuthenticated(): Promise<boolean> {
  return await isSessionValid();
}

/**
 * Get current user ID from Supabase Auth session
 * @returns User ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  return await getUserId();
}
