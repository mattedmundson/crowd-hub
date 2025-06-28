-- ============================================
-- Step 2: Create Indexes for Performance
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