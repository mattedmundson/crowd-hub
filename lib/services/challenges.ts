import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/types/database';

type Challenge = Database['public']['Tables']['challenges']['Row'];
type UserChallenge = Database['public']['Tables']['user_challenges']['Row'];
type ChallengePrompt = Database['public']['Tables']['challenge_prompts']['Row'];

export interface TodaysContent {
  dayNumber: number;
  isReviewDay: boolean;
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
    total_days_completed: number;
  };
}

export interface StartChallengeParams {
  challengeId: string;
  scheduleType: 'morning' | 'both';
}

/**
 * Get all available challenges
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
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching current challenge:', error);
    throw new Error('Failed to fetch current challenge');
  }
  
  return data;
}

/**
 * Start a new challenge for the user
 */
export async function startChallenge({ challengeId, scheduleType }: StartChallengeParams, userId: string): Promise<UserChallenge> {
  const supabase = createClient();
  
  // Check if user already has an active challenge
  const existingChallenge = await getCurrentChallenge(userId);
  if (existingChallenge) {
    throw new Error('You already have an active challenge. Complete it before starting a new one.');
  }
  
  const { data, error } = await supabase
    .from('user_challenges')
    .insert({
      user_id: userId,
      challenge_id: challengeId,
      schedule_type: scheduleType,
      start_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      current_day: 1,
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
 * Calculate current day based on start date
 */
export function calculateCurrentDay(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Ensure day is between 1 and 100
  return Math.max(1, Math.min(100, diffDays));
}

/**
 * Get today's challenge content and user's entry
 */
export async function getTodaysContent(userChallengeId: string): Promise<TodaysContent> {
  const supabase = createClient();
  
  // Get user challenge details
  const { data: userChallenge, error: ucError } = await supabase
    .from('user_challenges')
    .select('*')
    .eq('id', userChallengeId)
    .single();
  
  if (ucError) {
    console.error('Error fetching user challenge:', ucError);
    throw new Error('Failed to fetch challenge details');
  }
  
  // Calculate current day
  const dayNumber = calculateCurrentDay(userChallenge.start_date);
  const isReviewDay = dayNumber % 7 === 0;
  
  // Get today's prompt
  const { data: prompt, error: promptError } = await supabase
    .from('challenge_prompts')
    .select('*')
    .eq('challenge_id', userChallenge.challenge_id)
    .eq('day_number', dayNumber)
    .maybeSingle();
  
  if (promptError) {
    console.error('Error fetching prompt:', promptError);
    throw new Error('Failed to fetch today\'s content');
  }
  
  // Get existing entry for today
  const { data: entry, error: entryError } = await supabase
    .from('challenge_entries')
    .select('god_message, morning_entry, evening_entry, completed_offline, review_notes')
    .eq('user_challenge_id', userChallengeId)
    .eq('day_number', dayNumber)
    .maybeSingle();
  
  if (entryError && entryError.code !== 'PGRST116') {
    console.error('Error fetching entry:', entryError);
    throw new Error('Failed to fetch existing entry');
  }
  
  // Calculate progress
  const progress = await calculateProgress(userChallengeId);
  
  // Update current day in user_challenges if it's changed
  if (dayNumber !== userChallenge.current_day) {
    await supabase
      .from('user_challenges')
      .update({ current_day: dayNumber })
      .eq('id', userChallengeId);
  }
  
  return {
    dayNumber,
    isReviewDay,
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
export async function calculateProgress(userChallengeId: string) {
  const supabase = createClient();
  
  // Get all entries for this challenge
  const { data: entries, error } = await supabase
    .from('challenge_entries')
    .select('day_number, created_at, morning_entry, evening_entry, completed_offline')
    .eq('user_challenge_id', userChallengeId)
    .order('day_number');
  
  if (error) {
    console.error('Error calculating progress:', error);
    return {
      current_streak: 0,
      longest_streak: 0,
      completion_rate: 0,
      total_days_completed: 0,
    };
  }
  
  const completedEntries = entries.filter(entry => 
    entry.morning_entry || entry.evening_entry || entry.completed_offline
  );
  
  const totalDaysCompleted = completedEntries.length;
  
  // Calculate streaks
  const { currentStreak, longestStreak } = calculateStreaks(completedEntries);
  
  // Get user challenge to determine total possible days
  const { data: userChallenge } = await supabase
    .from('user_challenges')
    .select('start_date')
    .eq('id', userChallengeId)
    .single();
  
  const possibleDays = userChallenge 
    ? calculateCurrentDay(userChallenge.start_date)
    : 1;
  
  const completionRate = possibleDays > 0 ? totalDaysCompleted / possibleDays : 0;
  
  // Update the user_challenges record with new streak info
  await supabase
    .from('user_challenges')
    .update({
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_entry_date: completedEntries.length > 0 
        ? completedEntries[completedEntries.length - 1].created_at.split('T')[0]
        : null,
    })
    .eq('id', userChallengeId);
  
  return {
    current_streak: currentStreak,
    longest_streak: longestStreak,
    completion_rate: completionRate,
    total_days_completed: totalDaysCompleted,
  };
}

/**
 * Calculate current and longest streaks from entries
 */
function calculateStreaks(entries: Array<{ day_number: number; created_at: string }>) {
  if (entries.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }
  
  // Sort by day number
  const sortedEntries = [...entries].sort((a, b) => a.day_number - b.day_number);
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;
  
  // Calculate longest streak
  for (let i = 1; i < sortedEntries.length; i++) {
    if (sortedEntries[i].day_number === sortedEntries[i - 1].day_number + 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);
  
  // Calculate current streak (from the end)
  currentStreak = 1;
  for (let i = sortedEntries.length - 2; i >= 0; i--) {
    if (sortedEntries[i + 1].day_number === sortedEntries[i].day_number + 1) {
      currentStreak++;
    } else {
      break;
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