import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/types/database';

type Challenge = Database['public']['Tables']['challenges']['Row'];
type UserChallenge = Database['public']['Tables']['user_challenges']['Row'];
type ChallengePrompt = Database['public']['Tables']['challenge_prompts']['Row'];

export interface TodaysContent {
  challengeNumber: number;
  isReviewDay: boolean;
  weekNumber: number;
  prompt: ChallengePrompt | null;
  entry: {
    god_message: string | null;
    morning_entry: string | null;
    evening_entry: string | null;
    completed_offline: boolean;
    review_notes: string | null;
  } | null;
  progress: {
    current_streak: number;
    longest_streak: number;
    completion_rate: number;
    total_challenges_completed: number;
    current_challenge_number: number;
    total_challenges_in_theme: number;
  };
}

export interface StartChallengeParams {
  challengeId: string;
  scheduleType: 'morning' | 'both';
}

/**
 * Get all available challenges (active only for regular users)
 */
export async function getChallenges(): Promise<Challenge[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching challenges:', error);
    throw new Error('Failed to fetch challenges');
  }

  return data || [];
}

/**
 * Get all challenges for admin (includes inactive)
 */
export async function getAllChallenges(): Promise<Challenge[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching all challenges:', error);
    throw new Error('Failed to fetch all challenges');
  }
  
  return data || [];
}

/**
 * Get user's active challenge
 */
export async function getCurrentChallenge(userId: string): Promise<UserChallenge | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('user_challenges')
    .select(`
      *,
      challenge:challenges(*)
    `)
    .eq('user_id', userId)
    .eq('completed', false)
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching current challenge:', error);
    throw new Error('Failed to fetch current challenge');
  }
  
  return data;
}

/**
 * Get all active challenges for user
 */
export async function getAllActiveChallenges(userId: string): Promise<UserChallenge[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('user_challenges')
    .select(`
      *,
      challenge:challenges(*)
    `)
    .eq('user_id', userId)
    .eq('completed', false)
    .order('start_date', { ascending: false });
  
  if (error) {
    console.error('Error fetching active challenges:', error);
    throw new Error('Failed to fetch active challenges');
  }
  
  return data || [];
}

/**
 * Start a new challenge for the user
 */
export async function startChallenge({ challengeId, scheduleType }: StartChallengeParams, userId: string): Promise<UserChallenge> {
  const supabase = createClient();
  
  // Check if user already has this specific challenge active
  const { data: existingChallengeData } = await supabase
    .from('user_challenges')
    .select('id')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .eq('completed', false)
    .maybeSingle();
  
  if (existingChallengeData) {
    throw new Error('You already have this challenge active.');
  }
  
  const { data, error } = await supabase
    .from('user_challenges')
    .insert({
      user_id: userId,
      challenge_id: challengeId,
      schedule_type: scheduleType,
      start_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      current_challenge_number: 1,
      total_completed: 0,
      weekly_review_day: 0, // Default to Sunday
      weekly_goal: 5, // Default Mon-Fri schedule
      current_streak: 0,
      longest_streak: 0,
    })
    .select(`
      *,
      challenge:challenges(*)
    `)
    .single();
  
  if (error) {
    console.error('Error starting challenge:', error);
    throw new Error('Failed to start challenge');
  }
  
  return data;
}

/**
 * Calculate current week number based on start date and weekly schedule
 */
export function calculateCurrentWeek(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Each week is 7 days, starting from week 1
  return Math.max(1, Math.ceil(diffDays / 7));
}

/**
 * Check if today is a review day based on weekly schedule
 */
export function isReviewDay(startDate: string, reviewDayOfWeek: number = 0): boolean {
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  return currentDayOfWeek === reviewDayOfWeek;
}

/**
 * Get current challenge content and user's entry
 */
