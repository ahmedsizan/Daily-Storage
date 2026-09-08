import { supabase } from './supabase.ts';

/**
 * Normalizes username (lowercase, trimmed, spaces to underscores, valid characters)
 */
export function normalizeUsername(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_.-]/g, '');
}

/**
 * Maps clean username to internal Supabase Auth identifier
 */
export function usernameToAuthEmail(username: string): string {
  const normalized = normalizeUsername(username);
  if (!normalized) {
    throw new Error('Username must contain valid letters or numbers.');
  }
  if (normalized.length < 3) {
    throw new Error('Username must be at least 3 characters long.');
  }
  return `${normalized}@dailystorage.app`;
}

/**
 * Retrieves the display name/username from user metadata
 */
export function getUserDisplayName(user: any): string {
  if (!user) return 'User';
  return (
    user.user_metadata?.display_name ||
    user.user_metadata?.username ||
    user.email?.split('@')[0] ||
    'User'
  );
}

export async function signUp(username: string, password: string) {
  const cleanName = username.trim();

  // 1. Try direct RPC create_new_user (bypasses Supabase SMTP mailer & rate limits completely)
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('create_new_user', {
      username: cleanName,
      password: password
    });

    if (!rpcError && rpcData?.success) {
      // User registered directly into auth.users! Now sign in to get active session:
      return await signIn(cleanName, password);
    }
    // If the error is a user-facing validation (e.g. 'This name is already taken')
    if (rpcError && rpcError.message && !rpcError.message.includes('schema cache')) {
      throw rpcError;
    }
  } catch (rpcErr: any) {
    if (rpcErr.message && !rpcErr.message.includes('schema cache')) {
      throw rpcErr;
    }
  }

  // 2. Standard Supabase signUp fallback
  const email = usernameToAuthEmail(cleanName);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: cleanName,
        display_name: cleanName
      }
    }
  });

  if (error) {
    throw error;
  }
  return data;
}

export async function signIn(username: string, password: string) {
  const email = usernameToAuthEmail(username);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw error;
  }
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }
  return user;
}

export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    return null;
  }
  return session;
}

export function onAuthStateChange(callback: (user: any | null) => void) {
  return supabase.auth.onAuthStateChange((_event: string, session: any) => {
    callback(session?.user ?? null);
  });
}
