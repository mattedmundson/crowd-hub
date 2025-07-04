import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/types/database';

type ChallengeEntry = Database['public']['Tables']['challenge_entries']['Row'];

export interface SaveEntryParams {
  userChallengeId: string;
  challengeNumber: number;
  entryType: 'god_message' | 'morning' | 'evening';
  content: string;
  completedOffline?: boolean;
}

export interface MarkOfflineParams {
  userChallengeId: string;
  challengeNumber: number;
}

export interface WeeklyReviewEntry {
  challenge_number: number;
  date: string;
  morning_entry: string | null;
  evening_entry: string | null;
  review_notes: string | null;
  scripture_reference: string | null;
  morning_prompt: string | null;
}

/**
 * Save or update a challenge entry
 */
export async function saveEntry({
  userChallengeId,
  challengeNumber,
  entryType,
  content,
  completedOffline = false,
}: SaveEntryParams): Promise<ChallengeEntry> {
  const supabase = createClient();
  
  const fieldName = entryType === 'god_message' ? 'god_message' : `${entryType}_entry`;
  const updateData = {
    [fieldName]: content,
    completed_offline: completedOffline,
    updated_at: new Date().toISOString(),
  };
  
  // Try to update existing entry first
  const { data: existing, error: fetchError } = await supabase
    .from('challenge_entries')
    .select('id')
    .eq('user_challenge_id', userChallengeId)
    .eq('challenge_number', challengeNumber)
    .maybeSingle();
  
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error checking existing entry:', fetchError);
    throw new Error('Failed to check existing entry');
  }
  
  let data, error;
  
  if (existing) {
    // Update existing entry
    const result = await supabase
      .from('challenge_entries')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single();
    
    data = result.data;
    error = result.error;
  } else {
    // Create new entry
    const result = await supabase
      .from('challenge_entries')
      .insert({
        user_challenge_id: userChallengeId,
        challenge_number: challengeNumber,
        ...updateData,
      })
      .select()
      .single();
    
    data = result.data;
    error = result.error;
  }
  
  if (error) {
    console.error('Error saving entry:', error);
    throw new Error('Failed to save entry');
  }
  
  // Update user challenge progress after saving entry
  await updateChallengeProgress(userChallengeId);
  
  return data;
}

/**
 * Mark a day as completed offline (no text entry)
 */
export async function markOfflineComplete({
  userChallengeId,
  challengeNumber,
}: MarkOfflineParams): Promise<ChallengeEntry> {
  const supabase = createClient();
  
  // Check if entry already exists
  const { data: existing, error: fetchError } = await supabase
    .from('challenge_entries')
    .select('id')
    .eq('user_challenge_id', userChallengeId)
    .eq('challenge_number', challengeNumber)
    .maybeSingle();
  
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error checking existing entry:', fetchError);
    throw new Error('Failed to check existing entry');
  }
  
  const updateData = {
    completed_offline: true,
    updated_at: new Date().toISOString(),
  };
  
  let data, error;
  
  if (existing) {
    // Update existing entry
    const result = await supabase
      .from('challenge_entries')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single();
    
    data = result.data;
    error = result.error;
  } else {
    // Create new entry
    const result = await supabase
      .from('challenge_entries')
      .insert({
        user_challenge_id: userChallengeId,
        challenge_number: challengeNumber,
        ...updateData,
      })
      .select()
      .single();
    
    data = result.data;
    error = result.error;
  }
  
  if (error) {
    console.error('Error marking offline complete:', error);
    throw new Error('Failed to mark as completed offline');
  }
  
  // Update user challenge progress
  await updateChallengeProgress(userChallengeId);
  
  return data;
}

/**
 * Get entries for weekly review
 */
