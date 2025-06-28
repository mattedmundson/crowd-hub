-- ============================================
-- Step 3: Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on user tables
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing challenge-related policies if they exist (ignore errors)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view own challenges" ON user_challenges;
    DROP POLICY IF EXISTS "Users can create own challenges" ON user_challenges;
    DROP POLICY IF EXISTS "Users can update own challenges" ON user_challenges;
    DROP POLICY IF EXISTS "Users can view own entries" ON challenge_entries;
    DROP POLICY IF EXISTS "Users can create own entries" ON challenge_entries;
    DROP POLICY IF EXISTS "Users can update own entries" ON challenge_entries;
    DROP POLICY IF EXISTS "Anyone can view challenges" ON challenges;
    DROP POLICY IF EXISTS "Anyone can view challenge prompts" ON challenge_prompts;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Ignore errors if policies don't exist
END $$;

-- User Challenges Policies
CREATE POLICY "Users can view own challenges" ON user_challenges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own challenges" ON user_challenges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges" ON user_challenges
    FOR UPDATE USING (auth.uid() = user_id);

-- Challenge Entries Policies
CREATE POLICY "Users can view own entries" ON challenge_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_challenges uc 
            WHERE uc.id = challenge_entries.user_challenge_id 
            AND uc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own entries" ON challenge_entries
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_challenges uc 
            WHERE uc.id = challenge_entries.user_challenge_id 
            AND uc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own entries" ON challenge_entries
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_challenges uc 
            WHERE uc.id = challenge_entries.user_challenge_id 
            AND uc.user_id = auth.uid()
        )
    );

-- Public read access for challenges and prompts (no sensitive data)
CREATE POLICY "Anyone can view challenges" ON challenges
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view challenge prompts" ON challenge_prompts
    FOR SELECT USING (true);