export async function getTodaysContent(userChallengeId: string): Promise<TodaysContent> {
  const supabase = createClient();
  
  // Get user challenge details with challenge info
  const { data: userChallenge, error: ucError } = await supabase
    .from('user_challenges')
    .select(`
      *,
      challenge:challenges(*)
    `)
    .eq('id', userChallengeId)
    .single();
  
  if (ucError) {
    console.error('Error fetching user challenge:', ucError);
    throw new Error('Failed to fetch challenge details');
  }
  
  const challengeData = userChallenge.challenge as Challenge;
  const weekNumber = calculateCurrentWeek(userChallenge.start_date);
  const todayIsReviewDay = isReviewDay(userChallenge.start_date, userChallenge.weekly_review_day);
  
  // Determine the current challenge number
  const challengeNumber = userChallenge.current_challenge_number;
  
  // Get challenge prompt (only if not a review day)
  let prompt = null;
  if (!todayIsReviewDay && challengeNumber <= challengeData.total_challenges) {
    const { data: promptData, error: promptError } = await supabase
      .from('challenge_prompts')
      .select('*')
      .eq('challenge_id', userChallenge.challenge_id)
      .eq('challenge_number', challengeNumber)
      .maybeSingle();
    
    if (promptError) {
      console.error('Error fetching prompt:', promptError);
      // Don't throw error, just log it - we can still show progress
    } else {
      prompt = promptData;
    }
  }
  
  // Get existing entry for current challenge
  let entry = null;
  if (!todayIsReviewDay && challengeNumber <= challengeData.total_challenges) {
    const { data: entryData, error: entryError } = await supabase
      .from('challenge_entries')
      .select('god_message, morning_entry, evening_entry, completed_offline, review_notes')
      .eq('user_challenge_id', userChallengeId)
      .eq('challenge_number', challengeNumber)
      .maybeSingle();
    
    if (entryError && entryError.code !== 'PGRST116') {
      console.error('Error fetching entry:', entryError);
      // Don't throw error, just log it
    } else {
      entry = entryData;
    }
  }
  
  // Calculate progress
  const progress = await calculateProgress(userChallengeId, challengeData);
  
  return {
    challengeNumber,
    isReviewDay: todayIsReviewDay,
    weekNumber,
    prompt,
    entry: entry || {
      god_message: null,
      morning_entry: null,
      evening_entry: null,
      completed_offline: false,
      review_notes: null,
    },
    progress,
  };
}

/**
 * Calculate user's progress statistics
 */
export async function calculateProgress(userChallengeId: string, challengeData: Challenge) {
  const supabase = createClient();
  
  // Get all entries for this challenge
  const { data: entries, error } = await supabase
    .from('challenge_entries')
    .select('challenge_number, created_at, morning_entry, evening_entry, god_message, completed_offline')
    .eq('user_challenge_id', userChallengeId)
    .order('challenge_number');
  
  if (error) {
    console.error('Error calculating progress:', error);
    return {
      current_streak: 0,
      longest_streak: 0,
      completion_rate: 0,
      total_challenges_completed: 0,
      current_challenge_number: 1,
      total_challenges_in_theme: challengeData.total_challenges,
    };
  }
  
  // A challenge is considered completed if it has any content
  const completedEntries = entries.filter(entry => 
    entry.morning_entry?.trim() || 
    entry.evening_entry?.trim() || 
    entry.god_message?.trim() || 
    entry.completed_offline
  );
  
  const totalChallengesCompleted = completedEntries.length;
  
  // Calculate streaks based on consecutive challenge completion
  const { currentStreak, longestStreak } = calculateStreaks(completedEntries);
  
  // Calculate completion rate based on total challenges in the theme
  const completionRate = challengeData.total_challenges > 0 
    ? totalChallengesCompleted / challengeData.total_challenges 
    : 0;
  
  // Determine next challenge number
  const nextChallengeNumber = Math.min(
    totalChallengesCompleted + 1, 
    challengeData.total_challenges
  );
  
  // Update the user_challenges record with new progress info
  await supabase
    .from('user_challenges')
    .update({
      current_challenge_number: nextChallengeNumber,
      total_completed: totalChallengesCompleted,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_challenge_date: completedEntries.length > 0 
        ? completedEntries[completedEntries.length - 1].created_at.split('T')[0]
        : null,
      completed: totalChallengesCompleted >= challengeData.total_challenges,
    })
    .eq('id', userChallengeId);
  
  return {
    current_streak: currentStreak,
    longest_streak: longestStreak,
    completion_rate: completionRate,
    total_challenges_completed: totalChallengesCompleted,
    current_challenge_number: nextChallengeNumber,
    total_challenges_in_theme: challengeData.total_challenges,
  };
}

/**
 * Calculate current and longest streaks from entries
 */
function calculateStreaks(entries: Array<{ challenge_number: number; created_at: string }>) {
  if (entries.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }
  
  // Sort by challenge number
  const sortedEntries = [...entries].sort((a, b) => a.challenge_number - b.challenge_number);
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;
  
  // Calculate longest streak
  for (let i = 1; i < sortedEntries.length; i++) {
    if (sortedEntries[i].challenge_number === sortedEntries[i - 1].challenge_number + 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);
  
  // Calculate current streak (from the end)
  if (sortedEntries.length > 0) {
    currentStreak = 1;
    for (let i = sortedEntries.length - 2; i >= 0; i--) {
      if (sortedEntries[i + 1].challenge_number === sortedEntries[i].challenge_number + 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }
  
  return { currentStreak, longestStreak };
}

/**
 * Get the gratitude challenge (most common use case)
 */
export async function getGratitudeChallenge(): Promise<Challenge | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('title', '100 Days of Gratitude')
    .eq('is_active', true)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching gratitude challenge:', error);
    return null;
  }
  
  return data;
}