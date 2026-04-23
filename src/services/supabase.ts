import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://xzejdqclpeuawvefjwcn.supabase.co';
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (SUPABASE_URL === DEFAULT_SUPABASE_URL) {
  console.warn(
    '[PRD Intelligence] Using the default Supabase project URL. ' +
      'For Google OAuth branding, set VITE_SUPABASE_URL to your custom auth domain.'
  );
}

if (!SUPABASE_ANON_KEY) {
  console.warn(
    '[PRD Intelligence] VITE_SUPABASE_ANON_KEY is not set. ' +
      'Google auth will be unavailable. Add it to .env.local to enable.'
  );
}

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY || 'missing-key'
);

type RequestOptions = {
  signal?: AbortSignal;
};

const AUTH_LOOKUP_TIMEOUT_MS = 5000;
const COMPANY_SAVE_TIMEOUT_MS = 15000;
const PROFILE_SYNC_TIMEOUT_MS = 8000;
const PRD_SAVE_TIMEOUT_MS = 10000;
const PRD_FETCH_TIMEOUT_MS = 8000;

function makeTimeoutError(message: string) {
  const error = new Error(message);
  error.name = 'TimeoutError';
  return error;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(makeTimeoutError(message)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function withAbortableTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await run(controller.signal);
  } catch (error) {
    if (controller.signal.aborted) {
      throw makeTimeoutError(message);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------- Auth helpers ----------

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: { access_type: 'offline', prompt: 'consent' }
    }
  });
  if (error) throw error;
}

export async function signOut() {
  // Use local sign-out for a fast SPA logout experience on the current device.
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function resolveCurrentUserId(fallbackUserId?: string) {
  if (fallbackUserId) return fallbackUserId;

  const { data, error } = await withTimeout(
    supabase.auth.getUser(),
    AUTH_LOOKUP_TIMEOUT_MS,
    'Checking your account took too long. Please try again.'
  );

  if (error) throw error;
  if (!data.user?.id) throw new Error('No authenticated user found.');
  return data.user.id;
}

// ---------- Profile helpers ----------

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function upsertProfile(profile: Omit<Profile, 'created_at' | 'updated_at'>) {
  const { error } = await supabase.from('profiles').upsert(
    { ...profile, updated_at: new Date().toISOString() },
    { onConflict: 'id' }
  );
  if (error) {
    console.error('[Supabase] Failed to upsert profile:', error.message);
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data as Profile;
}

// ---------- PRD helpers ----------

export interface SavedPRD {
  id?: string;
  user_id: string;
  company_id?: string;
  product_name: string;
  prd_content: string;
  version: number;
  created_at?: string;
  updated_at?: string;
}

export async function savePRD(
  prd: Omit<SavedPRD, 'id' | 'created_at' | 'updated_at'> & { company_id: string },
  options: RequestOptions = {}
) {
  const query = supabase
    .from('prds')
    .insert({ ...prd, updated_at: new Date().toISOString() })
    .select();

  if (options.signal) {
    query.abortSignal(options.signal);
  }

  const { data, error } = await query.single();
  if (error) {
    console.error('[Supabase] Failed to save PRD:', error.message);
    return null;
  }
  return data as SavedPRD;
}

export async function savePRDWithTimeout(
  prd: Omit<SavedPRD, 'id' | 'created_at' | 'updated_at'> & { company_id: string },
  timeoutMs = PRD_SAVE_TIMEOUT_MS
) {
  const saved = await withAbortableTimeout(
    (signal) => savePRD(prd, { signal }),
    timeoutMs,
    'Saving the PRD took too long. Please try again.'
  );

  if (!saved) {
    throw new Error('Failed to save PRD.');
  }

  return saved;
}

export async function updatePRD(
  id: string,
  updates: Partial<Omit<SavedPRD, 'id' | 'created_at' | 'updated_at'>>,
  options: RequestOptions = {}
) {
  const query = supabase
    .from('prds')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select();

  if (options.signal) {
    query.abortSignal(options.signal);
  }

  const { data, error } = await query.single();
  if (error) {
    console.error('[Supabase] Failed to update PRD:', error.message);
    throw error;
  }
  return data as SavedPRD;
}

export async function updatePRDWithTimeout(
  id: string,
  updates: Partial<Omit<SavedPRD, 'id' | 'created_at' | 'updated_at'>>,
  timeoutMs = PRD_SAVE_TIMEOUT_MS
) {
  return withAbortableTimeout(
    (signal) => updatePRD(id, updates, { signal }),
    timeoutMs,
    'Updating the PRD took too long. Please try again.'
  );
}

// ---------- Company helpers ----------

export interface Company {
  id?: string;
  user_id?: string;
  name: string;
  industry?: string;
  stage?: string;
  size?: string;
  website?: string;
  description?: string;
  context?: string;
  created_at?: string;
  updated_at?: string;
}

export async function createCompany(
  userId: string,
  company: Omit<Company, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  options: RequestOptions = {}
) {
  const query = supabase
    .from('companies')
    .insert({
      ...company,
      user_id: userId,
      updated_at: new Date().toISOString()
    })
    .select();

  if (options.signal) {
    query.abortSignal(options.signal);
  }

  const { data, error } = await query.single();
  if (error) {
    console.error('[Supabase] Failed to create company:', error.message);
    throw error;
  }
  return data as Company;
}

export async function createCompanyWithTimeout(
  userId: string,
  company: Omit<Company, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  timeoutMs = COMPANY_SAVE_TIMEOUT_MS
) {
  return withAbortableTimeout(
    (signal) => createCompany(userId, company, { signal }),
    timeoutMs,
    'Saving company details took too long. Please try again.'
  );
}

export async function getUserCompanies(userId: string): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[Supabase] Failed to fetch companies:', error.message);
    return [];
  }
  return (data || []) as Company[];
}

