-- =============================================================
-- FAIRWAY FOR GOOD — Supabase Database Schema
-- Run this in Supabase SQL Editor (new project)
-- =============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: profiles (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'subscriber' CHECK (role IN ('subscriber', 'admin')),
  avatar_url TEXT,
  handicap INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Service can insert profiles" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- TABLE: subscriptions
-- ============================================================
CREATE TABLE subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'lapsed', 'past_due')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'gbp',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all subscriptions" ON subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Service can manage subscriptions" ON subscriptions FOR ALL USING (true);

-- ============================================================
-- TABLE: golf_scores
-- ============================================================
CREATE TABLE golf_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  score_date DATE NOT NULL,
  course_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE golf_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own scores" ON golf_scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all scores" ON golf_scores FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Enforce max 5 scores per user via function
CREATE OR REPLACE FUNCTION enforce_max_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- After insert, delete oldest if more than 5
  DELETE FROM golf_scores
  WHERE id IN (
    SELECT id FROM golf_scores
    WHERE user_id = NEW.user_id
    ORDER BY score_date DESC, created_at DESC
    OFFSET 5
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_enforce_max_scores
AFTER INSERT ON golf_scores
FOR EACH ROW EXECUTE FUNCTION enforce_max_scores();

-- ============================================================
-- TABLE: charities
-- ============================================================
CREATE TABLE charities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  image_emoji TEXT DEFAULT '💚',
  image_url TEXT,
  website_url TEXT,
  charity_number TEXT,
  active BOOLEAN DEFAULT true,
  raised_total DECIMAL(12,2) DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE charities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active charities" ON charities FOR SELECT USING (active = true OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage charities" ON charities FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- TABLE: charity_selections
-- ============================================================
CREATE TABLE charity_selections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  charity_id UUID REFERENCES charities(id) ON DELETE SET NULL,
  contribution_percentage INTEGER DEFAULT 10 CHECK (contribution_percentage >= 10 AND contribution_percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE charity_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own charity selection" ON charity_selections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all selections" ON charity_selections FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- TABLE: draws
-- ============================================================
CREATE TABLE draws (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  draw_month TEXT NOT NULL,
  draw_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  prize_pool DECIMAL(12,2) DEFAULT 0,
  jackpot_pool DECIMAL(12,2) DEFAULT 0,
  major_pool DECIMAL(12,2) DEFAULT 0,
  standard_pool DECIMAL(12,2) DEFAULT 0,
  jackpot_carry DECIMAL(12,2) DEFAULT 0,
  jackpot_rolled_over BOOLEAN DEFAULT false,
  winning_numbers INTEGER[],
  draw_logic TEXT DEFAULT 'random' CHECK (draw_logic IN ('random', 'algorithmic')),
  participants INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE draws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view draws" ON draws FOR SELECT USING (true);
CREATE POLICY "Admins can manage draws" ON draws FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- TABLE: winnings
-- ============================================================
CREATE TABLE winnings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  draw_id UUID REFERENCES draws(id) ON DELETE CASCADE NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('5_match', '4_match', '3_match')),
  amount DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'verified', 'paid', 'rejected')),
  proof_url TEXT,
  verified_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE winnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own winnings" ON winnings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all winnings" ON winnings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Service can insert winnings" ON winnings FOR INSERT WITH CHECK (true);

-- ============================================================
-- FUNCTION: Auto-update charity raised_total on payout
-- ============================================================
CREATE OR REPLACE FUNCTION update_charity_raised()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    -- Add 10% of subscription amount to charity
    UPDATE charities c
    SET raised_total = raised_total + (
      SELECT COALESCE(SUM(s.amount * (cs.contribution_percentage::DECIMAL / 100)), 0)
      FROM subscriptions s
      JOIN charity_selections cs ON cs.user_id = s.user_id
      WHERE cs.charity_id = c.id AND s.status = 'active'
      LIMIT 1
    )
    WHERE c.id IN (
      SELECT cs.charity_id FROM charity_selections cs WHERE cs.user_id = NEW.user_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SEED DATA: Demo charities
-- ============================================================
INSERT INTO charities (name, category, description, image_emoji, active, raised_total, featured) VALUES
  ('Children''s Cancer Fund UK', 'Health', 'Supporting children and families affected by cancer across the UK with research funding and direct support services.', '🏥', true, 124000, true),
  ('Ocean Cleanup Project', 'Environment', 'Removing plastic pollution from our oceans and rivers to protect marine life and coastal communities.', '🌊', true, 82000, false),
  ('Food Banks UK', 'Hunger', 'Providing emergency food and support to people in crisis across the UK''s network of food banks.', '🥗', true, 158000, true),
  ('Mental Health UK', 'Wellness', 'Championing positive mental health and supporting those affected by mental illness.', '💚', true, 61000, false),
  ('Shelter Housing Charity', 'Community', 'Fighting for people''s rights and wellbeing, providing advice and support to those without safe homes.', '🏠', true, 93000, false),
  ('Age UK', 'Elderly Care', 'Working to make later life the best it can be for everyone by providing services and support.', '❤️', true, 76000, false),
  ('RNLI Lifeboats', 'Emergency', 'Saving lives at sea through skilled lifeboat crews, lifeguards, and water safety education.', '🚤', true, 45000, false),
  ('Woodland Trust', 'Environment', 'Protecting and restoring ancient woodland and planting trees to create new habitats.', '🌳', true, 38000, false);

-- ============================================================
-- SEED DATA: Demo active draw for March 2026
-- ============================================================
INSERT INTO draws (draw_month, draw_date, status, prize_pool, jackpot_pool, major_pool, standard_pool, jackpot_carry, participants)
VALUES ('March 2026', '2026-03-31 23:59:00+00', 'active', 48250, 19300, 16887, 12063, 0, 2413);

-- ============================================================
-- NOTE: Create admin user via Supabase Auth dashboard or:
-- 1. Register normally via app
-- 2. Then in SQL: UPDATE profiles SET role = 'admin' WHERE email = 'admin@yourdomain.com';
-- ============================================================
