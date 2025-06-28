-- ============================================
-- Step 4: Helper Functions
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