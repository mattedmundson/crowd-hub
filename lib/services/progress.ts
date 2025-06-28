import { createClient } from '@/lib/supabase/client';
import { calculateCurrentDay } from './challenges';

export interface CalendarDay {
  date: string;
  day_number: number;
  status: 'completed' | 'missed' | 'today' | 'future';
  has_morning: boolean;
  has_evening: boolean;
  completed_offline: boolean;
}

export interface CalendarData {
  calendar_data: CalendarDay[];
  stats: {
    total_days_completed: number;
    current_streak: number;
    longest_streak: number;
    completion_rate: number;
    current_day: number;
    days_remaining: number;
  };
}

/**
 * Get calendar view data for a specific month
 */
export async function getCalendarData(
  userChallengeId: string,
  month?: string // Format: YYYY-MM
): Promise<CalendarData> {
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
  
  const startDate = new Date(userChallenge.start_date);
  const currentDay = calculateCurrentDay(userChallenge.start_date);
  
  // Determine month to show
  let targetMonth: Date;
  if (month) {
    targetMonth = new Date(month + '-01');
  } else {
    // Default to current month or challenge start month
    const today = new Date();
    targetMonth = currentDay <= 31 ? startDate : today;
  }
  
  // Get first and last day of the target month
  const firstDayOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
  const lastDayOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
  
  // Note: We could calculate day numbers for the month if needed for future features
  
  // Get all entries for this user challenge
  const { data: entries, error: entriesError } = await supabase
    .from('challenge_entries')
    .select('day_number, morning_entry, evening_entry, completed_offline')
    .eq('user_challenge_id', userChallengeId);
  
  if (entriesError) {
    console.error('Error fetching entries:', entriesError);
    throw new Error('Failed to fetch entries');
  }
  
  // Build calendar data
  const calendarData: CalendarDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    const currentDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), day);
    const dayNumber = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Skip days outside the challenge range (1-100)
    if (dayNumber < 1 || dayNumber > 100) {
      continue;
    }
    
    const entry = entries.find(e => e.day_number === dayNumber);
    const hasEntry = entry && (entry.morning_entry || entry.evening_entry || entry.completed_offline);
    
    let status: CalendarDay['status'];
    if (dayNumber > currentDay) {
      status = 'future';
    } else if (dayNumber === currentDay) {
      status = hasEntry ? 'completed' : 'today';
    } else {
      status = hasEntry ? 'completed' : 'missed';
    }
    
    calendarData.push({
      date: currentDate.toISOString().split('T')[0],
      day_number: dayNumber,
      status,
      has_morning: !!(entry?.morning_entry),
      has_evening: !!(entry?.evening_entry),
      completed_offline: !!(entry?.completed_offline),
    });
  }
  
  // Calculate statistics
  const completedEntries = entries.filter(entry =>
    entry.morning_entry || entry.evening_entry || entry.completed_offline
  );
  
  const stats = {
    total_days_completed: completedEntries.length,
    current_streak: userChallenge.current_streak,
    longest_streak: userChallenge.longest_streak,
    completion_rate: currentDay > 0 ? completedEntries.length / currentDay : 0,
    current_day: currentDay,
    days_remaining: Math.max(0, 100 - currentDay + 1),
  };
  
  return {
    calendar_data: calendarData,
    stats,
  };
}

/**
 * Get overall progress statistics
 */
