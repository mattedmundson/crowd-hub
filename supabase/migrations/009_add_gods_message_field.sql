-- Add god_message field to challenge_entries table
ALTER TABLE challenge_entries 
ADD COLUMN god_message TEXT;

-- Add comment to describe the field
COMMENT ON COLUMN challenge_entries.god_message IS 'What the user feels God is saying to them about the scripture verse';