-- Create weekly_reviews table for weekly reflection and planning
-- Supports the Sunday review day functionality in the new challenge system

CREATE TABLE IF NOT EXISTS weekly_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_challenge_id UUID REFERENCES user_challenges(id) ON DELETE CASCADE NOT NULL,
  week_number INTEGER NOT NULL,
  review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Weekly reflection questions
  challenges_completed_this_week INTEGER DEFAULT 0,
  key_learnings TEXT,
  biggest_challenge TEXT,
  gratitude_highlights TEXT,
  
  -- Planning for next week
  weekly_intentions TEXT,
  specific_goals TEXT,
  prayer_requests TEXT,
  
  -- Celebration and encouragement
  celebrate_wins TEXT,
  encouragement_notes TEXT,
  
  -- Progress tracking
  overall_mood_rating INTEGER CHECK (overall_mood_rating >= 1 AND overall_mood_rating <= 10),
  spiritual_growth_rating INTEGER CHECK (spiritual_growth_rating >= 1 AND spiritual_growth_rating <= 10),
  consistency_rating INTEGER CHECK (consistency_rating >= 1 AND consistency_rating <= 10),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS weekly_reviews_user_challenge_idx ON weekly_reviews(user_challenge_id);
CREATE INDEX IF NOT EXISTS weekly_reviews_week_number_idx ON weekly_reviews(user_challenge_id, week_number);
CREATE INDEX IF NOT EXISTS weekly_reviews_review_date_idx ON weekly_reviews(review_date);

-- Add unique constraint to prevent duplicate reviews for the same week
ALTER TABLE weekly_reviews 
ADD CONSTRAINT weekly_reviews_user_challenge_week_unique UNIQUE (user_challenge_id, week_number);

-- Enable RLS
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own reviews
CREATE POLICY "Users can read own weekly reviews" ON weekly_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_challenges 
      WHERE id = weekly_reviews.user_challenge_id 
      AND user_id = auth.uid()
    )
  );

-- Users can insert their own reviews
CREATE POLICY "Users can insert own weekly reviews" ON weekly_reviews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_challenges 
      WHERE id = weekly_reviews.user_challenge_id 
      AND user_id = auth.uid()
    )
  );

-- Users can update their own reviews
CREATE POLICY "Users can update own weekly reviews" ON weekly_reviews
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_challenges 
      WHERE id = weekly_reviews.user_challenge_id 
      AND user_id = auth.uid()
    )
  );

-- Admins can read all reviews (for insights and support)
CREATE POLICY "Admins can read all weekly reviews" ON weekly_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add comments
COMMENT ON TABLE weekly_reviews IS 'Weekly reflection and planning sessions for challenge participants';
COMMENT ON COLUMN weekly_reviews.week_number IS 'Sequential week number within the challenge (1, 2, 3...)';
COMMENT ON COLUMN weekly_reviews.challenges_completed_this_week IS 'Number of challenges completed in this specific week';
COMMENT ON COLUMN weekly_reviews.overall_mood_rating IS 'Self-reported mood rating for the week (1-10 scale)';
COMMENT ON COLUMN weekly_reviews.spiritual_growth_rating IS 'Self-reported spiritual growth for the week (1-10 scale)';
COMMENT ON COLUMN weekly_reviews.consistency_rating IS 'Self-reported consistency rating for the week (1-10 scale)';