-- Update challenge_entries table for challenge-based system
-- Rename day_number to challenge_number to match the new challenge-based approach

-- Rename the column to reflect challenge-based numbering
ALTER TABLE challenge_entries 
RENAME COLUMN day_number TO challenge_number;

-- Update the comment to reflect the new purpose
COMMENT ON COLUMN challenge_entries.challenge_number IS 'Sequential challenge number (1, 2, 3...) that this entry corresponds to';

-- Add a constraint to ensure challenge numbers are positive
ALTER TABLE challenge_entries 
ADD CONSTRAINT challenge_entries_challenge_number_check CHECK (challenge_number >= 1);

-- Update indexes to use the new column name
DROP INDEX IF EXISTS challenge_entries_user_challenge_id_day_number_idx;
CREATE INDEX IF NOT EXISTS challenge_entries_user_challenge_id_challenge_number_idx ON challenge_entries(user_challenge_id, challenge_number);

-- Add a unique constraint to prevent duplicate entries for the same challenge number
ALTER TABLE challenge_entries 
DROP CONSTRAINT IF EXISTS challenge_entries_user_challenge_id_day_number_unique;
ALTER TABLE challenge_entries 
ADD CONSTRAINT challenge_entries_user_challenge_id_challenge_number_unique UNIQUE (user_challenge_id, challenge_number);

-- Add an index for querying completed challenges efficiently
CREATE INDEX IF NOT EXISTS challenge_entries_completed_idx ON challenge_entries(user_challenge_id, challenge_number) 
WHERE (morning_entry IS NOT NULL AND morning_entry != '') 
   OR (evening_entry IS NOT NULL AND evening_entry != '') 
   OR (god_message IS NOT NULL AND god_message != '') 
   OR completed_offline = true;