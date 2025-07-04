-- Clean up existing user challenge data
-- This removes all user progress to allow fresh start with new system
-- Run this in Supabase SQL Editor

-- Your user ID (admin user)
-- b16b8fe8-1ae7-449e-89d6-3d286294afd2

-- Delete challenge entries (journal entries)
DELETE FROM challenge_entries 
WHERE user_id = 'b16b8fe8-1ae7-449e-89d6-3d286294afd2';

-- Delete user challenges (active challenge records)
DELETE FROM user_challenges 
WHERE user_id = 'b16b8fe8-1ae7-449e-89d6-3d286294afd2';

-- Delete any weekly reviews
DELETE FROM weekly_reviews 
WHERE user_challenge_id IN (
  SELECT id FROM user_challenges 
  WHERE user_id = 'b16b8fe8-1ae7-449e-89d6-3d286294afd2'
);

-- Optional: Delete old journal_entries table data if it exists
-- (This is from the old system - may not exist in new schema)
DELETE FROM journal_entries 
WHERE user_id = 'b16b8fe8-1ae7-449e-89d6-3d286294afd2';

-- Verify cleanup - these should return 0 rows
SELECT COUNT(*) as challenge_entries_count FROM challenge_entries WHERE user_id = 'b16b8fe8-1ae7-449e-89d6-3d286294afd2';
SELECT COUNT(*) as user_challenges_count FROM user_challenges WHERE user_id = 'b16b8fe8-1ae7-449e-89d6-3d286294afd2';
SELECT COUNT(*) as weekly_reviews_count FROM weekly_reviews WHERE user_challenge_id IN (SELECT id FROM user_challenges WHERE user_id = 'b16b8fe8-1ae7-449e-89d6-3d286294afd2');