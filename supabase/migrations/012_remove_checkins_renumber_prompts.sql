-- Migration to remove CHECK-IN prompts and renumber remaining prompts
-- for challenge_id = '2cfa2be0-39af-4134-bb39-d476e3a12489'

BEGIN;

-- First, let's verify what we're about to do by checking the CHECK-IN prompts
DO $$
DECLARE
  checkin_count INTEGER;
  total_prompts INTEGER;
BEGIN
  SELECT COUNT(*) INTO checkin_count 
  FROM challenge_prompts 
  WHERE challenge_id = '2cfa2be0-39af-4134-bb39-d476e3a12489' 
  AND scripture_reference = 'CHECK-IN';
  
  SELECT COUNT(*) INTO total_prompts
  FROM challenge_prompts 
  WHERE challenge_id = '2cfa2be0-39af-4134-bb39-d476e3a12489';
  
  RAISE NOTICE 'Found % CHECK-IN prompts out of % total prompts', checkin_count, total_prompts;
END $$;

-- Create a temporary table with the new numbering
CREATE TEMP TABLE temp_renumbered_prompts AS
WITH ordered_prompts AS (
  SELECT 
    id,
    challenge_id,
    challenge_number,
    scripture_reference,
    scripture_text,
    context_text,
    morning_prompt,
    evening_reflection,
    created_at,
    ROW_NUMBER() OVER (ORDER BY challenge_number) as new_challenge_number
  FROM challenge_prompts
  WHERE challenge_id = '2cfa2be0-39af-4134-bb39-d476e3a12489'
    AND scripture_reference != 'CHECK-IN'
)
SELECT * FROM ordered_prompts;

-- Show what the renumbering will look like (first 20 for review)
SELECT 
  challenge_number as old_number, 
  new_challenge_number as new_number, 
  scripture_reference 
FROM temp_renumbered_prompts 
ORDER BY new_challenge_number 
LIMIT 20;

-- Delete all CHECK-IN prompts
DELETE FROM challenge_prompts 
WHERE challenge_id = '2cfa2be0-39af-4134-bb39-d476e3a12489' 
  AND scripture_reference = 'CHECK-IN';

-- Update the remaining prompts with new numbering
UPDATE challenge_prompts cp
SET challenge_number = t.new_challenge_number
FROM temp_renumbered_prompts t
WHERE cp.id = t.id;

-- Update the total_challenges count in the challenges table
-- (assuming it should now be 100 - 14 = 86)
UPDATE challenges 
SET total_challenges = (
  SELECT COUNT(*) 
  FROM challenge_prompts 
  WHERE challenge_id = '2cfa2be0-39af-4134-bb39-d476e3a12489'
)
WHERE id = '2cfa2be0-39af-4134-bb39-d476e3a12489';

-- Verify the results
DO $$
DECLARE
  final_count INTEGER;
  max_number INTEGER;
  gap_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO final_count 
  FROM challenge_prompts 
  WHERE challenge_id = '2cfa2be0-39af-4134-bb39-d476e3a12489';
  
  SELECT MAX(challenge_number) INTO max_number
  FROM challenge_prompts 
  WHERE challenge_id = '2cfa2be0-39af-4134-bb39-d476e3a12489';
  
  -- Check for gaps
  WITH expected_numbers AS (
    SELECT generate_series(1, max_number) as num
  ),
  actual_numbers AS (
    SELECT DISTINCT challenge_number as num
    FROM challenge_prompts
    WHERE challenge_id = '2cfa2be0-39af-4134-bb39-d476e3a12489'
  )
  SELECT COUNT(*) INTO gap_count
  FROM expected_numbers e
  LEFT JOIN actual_numbers a ON e.num = a.num
  WHERE a.num IS NULL;
  
  RAISE NOTICE 'Final prompt count: %', final_count;
  RAISE NOTICE 'Max challenge number: %', max_number;
  RAISE NOTICE 'Number of gaps: %', gap_count;
  
  IF gap_count > 0 THEN
    RAISE EXCEPTION 'Gaps found in numbering! Rolling back.';
  END IF;
END $$;

-- Drop the temporary table
DROP TABLE temp_renumbered_prompts;

COMMIT;

-- Show final state (first 20 prompts)
SELECT 
  challenge_number, 
  scripture_reference,
  LEFT(scripture_text, 50) || '...' as scripture_preview
FROM challenge_prompts 
WHERE challenge_id = '2cfa2be0-39af-4134-bb39-d476e3a12489'
ORDER BY challenge_number
LIMIT 20;