'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { getCurrentChallenge } from '@/lib/services/challenges';
import { getWeeklyReview, addReviewNotes } from '@/lib/services/entries';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, MessageSquare, Calendar, CheckCircle } from 'lucide-react';
import type { WeeklyReviewEntry } from '@/lib/services/entries';
import type { Database } from '@/lib/types/database';

type UserChallenge = Database['public']['Tables']['user_challenges']['Row'] & {
  challenge: any;
};

export default function ReviewPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userChallenge, setUserChallenge] = useState<UserChallenge | null>(null);
  const [weeklyEntries, setWeeklyEntries] = useState<WeeklyReviewEntry[]>([]);
  const [reviewNotes, setReviewNotes] = useState<{ [dayNumber: number]: string }>({});
  const [saving, setSaving] = useState<{ [dayNumber: number]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [weekEndDay, setWeekEndDay] = useState(7);

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
      
      // Determine which week to review (current day rounded to nearest 7)
      const currentWeekEnd = Math.ceil(currentChallenge.current_day / 7) * 7;
      setWeekEndDay(currentWeekEnd);
      
      // Load weekly review data
      const entries = await getWeeklyReview(currentChallenge.id, currentWeekEnd);
      setWeeklyEntries(entries);
      
      // Initialize review notes state
      const initialNotes: { [dayNumber: number]: string } = {};
      entries.forEach(entry => {
        initialNotes[entry.day_number] = entry.review_notes || '';
      });
      setReviewNotes(initialNotes);
      
    } catch (error) {
      console.error('Error loading weekly review:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReviewNote = async (dayNumber: number, notes: string) => {
    if (!userChallenge) return;
    
    try {
      setSaving(prev => ({ ...prev, [dayNumber]: true }));
      
      await addReviewNotes(userChallenge.id, dayNumber, notes);
      
      // Update local state
      setReviewNotes(prev => ({ ...prev, [dayNumber]: notes }));
      
    } catch (error) {
      console.error('Error saving review note:', error);
    } finally {
      setSaving(prev => ({ ...prev, [dayNumber]: false }));
    }
  };

  const handleBackToToday = () => {
    router.push('/dashboard/gratitude/today');
  };

  const handleViewCalendar = () => {
    router.push('/dashboard/gratitude/calendar');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getCompletionStatus = (entry: WeeklyReviewEntry) => {
    if (entry.morning_entry || entry.evening_entry) {
      return 'completed';
    }
    return 'incomplete';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading weekly review...</div>
      </div>
    );
  }

  if (!userChallenge || weeklyEntries.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No review data available</p>
          <Button onClick={handleBackToToday}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Today
          </Button>
        </div>
      </div>
    );
  }

  const weekStart = weekEndDay - 6;
  const weekNumber = Math.ceil(weekEndDay / 7);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBackToToday}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold">
              Week {weekNumber} Review
            </h1>
            <p className="text-muted-foreground">
              Days {weekStart}-{weekEndDay - 1} • Reflect on your journey
            </p>
          </div>
        </div>
        
        <Button variant="outline" onClick={handleViewCalendar}>
          <Calendar className="h-4 w-4 mr-2" />
          View Calendar
        </Button>
      </div>

      {/* Review Instructions */}
      <Card className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="p-6">
          <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
            📝 Weekly Reflection
          </h3>
          <p className="text-amber-800 dark:text-amber-200 text-sm">
            Take time to review your entries from this week. Look for patterns, recurring themes, 
            and moments of growth. Add additional insights or reflections to any day below.
          </p>
        </CardContent>
      </Card>

      {/* Weekly Entries */}
      <div className="space-y-4">
        {weeklyEntries.map((entry) => (
          <Card key={entry.day_number}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">
                    Day {entry.day_number}
                  </CardTitle>
                  <Badge variant="outline">
                    {formatDate(entry.date)}
                  </Badge>
                  <Badge 
                    variant={getCompletionStatus(entry) === 'completed' ? 'default' : 'secondary'}
                  >
                    {getCompletionStatus(entry) === 'completed' ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </>
                    ) : (
                      'Incomplete'
                    )}
                  </Badge>
                </div>
              </div>
              
              {entry.scripture_reference && (
                <div className="text-sm text-muted-foreground">
                  📖 {entry.scripture_reference}
                </div>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Original Prompt */}
              {entry.morning_prompt && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Prompt:
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    {entry.morning_prompt}
                  </div>
                </div>
              )}
              
              {/* Morning Entry */}
              {entry.morning_entry && (
                <div>
                  <div className="text-sm font-medium mb-2 flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    Morning Reflection:
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                    <p className="text-sm whitespace-pre-wrap">{entry.morning_entry}</p>
                  </div>
                </div>
              )}
              
              {/* Evening Entry */}
              {entry.evening_entry && (
                <div>
                  <div className="text-sm font-medium mb-2 flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    Evening Reflection:
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                    <p className="text-sm whitespace-pre-wrap">{entry.evening_entry}</p>
                  </div>
                </div>
              )}
              
              {/* Review Notes Section */}
              <div>
                <div className="text-sm font-medium mb-2 flex items-center gap-1">
                  ✨ Additional Insights:
                </div>
                <Textarea
                  value={reviewNotes[entry.day_number] || ''}
                  onChange={(e) => setReviewNotes(prev => ({
                    ...prev,
                    [entry.day_number]: e.target.value
                  }))}
                  placeholder="Add any new insights, patterns you notice, or additional reflections..."
                  className="min-h-20"
                />
                <div className="flex justify-end mt-2">
                  <Button
                    size="sm"
                    onClick={() => handleSaveReviewNote(entry.day_number, reviewNotes[entry.day_number] || '')}
                    disabled={saving[entry.day_number]}
                  >
                    {saving[entry.day_number] ? 'Saving...' : 'Save Note'}
                  </Button>
                </div>
              </div>
              
              {!entry.morning_entry && !entry.evening_entry && (
                <div className="text-center py-4 text-muted-foreground">
                  No entries recorded for this day
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Week Summary */}
      <Card className="mt-6 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
        <CardContent className="p-6">
          <h3 className="font-semibold text-green-900 dark:text-green-100 mb-4">
            🌟 Week {weekNumber} Summary
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {weeklyEntries.filter(e => e.morning_entry || e.evening_entry).length}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Days Completed</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {weeklyEntries.filter(e => e.morning_entry).length}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Morning Entries</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {weeklyEntries.filter(e => e.evening_entry).length}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Evening Entries</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {weeklyEntries.filter(e => e.review_notes).length}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Review Notes</div>
            </div>
          </div>
          
          <div className="text-center">
            <Button onClick={handleBackToToday}>
              Continue Challenge
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}