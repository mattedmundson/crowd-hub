-- ============================================
-- Gratitude Challenge Database Schema
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

-- ============================================
-- Indexes for Performance
-- ============================================

-- Challenges
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_challenges_category ON challenges(category);

-- Challenge Prompts
CREATE INDEX IF NOT EXISTS idx_prompts_challenge_day ON challenge_prompts(challenge_id, day_number);

-- User Challenges
CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_dates ON user_challenges(last_entry_date, current_streak);
CREATE INDEX IF NOT EXISTS idx_user_challenges_active ON user_challenges(user_id, completed);

-- Challenge Entries
CREATE INDEX IF NOT EXISTS idx_entries_user_challenge ON challenge_entries(user_challenge_id);
CREATE INDEX IF NOT EXISTS idx_entries_day ON challenge_entries(day_number);
CREATE INDEX IF NOT EXISTS idx_entries_updated ON challenge_entries(updated_at);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on user tables
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_entries ENABLE ROW LEVEL SECURITY;

-- User Challenges Policies
CREATE POLICY IF NOT EXISTS "Users can view own challenges" ON user_challenges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create own challenges" ON user_challenges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own challenges" ON user_challenges
    FOR UPDATE USING (auth.uid() = user_id);

-- Challenge Entries Policies
CREATE POLICY IF NOT EXISTS "Users can view own entries" ON challenge_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_challenges uc 
            WHERE uc.id = challenge_entries.user_challenge_id 
            AND uc.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Users can create own entries" ON challenge_entries
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_challenges uc 
            WHERE uc.id = challenge_entries.user_challenge_id 
            AND uc.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Users can update own entries" ON challenge_entries
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_challenges uc 
            WHERE uc.id = challenge_entries.user_challenge_id 
            AND uc.user_id = auth.uid()
        )
    );

-- Public read access for challenges and prompts (no sensitive data)
CREATE POLICY IF NOT EXISTS "Anyone can view challenges" ON challenges
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Anyone can view challenge prompts" ON challenge_prompts
    FOR SELECT USING (true);

-- ============================================
-- Helper Functions
-- ============================================

-- Function to calculate current day based on start date
CREATE OR REPLACE FUNCTION calculate_current_day(start_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN GREATEST(1, LEAST(100, (CURRENT_DATE - start_date) + 1));
END;
$$ LANGUAGE plpgsql;

-- Function to update user challenge progress
CREATE OR REPLACE FUNCTION update_challenge_progress(user_challenge_uuid UUID)
RETURNS void AS $$
DECLARE
    entry_dates DATE[];
    current_streak_count INTEGER := 0;
    longest_streak_count INTEGER := 0;
    temp_streak INTEGER := 0;
    i INTEGER;
    prev_date DATE;
BEGIN
    -- Get all entry dates for this user challenge, ordered by date
    SELECT ARRAY_AGG(DATE(created_at) ORDER BY DATE(created_at))
    INTO entry_dates
    FROM challenge_entries ce
    JOIN user_challenges uc ON ce.user_challenge_id = uc.id
    WHERE uc.id = user_challenge_uuid
    AND (ce.morning_entry IS NOT NULL OR ce.evening_entry IS NOT NULL OR ce.completed_offline = true);
    
    -- If no entries, reset streaks
    IF entry_dates IS NULL OR array_length(entry_dates, 1) = 0 THEN
        UPDATE user_challenges 
        SET current_streak = 0, longest_streak = 0, last_entry_date = NULL
        WHERE id = user_challenge_uuid;
        RETURN;
    END IF;
    
    -- Calculate current streak (from most recent entry)
    current_streak_count := 1;
    prev_date := entry_dates[array_length(entry_dates, 1)];
    
    FOR i IN REVERSE (array_length(entry_dates, 1) - 1)..1 LOOP
        IF entry_dates[i] = prev_date - INTERVAL '1 day' THEN
            current_streak_count := current_streak_count + 1;
            prev_date := entry_dates[i];
        ELSE
            EXIT;
        END IF;
    END LOOP;
    
    -- Calculate longest streak
    temp_streak := 1;
    longest_streak_count := 1;
    
    FOR i IN 2..array_length(entry_dates, 1) LOOP
        IF entry_dates[i] = entry_dates[i-1] + INTERVAL '1 day' THEN
            temp_streak := temp_streak + 1;
            longest_streak_count := GREATEST(longest_streak_count, temp_streak);
        ELSE
            temp_streak := 1;
        END IF;
    END LOOP;
    
    -- Update the user_challenges record
    UPDATE user_challenges 
    SET 
        current_streak = current_streak_count,
        longest_streak = longest_streak_count,
        last_entry_date = entry_dates[array_length(entry_dates, 1)],
        current_day = calculate_current_day(start_date),
        updated_at = NOW()
    WHERE id = user_challenge_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON TABLE challenges IS 'Available challenges (e.g., 100 Days of Gratitude)';
COMMENT ON TABLE challenge_prompts IS 'Daily prompts and content for each challenge';
COMMENT ON TABLE user_challenges IS 'User participation in challenges with progress tracking';
COMMENT ON TABLE challenge_entries IS 'Daily entries/reflections by users';

COMMENT ON COLUMN challenge_prompts.scripture_reference IS 'Bible verse reference (e.g., "1 Thessalonians 5:18")';
COMMENT ON COLUMN challenge_prompts.scripture_text IS 'Full text of the scripture passage';
COMMENT ON COLUMN challenge_prompts.context_text IS 'Explanatory context about the scripture';
COMMENT ON COLUMN challenge_prompts.morning_prompt IS 'Question/prompt for morning reflection';
COMMENT ON COLUMN challenge_prompts.evening_reflection IS 'Optional evening reflection prompt';

COMMENT ON COLUMN user_challenges.schedule_type IS 'Either "morning" (once daily) or "both" (morning + evening)';
COMMENT ON COLUMN user_challenges.current_day IS 'Current day in the challenge (1-100)';
COMMENT ON COLUMN user_challenges.current_streak IS 'Consecutive days with entries';
COMMENT ON COLUMN user_challenges.longest_streak IS 'Longest streak achieved';

COMMENT ON COLUMN challenge_entries.completed_offline IS 'User marked day as done offline (no text entry)';
COMMENT ON COLUMN challenge_entries.review_notes IS 'Additional notes added during weekly reviews';

-- End of schema