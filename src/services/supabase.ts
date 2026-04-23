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
  product_name: string;
  prd_content: string;
  version: number;
  created_at?: string;
  updated_at?: string;
}

export async function savePRD(prd: Omit<SavedPRD, 'id' | 'created_at' | 'updated_at'> & { company_id: string }) {
  const { data, error } = await supabase
    .from('prds')
    .insert({ ...prd, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) {
    console.error('[Supabase] Failed to save PRD:', error.message);
    return null;
  }
  return data as SavedPRD;
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

export async function createCompany(userId: string, company: Omit<Company, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('companies')
    .insert({
      ...company,
      user_id: userId,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  if (error) {
    console.error('[Supabase] Failed to create company:', error.message);
    throw error;
  }
  return data as Company;
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

export async function updateProfileCompany(userId: string, defaultCompanyId?: string, currentCompanyId?: string) {
  const { error } = await supabase
    .from('profiles')
    .update({
      default_company_id: defaultCompanyId || null,
      current_company_id: currentCompanyId || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
  if (error) {
    console.error('[Supabase] Failed to update profile company:', error.message);
  }
}

export async function getCompanyPRDs(companyId: string): Promise<SavedPRD[]> {
  const { data, error } = await supabase
    .from('prds')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[Supabase] Failed to fetch company PRDs:', error.message);
    return [];
  }
  return (data || []) as SavedPRD[];
}

export async function deletePRD(id: string) {
  const { error } = await supabase.from('prds').delete().eq('id', id);
  if (error) {
    console.error('[Supabase] Failed to delete PRD:', error.message);
    throw error;
  }
}
