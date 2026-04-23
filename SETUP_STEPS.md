# Setup Steps

## 1. Get Your Keys

### Supabase Anon Key
1. Go to https://supabase.com/dashboard/project/xzejdqclpeuawvefjwcn
2. **Settings → API**
3. Copy the **anon / public** key

### OpenRouter API Key (free — no credit card)
1. Go to https://openrouter.ai/keys
2. Create a free account → generate a key
3. Free models included: Gemma 4 31B, Qwen3 80B, Nemotron Super, MiniMax M2.5, Elephant 368B, and 6 more fallbacks

---

## 2. Create .env.local

Copy `.env.local.example` to `.env.local` and fill in the keys:

```env
VITE_SUPABASE_URL=https://auth.yourdomain.com   # your active Supabase custom auth domain
VITE_SUPABASE_ANON_KEY=eyJhb...          # from step 1
VITE_OPENROUTER_API_KEY=sk-or-v1-...    # from step 1
```

If you have not activated a custom Supabase domain yet, you can temporarily use:

```env
VITE_SUPABASE_URL=https://xzejdqclpeuawvefjwcn.supabase.co
```

---

## 3. Enable Google OAuth in Supabase

1. Supabase Dashboard → **Authentication → Providers → Google**
2. Toggle **Enable**
3. Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create/select a project
   - **APIs & Services → Credentials → Create OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URI: `https://auth.yourdomain.com/auth/v1/callback`
4. Paste the **Client ID** and **Client Secret** back in Supabase
5. In **Google Auth Platform → Branding**, set your app name/logo so users see your brand instead of a raw project hostname

---

## 4. Configure Redirect URLs in Supabase

Supabase Dashboard → **Authentication → URL Configuration**

- **Site URL:** `http://localhost:5173` (or your deployed URL)
- **Redirect URLs:** add `http://localhost:5173/**` and your production URL
- If you use a custom auth domain, make sure it is fully activated in Supabase before testing Google login
- Keep both callback URLs in Google during migration if needed:
  - `https://xzejdqclpeuawvefjwcn.supabase.co/auth/v1/callback`
  - `https://auth.yourdomain.com/auth/v1/callback`
- Once the custom domain is active and the app uses `VITE_SUPABASE_URL=https://auth.yourdomain.com`, users should stop seeing the default `supabase.co` callback domain on Google’s consent screen

---

## 5. Run SQL in Supabase

Go to **Supabase Dashboard → SQL Editor** and run:

```sql
-- Profiles table (stores Google user data)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);


-- PRDs table (optional: persist PRDs per user)
create table if not exists public.prds (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_name text not null,
  prd_content text not null,
  version integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.prds enable row level security;

create policy "Users can manage own PRDs"
  on prds for all using (auth.uid() = user_id);
```

---

## 6. Start Development

```bash
npm run dev
```

---

## How AI calls work

| Priority | Provider | Cost | Notes |
|---|---|---|---|
| 1st | OpenRouter | Free | 10 models with auto-fallback |
| 2nd | Anthropic | Paid | Only if VITE_ANTHROPIC_API_KEY set |
| 3rd | Mock | — | Built-in template, always works |

If OpenRouter API call fails on one model, the app automatically tries the next model in the list. If all fail, it falls back to a template PRD and shows a warning toast.