export async function updateCompany(id: string, updates: Partial<Company>) {
  const { data, error } = await supabase
    .from('companies')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error('[Supabase] Failed to update company:', error.message);
    throw error;
  }
  return data as Company;
}

export async function deleteCompany(id: string) {
  const { error: prdError } = await supabase.from('prds').delete().eq('company_id', id);
  if (prdError) {
    console.error('[Supabase] Failed to delete company PRDs:', prdError.message);
    // Continue — RLS may forbid or a DB cascade may handle it. Surface only the company-delete error.
  }

  const { error } = await supabase.from('companies').delete().eq('id', id);
  if (error) {
    console.error('[Supabase] Failed to delete company:', error.message);
    throw error;
  }
}

export async function updateProfileCompany(
  userId: string,
  defaultCompanyId?: string,
  currentCompanyId?: string,
  options: RequestOptions = {}
) {
  const query = supabase
    .from('profiles')
    .update({
      default_company_id: defaultCompanyId || null,
      current_company_id: currentCompanyId || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (options.signal) {
    query.abortSignal(options.signal);
  }

  const { error } = await query;
  if (error) {
    console.error('[Supabase] Failed to update profile company:', error.message);
    throw error;
  }
}

export async function updateProfileCompanyWithTimeout(
  userId: string,
  defaultCompanyId?: string,
  currentCompanyId?: string,
  timeoutMs = PROFILE_SYNC_TIMEOUT_MS
) {
  return withAbortableTimeout(
    (signal) => updateProfileCompany(userId, defaultCompanyId, currentCompanyId, { signal }),
    timeoutMs,
    'Updating your company selection took too long.'
  );
}

export async function getCompanyPRDs(companyId: string, options: RequestOptions = {}): Promise<SavedPRD[]> {
  const query = supabase
    .from('prds')
    .select('*')
    .eq('company_id', companyId)
    .order('updated_at', { ascending: false });

  if (options.signal) {
    query.abortSignal(options.signal);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[Supabase] Failed to fetch company PRDs:', error.message);
    return [];
  }
  return (data || []) as SavedPRD[];
}

export async function getCompanyPRDsWithTimeout(companyId: string, timeoutMs = PRD_FETCH_TIMEOUT_MS): Promise<SavedPRD[]> {
  return withAbortableTimeout(
    (signal) => getCompanyPRDs(companyId, { signal }),
    timeoutMs,
    'Loading PRDs took too long. Please refresh and try again.'
  );
}

export async function deletePRD(id: string) {
  const { error } = await supabase.from('prds').delete().eq('id', id);
  if (error) {
    console.error('[Supabase] Failed to delete PRD:', error.message);
    throw error;
  }
}
