'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarView } from '@/components/challenge/calendar-view';
import { getCurrentChallenge } from '@/lib/services/challenges';
import { getCalendarData } from '@/lib/services/progress';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Play } from 'lucide-react';
import type { CalendarData, CalendarDay } from '@/lib/services/progress';
import type { Database } from '@/lib/types/database';

type UserChallenge = Database['public']['Tables']['user_challenges']['Row'] & {
  challenge: Database['public']['Tables']['challenges']['Row'];
};

export default function CalendarPage() {
  const router = useRouter();
  const [, setUser] = useState<any>(null);
  const [userChallenge, setUserChallenge] = useState<UserChallenge | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [loading, setLoading] = useState(true);

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
      
      // Get current challenge
      const currentChallenge = await getCurrentChallenge(user.id);
      
      if (!currentChallenge) {
        router.push('/dashboard/gratitude');
        return;
      }
      
      setUserChallenge(currentChallenge);
      
      // Set initial month to current month or challenge start month
      const startDate = new Date(currentChallenge.start_date);
      const currentDate = new Date();
      const initialMonth = startDate > currentDate 
        ? startDate.toISOString().slice(0, 7)
        : currentDate.toISOString().slice(0, 7);
      
      setSelectedMonth(initialMonth);
      
      // Load calendar data
      await loadCalendarData(currentChallenge.id, initialMonth);
      
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCalendarData = async (userChallengeId: string, month: string) => {
    try {
      const data = await getCalendarData(userChallengeId, month);
      setCalendarData(data);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    }
  };

  const handleMonthChange = async (month: string) => {
    if (!userChallenge) return;
    
    setSelectedMonth(month);
    await loadCalendarData(userChallenge.id, month);
  };

  const handleDayClick = (day: CalendarDay) => {
    if (day.status === 'future') return;
    
    // For now, just navigate to today's page
    // TODO: Implement day-specific view
    if (day.status === 'today') {
      router.push('/dashboard/gratitude/today');
    } else {
      // TODO: Navigate to specific day view
      console.log('Navigate to day:', day.day_number);
    }
  };

  const handleBackToOverview = () => {
    router.push('/dashboard/gratitude');
  };

  const handleGoToToday = () => {
    router.push('/dashboard/gratitude/today');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading calendar...</div>
      </div>
    );
  }

  if (!calendarData || !userChallenge) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No calendar data available</p>
          <Button onClick={handleBackToOverview}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Overview
          </Button>
        </div>
      </div>
    );
  }

  const { calendar_data, stats } = calendarData;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBackToOverview}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold">Challenge Calendar</h1>
            <p className="text-muted-foreground">
              {userChallenge.challenge?.title || 'Gratitude Challenge'}
            </p>
          </div>
        </div>
        
        <Button onClick={handleGoToToday}>
          <Play className="h-4 w-4 mr-2" />
          Today&apos;s Challenge
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <CalendarView
            calendarData={calendar_data}
            currentMonth={selectedMonth}
            onDayClick={handleDayClick}
            onMonthChange={handleMonthChange}
          />
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Progress Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {stats.current_day}
                  </div>
                  <div className="text-xs text-muted-foreground">Current Day</div>
                </div>
                
                <div>
                  <div className="text-2xl font-bold text-green-500">
                    {stats.total_days_completed}
                  </div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                
                <div>
                  <div className="text-2xl font-bold text-orange-500">
                    {stats.current_streak}
                  </div>
                  <div className="text-xs text-muted-foreground">Streak</div>
                </div>
                
                <div>
                  <div className="text-2xl font-bold text-purple-500">
                    {Math.round(stats.completion_rate * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Rate</div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm mb-1">
                  <span>Journey Progress</span>
                  <span>{stats.current_day}/100 days</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${(stats.current_day / 100) * 100}%` }}
                  />
                </div>
              </div>
              
              {stats.days_remaining > 0 && (
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    {stats.days_remaining} days remaining
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    Keep up the great work!
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Streak Milestones */}
              {[7, 14, 21, 30].map(milestone => (
                <div 
                  key={milestone}
                  className={`flex items-center gap-3 p-2 rounded ${
                    stats.longest_streak >= milestone 
                      ? 'bg-green-50 dark:bg-green-950' 
                      : 'bg-gray-50 dark:bg-gray-950'
                  }`}
                >
                  <div className={`text-lg ${
                    stats.longest_streak >= milestone ? 'grayscale-0' : 'grayscale'
                  }`}>
                    🔥
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${
                      stats.longest_streak >= milestone 
                        ? 'text-green-800 dark:text-green-200' 
                        : 'text-muted-foreground'
                    }`}>
                      {milestone}-Day Streak
                    </div>
                  </div>
                  {stats.longest_streak >= milestone && (
                    <Badge variant="secondary" className="text-xs">
                      ✓
                    </Badge>
                  )}
                </div>
              ))}
              
              {/* Day Milestones */}
              {[25, 50, 75, 100].map(milestone => (
                <div 
                  key={milestone}
                  className={`flex items-center gap-3 p-2 rounded ${
                    stats.current_day >= milestone 
                      ? 'bg-blue-50 dark:bg-blue-950' 
                      : 'bg-gray-50 dark:bg-gray-950'
                  }`}
                >
                  <div className={`text-lg ${
                    stats.current_day >= milestone ? 'grayscale-0' : 'grayscale'
                  }`}>
                    {milestone === 100 ? '🏆' : '📅'}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${
                      stats.current_day >= milestone 
                        ? 'text-blue-800 dark:text-blue-200' 
                        : 'text-muted-foreground'
                    }`}>
                      {milestone} Days
                    </div>
                  </div>
                  {stats.current_day >= milestone && (
                    <Badge variant="secondary" className="text-xs">
                      ✓
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}