# Gratitude Challenge Implementation Plan

## Overview
This plan outlines the step-by-step implementation of the 100-day gratitude challenge feature for CrowdHub. The challenge will use content from a Google Sheet and provide a complete user experience for structured spiritual growth.

## Google Sheets Data Import Strategy

### Step 1: Prepare Google Sheets for Data Export
1. **Access your Google Sheet** containing the gratitude challenge content
2. **Clean up the data** to ensure consistency:
   - Verify all 100 days have entries
   - Check for any formatting issues in scripture references
   - Ensure prompts and reflections are properly formatted
3. **Export to CSV**:
   - Go to File > Download > Comma-separated values (.csv)
   - Save as `gratitude_challenge_content.csv`
   - Keep a backup copy in Google Sheets

### Step 2: Create Data Import Script
1. **Create import script** at `scripts/import-challenge-data.ts`
2. **Parse CSV data** and validate all required fields
3. **Transform data** to match database schema
4. **Handle special characters** and formatting in scripture text
5. **Validate data integrity** before database insertion

## Database Schema Implementation

### Step 3: Create Challenge Data Tables
**Dependencies**: None
**Estimated Time**: 2-3 hours

1. **Create Supabase migration** for challenge system:
   ```sql
   -- challenges table (core challenge definitions)
   CREATE TABLE challenges (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     title VARCHAR(255) NOT NULL,
     description TEXT,
     total_days INTEGER NOT NULL DEFAULT 100,
     category VARCHAR(50) DEFAULT 'spiritual',
     is_active BOOLEAN DEFAULT TRUE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- challenge_prompts table (daily content from Google Sheets)
   CREATE TABLE challenge_prompts (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
     day_number INTEGER NOT NULL,
     scripture_reference VARCHAR(255), -- REF column
     scripture_text TEXT, -- SCRIPTURE column  
     context_text TEXT, -- CONTEXT column
     morning_prompt TEXT NOT NULL, -- PROMPT column
     evening_reflection TEXT, -- REFLECTION column
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(challenge_id, day_number)
   );
   ```

2. **Add indexes** for performance:
   ```sql
   CREATE INDEX idx_prompts_challenge_day ON challenge_prompts(challenge_id, day_number);
   CREATE INDEX idx_challenges_active ON challenges(is_active);
   ```

3. **Set up RLS policies** for data access control

### Step 4: Create User Challenge Tracking Tables  
**Dependencies**: Challenge tables
**Estimated Time**: 2-3 hours

1. **Create user_challenges table** to track user progress:
   ```sql
   CREATE TABLE user_challenges (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
     start_date DATE NOT NULL DEFAULT CURRENT_DATE,
     schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('morning', 'both')),
     current_day INTEGER DEFAULT 1,
     longest_streak INTEGER DEFAULT 0,
     current_streak INTEGER DEFAULT 0,
     last_entry_date DATE,
     completed BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(user_id, challenge_id)
   );
   ```

2. **Create challenge_entries table** for user journal entries:
   ```sql
   CREATE TABLE challenge_entries (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_challenge_id UUID NOT NULL REFERENCES user_challenges(id) ON DELETE CASCADE,
     day_number INTEGER NOT NULL,
     morning_entry TEXT,
     evening_entry TEXT,
     completed_offline BOOLEAN DEFAULT FALSE,
     review_notes TEXT, -- For weekly review additions
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(user_challenge_id, day_number)
   );
   ```

3. **Add RLS policies** to ensure users only see their own data

## Data Import and Seeding

### Step 5: Import Challenge Content from Google Sheets
**Dependencies**: Database schema
**Estimated Time**: 3-4 hours

1. **Create data import script**:
   - Parse CSV file from Google Sheets export
   - Validate all required fields are present
   - Transform data to match database schema
   - Handle any formatting issues

2. **Run import process**:
   - Create the "100 Days of Gratitude" challenge record
   - Import all 100 days of prompts with proper mapping:
     - DAY No → day_number
     - REF → scripture_reference  
     - SCRIPTURE → scripture_text
     - CONTEXT → context_text
     - PROMPT → morning_prompt
     - REFLECTION → evening_reflection

