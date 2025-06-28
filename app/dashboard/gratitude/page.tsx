'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChallengeCard } from '@/components/challenge/challenge-card';
import { StreakCounter } from '@/components/challenge/streak-counter';
import { ProgressBar } from '@/components/challenge/progress-bar';
import { getChallenges, getCurrentChallenge, startChallenge } from '@/lib/services/challenges';
import { createClient } from '@/lib/supabase/client';
import { CalendarDays, Play, BookOpen } from 'lucide-react';
import type { Database } from '@/lib/types/database';

type Challenge = Database['public']['Tables']['challenges']['Row'];
type UserChallenge = Database['public']['Tables']['user_challenges']['Row'] & {
  challenge: Challenge;
};

export default function GratitudePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState<UserChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }
      
      setUser(user);
      
      // Load challenges and current challenge in parallel
      const [challengesData, currentChallengeData] = await Promise.all([
        getChallenges(),
        getCurrentChallenge(user.id)
      ]);
      
      setChallenges(challengesData);
      setCurrentChallenge(currentChallengeData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChallenge = async (challengeId: string) => {
    if (!user) return;
    
    try {
      setStarting(true);
      
      // For now, default to morning-only schedule
      // TODO: Add schedule selection UI
      const userChallenge = await startChallenge({
        challengeId,
        scheduleType: 'morning'
      }, user.id);
      
      setCurrentChallenge(userChallenge);
      
      // Redirect to today's challenge
      router.push('/dashboard/gratitude/today');
    } catch (error) {
      console.error('Error starting challenge:', error);
      alert('Failed to start challenge. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  const handleContinueChallenge = () => {
    router.push('/dashboard/gratitude/today');
  };

  const handleViewCalendar = () => {
    router.push('/dashboard/gratitude/calendar');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gratitude Challenge</h1>
        <p className="text-muted-foreground">
          Transform your mindset through daily gratitude practice
        </p>
      </div>

      {currentChallenge ? (
        /* Active Challenge View */
        <div className="space-y-6">
          {/* Challenge Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {currentChallenge.challenge?.title || 'Active Challenge'}
                </CardTitle>
                <Badge>Active</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {currentChallenge.current_day}
                  </div>
                  <div className="text-sm text-muted-foreground">Current Day</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">
                    {currentChallenge.current_streak}
                  </div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {currentChallenge.longest_streak}
                  </div>
                  <div className="text-sm text-muted-foreground">Best Streak</div>
                </div>
              </div>
              
              <ProgressBar
                currentDay={currentChallenge.current_day}
                totalDays={currentChallenge.challenge?.total_days || 100}
                completedDays={currentChallenge.current_streak} // This will be updated with actual completion data
                className="mb-4"
              />
              
              <div className="flex gap-2">
                <Button onClick={handleContinueChallenge} className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  Continue Challenge
                </Button>
                
                <Button variant="outline" onClick={handleViewCalendar}>
                  <CalendarDays className="h-4 w-4 mr-2" />
                  View Calendar
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Stats */}
          <StreakCounter
            currentStreak={currentChallenge.current_streak}
            longestStreak={currentChallenge.longest_streak}
            totalDaysCompleted={currentChallenge.current_streak} // TODO: Get actual completion count
            currentDay={currentChallenge.current_day}
            completionRate={currentChallenge.current_streak / currentChallenge.current_day}
            variant="detailed"
          />
        </div>
      ) : (
        /* No Active Challenge - Show Available Challenges */
        <div className="space-y-6">
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Ready to start your gratitude journey?</h2>
            <p className="text-muted-foreground">
              Choose a challenge below to begin transforming your mindset through daily practice.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                title={challenge.title}
                description={challenge.description || ''}
                totalDays={challenge.total_days}
                category={challenge.category || 'spiritual'}
                onStart={() => handleStartChallenge(challenge.id)}
                isActive={challenge.is_active}
              />
            ))}
          </div>
          
          {challenges.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No challenges available at the moment. Please check back later.
              </p>
            </div>
          )}
        </div>
      )}
      
      {starting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="p-6 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Starting your gratitude journey...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}