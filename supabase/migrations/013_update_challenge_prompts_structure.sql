-- Update challenge_prompts table for challenge-based system
-- Rename day_number to challenge_number to decouple from calendar days

-- Rename the column to reflect challenge-based numbering
ALTER TABLE challenge_prompts 
RENAME COLUMN day_number TO challenge_number;

-- Update the comment to reflect the new purpose
COMMENT ON COLUMN challenge_prompts.challenge_number IS 'Sequential challenge number (1, 2, 3...) independent of calendar days';

-- Add a constraint to ensure challenge numbers are positive
ALTER TABLE challenge_prompts 
ADD CONSTRAINT challenge_prompts_challenge_number_check CHECK (challenge_number >= 1);

-- Update indexes to use the new column name
DROP INDEX IF EXISTS challenge_prompts_challenge_id_day_number_idx;
CREATE INDEX IF NOT EXISTS challenge_prompts_challenge_id_challenge_number_idx ON challenge_prompts(challenge_id, challenge_number);

-- Add a unique constraint to prevent duplicate challenge numbers within a challenge
ALTER TABLE challenge_prompts 
ADD CONSTRAINT challenge_prompts_challenge_id_challenge_number_unique UNIQUE (challenge_id, challenge_number);