export async function getWeeklyReview(
  userChallengeId: string,
  weekEndDay: number
): Promise<WeeklyReviewEntry[]> {
  const supabase = createClient();
  
  const startDay = weekEndDay - 6;
  
  // Get user challenge to find challenge_id
  const { data: userChallenge, error: ucError } = await supabase
    .from('user_challenges')
    .select('challenge_id, start_date')
    .eq('id', userChallengeId)
    .single();
  
  if (ucError) {
    console.error('Error fetching user challenge:', ucError);
    throw new Error('Failed to fetch challenge details');
  }
  
  // Get entries for the week
  const { data: entries, error: entriesError } = await supabase
    .from('challenge_entries')
    .select('*')
    .eq('user_challenge_id', userChallengeId)
    .gte('day_number', startDay)
    .lt('day_number', weekEndDay)
    .order('day_number');
  
  if (entriesError) {
    console.error('Error fetching weekly entries:', entriesError);
    throw new Error('Failed to fetch weekly entries');
  }
  
  // Get prompts for the week to show context
  const { data: prompts, error: promptsError } = await supabase
    .from('challenge_prompts')
    .select('day_number, scripture_reference, morning_prompt')
    .eq('challenge_id', userChallenge.challenge_id)
    .gte('day_number', startDay)
    .lt('day_number', weekEndDay)
    .order('day_number');
  
  if (promptsError) {
    console.error('Error fetching weekly prompts:', promptsError);
    throw new Error('Failed to fetch weekly prompts');
  }
  
  // Combine entries with prompts and calculate dates
  const weeklyEntries: WeeklyReviewEntry[] = [];
  
  for (let day = startDay; day < weekEndDay; day++) {
    const entry = entries.find(e => e.day_number === day);
    const prompt = prompts.find(p => p.day_number === day);
    
    // Calculate the actual date for this day
    const startDate = new Date(userChallenge.start_date);
    const entryDate = new Date(startDate);
    entryDate.setDate(startDate.getDate() + day - 1);
    
    weeklyEntries.push({
      day_number: day,
      date: entryDate.toISOString().split('T')[0],
      morning_entry: entry?.morning_entry || null,
      evening_entry: entry?.evening_entry || null,
      review_notes: entry?.review_notes || null,
      scripture_reference: prompt?.scripture_reference || null,
      morning_prompt: prompt?.morning_prompt || null,
    });
  }
  
  return weeklyEntries;
}

/**
 * Add review notes to a specific entry
 */
export async function addReviewNotes(
  userChallengeId: string,
  challengeNumber: number,
  reviewNotes: string
): Promise<ChallengeEntry> {
  const supabase = createClient();
  
  // Check if entry exists
  const { data: existing, error: fetchError } = await supabase
    .from('challenge_entries')
    .select('id')
    .eq('user_challenge_id', userChallengeId)
    .eq('challenge_number', challengeNumber)
    .maybeSingle();
  
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error checking existing entry:', fetchError);
    throw new Error('Failed to check existing entry');
  }
  
  const updateData = {
    review_notes: reviewNotes,
    updated_at: new Date().toISOString(),
  };
  
  let data, error;
  
  if (existing) {
    // Update existing entry
    const result = await supabase
      .from('challenge_entries')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single();
    
    data = result.data;
    error = result.error;
  } else {
    // Create new entry with just review notes
    const result = await supabase
      .from('challenge_entries')
      .insert({
        user_challenge_id: userChallengeId,
        challenge_number: challengeNumber,
        ...updateData,
      })
      .select()
      .single();
    
    data = result.data;
    error = result.error;
  }
  
  if (error) {
    console.error('Error adding review notes:', error);
    throw new Error('Failed to add review notes');
  }
  
  return data;
}

/**
 * Get a specific entry by day number
 */
export async function getEntry(
  userChallengeId: string,
  challengeNumber: number
): Promise<ChallengeEntry | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('challenge_entries')
    .select('*')
    .eq('user_challenge_id', userChallengeId)
    .eq('challenge_number', challengeNumber)
    .maybeSingle();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching entry:', error);
    throw new Error('Failed to fetch entry');
  }
  
  return data;
}

/**
 * Update challenge progress after entry changes
 */
async function updateChallengeProgress(userChallengeId: string): Promise<void> {
  // Progress calculation is now handled in challenges.ts calculateProgress function
  // No need for RPC function that's causing 400 errors
  return;
}