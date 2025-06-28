-- ============================================
-- Step 1: Create Tables
-- ============================================

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    total_days INTEGER NOT NULL DEFAULT 100,
    category VARCHAR(50) DEFAULT 'spiritual',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create challenge_prompts table
CREATE TABLE IF NOT EXISTS challenge_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    scripture_reference VARCHAR(255),
    scripture_text TEXT,
    context_text TEXT,
    morning_prompt TEXT NOT NULL,
    evening_reflection TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(challenge_id, day_number)
);

-- Create user_challenges table
CREATE TABLE IF NOT EXISTS user_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('morning', 'both')),
    current_day INTEGER DEFAULT 1,
    longest_streak INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    last_entry_date DATE,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

-- Create challenge_entries table
CREATE TABLE IF NOT EXISTS challenge_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_challenge_id UUID NOT NULL REFERENCES user_challenges(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    morning_entry TEXT,
    evening_entry TEXT,
    completed_offline BOOLEAN DEFAULT FALSE,
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_challenge_id, day_number)
);