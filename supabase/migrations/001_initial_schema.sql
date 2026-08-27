-- ============================================
-- Teacher Student App - Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('teacher', 'student')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. ROOMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    teacher_name TEXT NOT NULL DEFAULT 'Teacher',
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    room_code TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active rooms" ON public.rooms
    FOR SELECT USING (true);

CREATE POLICY "Teachers can create rooms" ON public.rooms
    FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update own rooms" ON public.rooms
    FOR UPDATE USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete own rooms" ON public.rooms
    FOR DELETE USING (auth.uid() = teacher_id);

-- ============================================
-- 3. ROOM PARTICIPANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.room_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL DEFAULT 'User',
    avatar_url TEXT,
    is_muted BOOLEAN NOT NULL DEFAULT FALSE,
    is_video_off BOOLEAN NOT NULL DEFAULT FALSE,
    is_kicked BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view participants" ON public.room_participants
    FOR SELECT USING (true);

CREATE POLICY "Users can add themselves" ON public.room_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Teachers can update participants" ON public.room_participants
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.rooms
            WHERE id = room_id AND teacher_id = auth.uid()
        )
        OR auth.uid() = user_id
    );

CREATE POLICY "Users can delete own participation" ON public.room_participants
    FOR DELETE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.rooms
            WHERE id = room_id AND teacher_id = auth.uid()
        )
    );

-- ============================================
-- 4. REALTIME - Enable for tables
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;

-- ============================================
-- 5. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