3. **Validate imported data**:
   - Ensure all 100 days are present
   - Check scripture references are properly formatted
   - Verify prompts are complete and readable

## Backend API Development

### Step 6: Create Challenge API Services
**Dependencies**: Database with seeded data
**Estimated Time**: 4-5 hours

1. **Create challenge service** (`lib/services/challenges.ts`):
   - `getChallenges()` - List available challenges
   - `startChallenge(challengeId, scheduleType)` - Start new challenge for user
   - `getCurrentChallenge(userId)` - Get user's active challenge
   - `getTodaysContent(userChallengeId)` - Get today's prompt and existing entry

2. **Create entry service** (`lib/services/entries.ts`):
   - `saveEntry(entryData)` - Save/update journal entry with auto-save
   - `getEntry(userChallengeId, dayNumber)` - Get specific day's entry
   - `markOfflineComplete(userChallengeId, dayNumber)` - Mark day as done offline
   - `getWeeklyReview(userChallengeId, weekEndDay)` - Get week's entries for review

3. **Create progress service** (`lib/services/progress.ts`):
   - `calculateStreak(userChallengeId)` - Calculate current/longest streak
   - `getCalendarData(userChallengeId, month)` - Get month view data
   - `updateProgress(userChallengeId)` - Update streak and progress stats

## Frontend Component Development

### Step 7: Create Core UI Components
**Dependencies**: API services
**Estimated Time**: 6-8 hours

1. **Challenge display components**:
   - `ChallengeCard` - Shows daily prompt, scripture, context
   - `PromptDisplay` - Formatted display of daily content
   - `ScriptureCard` - Beautiful display of scripture reference and text
   - `ContextInfo` - Explanatory text about the scripture

2. **Entry components**:
   - `EntryForm` - Text area for morning/evening entries
   - `AutoSaveIndicator` - Shows save status
   - `OfflineButton` - "Done offline" option
   - `CharacterCounter` - Optional character count

3. **Progress components**:
   - `StreakCounter` - Flame icon with current streak
   - `ProgressBar` - Visual progress through 100 days
   - `CalendarView` - Month view with completion status
   - `StatsCard` - Completion rate and other metrics

### Step 8: Build Challenge Screens
**Dependencies**: UI components
**Estimated Time**: 8-10 hours

1. **TodayScreen** (`app/dashboard/gratitude/today/page.tsx`):
   - Display current day number and content
   - Show scripture reference, text, and context
   - Morning prompt always visible
   - Evening reflection (if user selected "both" schedule)
   - Entry form with auto-save
   - Navigation to calendar and progress

2. **WeeklyReviewScreen** (`app/dashboard/gratitude/review/page.tsx`):
   - Special UI for days 7, 14, 21, etc.
   - Display previous 6 days' entries in cards
   - Allow adding review notes to any past entry
   - Overall weekly reflection prompt
   - Continue to next week button

3. **CalendarScreen** (`app/dashboard/gratitude/calendar/page.tsx`):
   - Month view with completion indicators
   - Color coding: completed (green), missed (gray), today (blue)
   - Tap any day to view/edit entry
   - Streak and statistics display
   - Month navigation

4. **ChallengeStartScreen** (`app/dashboard/gratitude/start/page.tsx`):
   - Challenge description and overview
   - Morning/evening schedule selection
   - "Start Challenge" button
   - Preview of first day's content

## User Experience Features

### Step 9: Implement Auto-Save and Offline Support
**Dependencies**: Challenge screens
**Estimated Time**: 4-5 hours

1. **Auto-save functionality**:
   - Debounced saving (2-second delay after typing stops)
   - Visual indicator when saving/saved
   - Handle network failures gracefully
   - Queue saves for retry when offline

2. **Offline support**:
   - Cache challenge content for offline viewing
   - Store entries locally when offline
   - Sync when connection returns
   - "Offline mode" indicator

3. **Error handling**:
   - Network failure recovery
   - Conflict resolution for concurrent edits
   - User-friendly error messages
   - Retry mechanisms

