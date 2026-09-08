-- ==========================================================
-- Project Name: Daily Storage (Notepad)
-- Database: Supabase (PostgreSQL)
-- Description: Schema with Row Level Security (RLS)
--              Users can only see, create, update, and delete
--              their own notes.
-- ==========================================================

-- 1. Create 'notes' table
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Links note directly to Supabase Auth user
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Performance indexes for fast querying by user
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_created_at ON public.notes(user_id, created_at DESC);

-- 3. Automatically update the 'updated_at' timestamp on edit
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_notes_updated_at ON public.notes;
CREATE TRIGGER set_notes_updated_at
    BEFORE UPDATE ON public.notes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================================
-- 4. Enable Row Level Security (RLS)
-- ==========================================================
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT (Users can only view their own notes)
CREATE POLICY "Users can view their own notes"
ON public.notes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: INSERT (Users can only create notes for themselves)
CREATE POLICY "Users can create their own notes"
ON public.notes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 3: UPDATE (Users can only update their own notes)
CREATE POLICY "Users can update their own notes"
ON public.notes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: DELETE (Users can only delete their own notes)
CREATE POLICY "Users can delete their own notes"
ON public.notes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ==========================================================
-- 5. Auto-confirm Users on Sign Up (Email Verification OFF)
-- ==========================================================
-- This trigger automatically confirms every new user upon signup,
-- allowing instant login without email verification.
CREATE OR REPLACE FUNCTION public.auto_confirm_new_users()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, timezone('utc'::text, now()));
    NEW.confirmed_at = COALESCE(NEW.confirmed_at, timezone('utc'::text, now()));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_confirm
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_confirm_new_users();

-- ==========================================================
-- 6. Instant Username-based Registration (Zero Email Sending)
-- ==========================================================
-- This RPC function creates users directly inside auth.users with
-- email_confirmed_at already set, completely bypassing Supabase's
-- SMTP mailer and eliminating 'over_email_send_rate_limit' errors!
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.create_new_user(
    username TEXT,
    password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    new_user_id UUID;
    auth_email TEXT;
    encrypted_pw TEXT;
    clean_username TEXT;
BEGIN
    clean_username := lower(trim(username));
    clean_username := regexp_replace(clean_username, '\s+', '_', 'g');
    clean_username := regexp_replace(clean_username, '[^a-z0-9_.-]', '', 'g');

    IF length(clean_username) < 3 THEN
        RAISE EXCEPTION 'Username must be at least 3 characters long.';
    END IF;

    IF length(password) < 6 THEN
        RAISE EXCEPTION 'Password must be at least 6 characters long.';
    END IF;

    auth_email := clean_username || '@dailystorage.app';

    -- Check if username already exists in auth.users
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = auth_email) THEN
        RAISE EXCEPTION 'This name is already taken. Please choose another name or sign in.';
    END IF;

    new_user_id := gen_random_uuid();
    encrypted_pw := extensions.crypt(password, extensions.gen_salt('bf'));

    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        auth_email,
        encrypted_pw,
        timezone('utc'::text, now()),
        NULL,
        NULL,
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('username', clean_username, 'display_name', clean_username),
        timezone('utc'::text, now()),
        timezone('utc'::text, now()),
        '',
        '',
        '',
        ''
    );

    -- Insert into auth.identities so Supabase Auth recognizes password login
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        new_user_id,
        jsonb_build_object('sub', new_user_id::text, 'email', auth_email),
        'email',
        new_user_id::text,
        NULL,
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    );

    RETURN jsonb_build_object(
        'success', true,
        'user_id', new_user_id,
        'username', clean_username
    );
END;
$$;


