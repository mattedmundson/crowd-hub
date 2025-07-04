-- Update challenges table for multi-theme challenge system
-- Add fields to support multiple challenge themes with variable lengths

-- Add new columns to challenges table
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS total_challenges INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'gratitude',
ADD COLUMN IF NOT EXISTS weekly_schedule BOOLEAN DEFAULT true;

-- Update the existing gratitude challenge with new fields
UPDATE challenges 
SET 
  total_challenges = 100,
  theme = 'gratitude',
  weekly_schedule = true
WHERE title = '100 Days of Gratitude';

-- Add constraints and comments
ALTER TABLE challenges 
ADD CONSTRAINT challenges_total_challenges_check CHECK (total_challenges >= 1),
ADD CONSTRAINT challenges_theme_check CHECK (theme IN ('gratitude', 'prayer', 'faith', 'service', 'worship', 'scripture'));

COMMENT ON COLUMN challenges.total_challenges IS 'Total number of challenges in this theme (minimum 70, typically 70-100+)';
COMMENT ON COLUMN challenges.theme IS 'The theme category of this challenge (gratitude, prayer, faith, etc.)';
COMMENT ON COLUMN challenges.weekly_schedule IS 'Whether this challenge uses Mon-Fri schedule with Sunday reviews';

-- Create index for theme-based queries
CREATE INDEX IF NOT EXISTS challenges_theme_idx ON challenges(theme);
CREATE INDEX IF NOT EXISTS challenges_active_theme_idx ON challenges(theme, is_active);