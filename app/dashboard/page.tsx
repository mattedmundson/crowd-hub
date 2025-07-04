'use client';

import { useEffect, useState } from 'react';
import { HundredDayGrid } from '@/components/challenge/hundred-day-grid';
import { getCurrentChallenge, getTodaysContent } from '@/lib/services/challenges';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/types/database';

type UserChallenge = Database['public']['Tables']['user_challenges']['Row'] & {
  challenge: Database['public']['Tables']['challenges']['Row'];
};

export default function DashboardPage() {
  const [userChallenge, setUserChallenge] = useState<UserChallenge | null>(null);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [currentDay, setCurrentDay] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallengeData();
  }, []);

  const loadChallengeData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get current challenge
      const challenge = await getCurrentChallenge(user.id);
      setUserChallenge(challenge);
      
      if (challenge) {
        // Get today's content to determine current challenge
        const todaysContent = await getTodaysContent(challenge.id);
        if (todaysContent) {
          setCurrentDay(todaysContent.challengeNumber);
        }

        // Get completed challenges
        const { data: entries, error } = await supabase
          .from('challenge_entries')
          .select('challenge_number, morning_entry, evening_entry, god_message, completed_offline')
          .eq('user_challenge_id', challenge.id)
          .order('challenge_number');

        if (error) {
          console.error('Error loading completed challenges:', error);
        } else if (entries) {
          // A challenge is considered completed if it has any content or is marked as completed offline
          const completed = entries
            .filter(entry => 
              entry.morning_entry?.trim() || 
              entry.evening_entry?.trim() || 
              entry.god_message?.trim() || 
              entry.completed_offline
            )
            .map(entry => entry.challenge_number);
          
          setCompletedDays(completed);
        }
      }
    } catch (error) {
      console.error('Error loading challenge data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
        My Dashboard
      </h1>
      
      {loading ? (
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      ) : userChallenge ? (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              {userChallenge.challenge?.title || 'Gratitude Challenge'} Progress
            </h2>
            <HundredDayGrid 
              completedChallenges={completedDays} 
              currentChallenge={currentDay}
              totalChallenges={userChallenge.challenge?.total_challenges || 100}
              size="medium"
            />
          </div>
        </div>
      ) : (
        <div className="text-gray-600 dark:text-gray-400">
          No active challenge. Start a challenge to see your progress here.
        </div>
      )}
    </div>
  );
} 