### Step 10: Add Progress Tracking and Motivation
**Dependencies**: Entry system
**Estimated Time**: 3-4 hours

1. **Streak calculation**:
   - Track consecutive days completed
   - Handle timezone changes properly
   - Account for "offline completed" days
   - Calculate longest streak achieved

2. **Motivational features**:
   - Streak celebrations (7, 14, 30, 50, 75, 100 days)
   - Progress milestones
   - Encouraging messages for missed days
   - Weekly achievement summaries

3. **Calendar integration**:
   - Visual progress overview
   - Quick navigation to any day
   - Status indicators for each day
   - Monthly statistics

## Navigation and Integration

### Step 11: Integrate with Existing Dashboard
**Dependencies**: All challenge screens
**Estimated Time**: 3-4 hours

1. **Update dashboard navigation**:
   - Add "Gratitude Challenge" section to top navigation
   - Update sidebar with challenge-related links
   - Add challenge status to dashboard home

2. **Update routing**:
   - `/dashboard/gratitude/today` - Today's challenge
   - `/dashboard/gratitude/calendar` - Calendar view
   - `/dashboard/gratitude/start` - Start new challenge
   - `/dashboard/gratitude/review` - Weekly review (when applicable)

3. **Dashboard home integration**:
   - Show current challenge status
   - Display streak and progress
   - Quick link to today's entry
   - Challenge completion celebration

### Step 12: Onboarding Integration
**Dependencies**: Dashboard integration
**Estimated Time**: 2-3 hours

1. **Update user onboarding**:
   - After profile setup, offer to start gratitude challenge
   - Schedule preference selection (morning/both)
   - Brief explanation of challenge format
   - First day preview

2. **Challenge-specific onboarding**:
   - Introduction to daily format
   - Explanation of weekly reviews
   - Auto-save and offline features
   - How to mark days as "done offline"

## Testing and Polish

### Step 13: Comprehensive Testing
**Dependencies**: Complete feature implementation
**Estimated Time**: 5-6 hours

1. **Unit tests**:
   - Date calculations for current day
   - Streak calculation logic
   - Data validation functions
   - Auto-save debouncing

2. **Integration tests**:
   - Database operations
   - API endpoint functionality
   - Auth integration
   - Real-time updates

3. **User experience testing**:
   - Complete day 1 flow
   - Weekly review experience
   - Calendar navigation
   - Offline → online sync
   - Mobile responsiveness

### Step 14: Performance Optimization and Launch Prep
**Dependencies**: Testing complete
**Estimated Time**: 3-4 hours

1. **Performance optimization**:
   - Optimize database queries
   - Implement caching where appropriate
   - Minimize bundle size
   - Test with large amounts of entry data

2. **Accessibility verification**:
   - Screen reader compatibility
   - Keyboard navigation
   - Color contrast compliance
   - Touch target sizing

3. **Launch preparation**:
   - Production environment testing
   - Backup procedures
   - Monitoring setup
   - User documentation

## Implementation Sequence Summary

1. **Week 1**: Database schema, data import, API services (Steps 3-6)
2. **Week 2**: Core UI components and challenge screens (Steps 7-8)  
3. **Week 3**: Auto-save, offline support, progress tracking (Steps 9-10)
4. **Week 4**: Navigation integration, onboarding, testing (Steps 11-14)

## Success Metrics

- **Technical**: All 100 days of content properly imported and accessible
- **User Experience**: <2 second load time, seamless auto-save
- **Engagement**: Users can complete day 1 in <3 minutes
- **Reliability**: Offline functionality works without data loss
- **Quality**: All scripture references and prompts display correctly

## Risk Mitigation

- **Data Import Issues**: Validate CSV export thoroughly before import
- **Auto-save Conflicts**: Implement last-write-wins with user notification
- **Offline Sync Problems**: Comprehensive local storage backup and conflict resolution
- **Performance Issues**: Implement pagination for calendar views and optimize queries
- **User Adoption**: Beautiful, intuitive UI with clear value proposition from day 1