export async function getProgressStats(userChallengeId: string) {
  const supabase = createClient();
  
  // Get user challenge
  const { data: userChallenge, error: ucError } = await supabase
    .from('user_challenges')
    .select('*')
    .eq('id', userChallengeId)
    .single();
  
  if (ucError) {
    console.error('Error fetching user challenge:', ucError);
    throw new Error('Failed to fetch challenge details');
  }
  
  // Get all entries
  const { data: entries, error: entriesError } = await supabase
    .from('challenge_entries')
    .select('day_number, morning_entry, evening_entry, completed_offline, created_at')
    .eq('user_challenge_id', userChallengeId)
    .order('day_number');
  
  if (entriesError) {
    console.error('Error fetching entries:', entriesError);
    throw new Error('Failed to fetch entries');
  }
  
  const currentDay = calculateCurrentDay(userChallenge.start_date);
  const completedEntries = entries.filter(entry =>
    entry.morning_entry || entry.evening_entry || entry.completed_offline
  );
  
  // Calculate weekly breakdown
  const weeklyStats = [];
  for (let week = 1; week <= Math.ceil(currentDay / 7); week++) {
    const weekStart = (week - 1) * 7 + 1;
    const weekEnd = Math.min(week * 7, currentDay);
    const weekEntries = completedEntries.filter(
      entry => entry.day_number >= weekStart && entry.day_number <= weekEnd
    );
    
    weeklyStats.push({
      week,
      days_completed: weekEntries.length,
      total_days: weekEnd - weekStart + 1,
      completion_rate: weekEntries.length / (weekEnd - weekStart + 1),
    });
  }
  
  // Calculate monthly breakdown
  const startDate = new Date(userChallenge.start_date);
  const monthlyStats = new Map();
  
  completedEntries.forEach(entry => {
    const entryDate = new Date(startDate);
    entryDate.setDate(startDate.getDate() + entry.day_number - 1);
    const monthKey = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyStats.has(monthKey)) {
      monthlyStats.set(monthKey, { month: monthKey, count: 0 });
    }
    monthlyStats.get(monthKey).count++;
  });
  
  return {
    overall: {
      total_days_completed: completedEntries.length,
      current_streak: userChallenge.current_streak,
      longest_streak: userChallenge.longest_streak,
      completion_rate: currentDay > 0 ? completedEntries.length / currentDay : 0,
      current_day: currentDay,
      days_remaining: Math.max(0, 100 - currentDay + 1),
      start_date: userChallenge.start_date,
      schedule_type: userChallenge.schedule_type,
    },
    weekly: weeklyStats,
    monthly: Array.from(monthlyStats.values()),
  };
}

/**
 * Get achievement badges/milestones
 */
export async function getAchievements(userChallengeId: string) {
  const supabase = createClient();
  
  const { data: userChallenge, error } = await supabase
    .from('user_challenges')
    .select('current_streak, longest_streak, start_date')
    .eq('id', userChallengeId)
    .single();
  
  if (error) {
    console.error('Error fetching achievements:', error);
    return [];
  }
  
  const currentDay = calculateCurrentDay(userChallenge.start_date);
  const { current_streak, longest_streak } = userChallenge;
  
  const achievements = [];
  
  // Day milestones
  const dayMilestones = [1, 7, 14, 21, 30, 50, 75, 100];
  dayMilestones.forEach(milestone => {
    if (currentDay >= milestone) {
      achievements.push({
        id: `day-${milestone}`,
        title: `${milestone} Day${milestone === 1 ? '' : 's'}`,
        description: milestone === 1 
          ? 'Welcome to your gratitude journey!' 
          : `Completed ${milestone} days of gratitude`,
        type: 'milestone',
        unlocked: true,
        icon: milestone === 100 ? '🏆' : '📅',
      });
    }
  });
  
  // Streak achievements
  const streakMilestones = [3, 7, 14, 21, 30];
  streakMilestones.forEach(milestone => {
    if (longest_streak >= milestone) {
      achievements.push({
        id: `streak-${milestone}`,
        title: `${milestone}-Day Streak`,
        description: `Maintained gratitude practice for ${milestone} consecutive days`,
        type: 'streak',
        unlocked: true,
        icon: '🔥',
      });
    }
  });
  
  // Special achievements
  if (current_streak >= 30) {
    achievements.push({
      id: 'consistency-master',
      title: 'Consistency Master',
      description: 'Current streak of 30+ days',
      type: 'special',
      unlocked: true,
      icon: '⭐',
    });
  }
  
  if (currentDay >= 100) {
    achievements.push({
      id: 'gratitude-graduate',
      title: 'Gratitude Graduate',
      description: 'Completed the 100-day gratitude challenge',
      type: 'completion',
      unlocked: true,
      icon: '🎓',
    });
  }
  
  return achievements.sort((a, b) => {
    // Sort by type priority, then by milestone value
    const typePriority = { completion: 0, special: 1, milestone: 2, streak: 3 };
    return typePriority[a.type] - typePriority[b.type];
  });
}