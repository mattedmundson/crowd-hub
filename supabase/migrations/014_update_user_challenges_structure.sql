-- Update user_challenges table for challenge-based tracking system
-- Add fields to support flexible challenge completion and weekly reviews

-- Add new columns for challenge-based tracking
ALTER TABLE user_challenges 
ADD COLUMN IF NOT EXISTS current_challenge_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_review_day INTEGER DEFAULT 0, -- 0=Sunday, 1=Monday, etc.
ADD COLUMN IF NOT EXISTS last_challenge_date DATE,
ADD COLUMN IF NOT EXISTS weekly_goal INTEGER DEFAULT 5; -- Challenges per week (Mon-Fri)

-- Rename current_day to legacy_current_day to preserve data during transition
ALTER TABLE user_challenges 
RENAME COLUMN current_day TO legacy_current_day;

-- Update existing records to set current_challenge_number based on legacy_current_day
UPDATE user_challenges 
SET current_challenge_number = GREATEST(1, legacy_current_day);

-- Add constraints
ALTER TABLE user_challenges 
ADD CONSTRAINT user_challenges_current_challenge_number_check CHECK (current_challenge_number >= 1),
ADD CONSTRAINT user_challenges_total_completed_check CHECK (total_completed >= 0),
ADD CONSTRAINT user_challenges_weekly_review_day_check CHECK (weekly_review_day >= 0 AND weekly_review_day <= 6),
ADD CONSTRAINT user_challenges_weekly_goal_check CHECK (weekly_goal >= 1 AND weekly_goal <= 7);

-- Add comments to describe the new fields
COMMENT ON COLUMN user_challenges.current_challenge_number IS 'The next challenge number to be completed (1-based)';
COMMENT ON COLUMN user_challenges.total_completed IS 'Total number of challenges completed in this challenge theme';
COMMENT ON COLUMN user_challenges.weekly_review_day IS 'Day of week for weekly reviews (0=Sunday, 1=Monday, ..., 6=Saturday)';
COMMENT ON COLUMN user_challenges.last_challenge_date IS 'Date when the last challenge was completed';
COMMENT ON COLUMN user_challenges.weekly_goal IS 'Target challenges per week (typically 5 for Mon-Fri schedule)';
COMMENT ON COLUMN user_challenges.legacy_current_day IS 'Legacy day number field - to be removed after migration';

-- Update completion logic: a challenge is completed when total_completed equals the challenge total_challenges
-- We'll handle this in application logic, but add an index for performance
CREATE INDEX IF NOT EXISTS user_challenges_completion_tracking_idx ON user_challenges(user_id, current_challenge_number, total_completed);

-- Update existing indexes
CREATE INDEX IF NOT EXISTS user_challenges_active_idx ON user_challenges(user_id, completed) WHERE completed = false;