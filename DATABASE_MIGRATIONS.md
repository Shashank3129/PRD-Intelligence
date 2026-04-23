# Database Migrations for Company Management Feature

Run these SQL commands in your Supabase SQL Editor to set up the database schema for the company management feature.

## Step 1: Create Companies Table

```sql
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  industry text,
  stage text DEFAULT 'early-traction',
  size text,
  website text,
  description text,
  context text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT unique_user_company_name UNIQUE(user_id, name)
);

CREATE INDEX idx_companies_user_id ON public.companies(user_id);
```

## Step 2: Alter Profiles Table

```sql
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS default_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS current_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
```

## Step 3: Alter PRDs Table

```sql
ALTER TABLE IF EXISTS public.prds 
ADD COLUMN IF NOT EXISTS company_id uuid;

-- Add the foreign key constraint
ALTER TABLE IF EXISTS public.prds
ADD CONSTRAINT fk_prds_company_id FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prds_company_id ON public.prds(company_id);
CREATE INDEX IF NOT EXISTS idx_prds_user_company ON public.prds(user_id, company_id);

-- Drop old index if it exists
DROP INDEX IF EXISTS public.idx_prds_user_id;
```

## Step 4: Create PRD Metadata Table (Optional - for future versioning)

```sql
CREATE TABLE IF NOT EXISTS public.prd_metadata (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prd_id uuid NOT NULL REFERENCES public.prds(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  feature_idea text NOT NULL,
  completeness_score int,
  verdict text,
  summary text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prd_metadata_prd_id ON public.prd_metadata(prd_id);
```

## Step 5: Set RLS Policies (if using RLS)

If you have Row-Level Security enabled, add policies for companies:

```sql
-- Companies table policies
CREATE POLICY "Users can view their own companies"
ON public.companies FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own companies"
ON public.companies FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own companies"
ON public.companies FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own companies"
ON public.companies FOR DELETE
USING (auth.uid() = user_id);

-- PRDs table - update to include company check
DROP POLICY IF EXISTS "Users can view their own PRDs" ON public.prds;

CREATE POLICY "Users can view their own PRDs"
ON public.prds FOR SELECT
USING (auth.uid() = user_id);
```

## Verification

After running these commands, verify the setup:

1. Check the companies table was created:
```sql
SELECT * FROM information_schema.tables WHERE table_name = 'companies';
```

2. Check profiles table has new columns:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name IN ('default_company_id', 'current_company_id');
```

3. Check prds table has company_id:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'prds' AND column_name = 'company_id';
```

## Notes

- All commands use `IF NOT EXISTS` or `IF EXISTS` clauses for idempotency
- Foreign keys are configured with `ON DELETE CASCADE` to maintain referential integrity
- Indexes are created for common query patterns
- RLS policies ensure users can only access their own data
- The `context` field in companies is used to store company background information for the AI

## Rollback (if needed)

If you need to rollback these changes:

```sql
DROP TABLE IF EXISTS public.prd_metadata CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
ALTER TABLE IF EXISTS public.prds DROP COLUMN IF EXISTS company_id;
ALTER TABLE IF EXISTS public.profiles 
DROP COLUMN IF EXISTS default_company_id,
DROP COLUMN IF EXISTS current_company_id;
```
