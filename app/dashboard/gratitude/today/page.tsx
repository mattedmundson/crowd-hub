'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PromptDisplay } from '@/components/challenge/prompt-display';
import { EntryForm } from '@/components/challenge/entry-form';
import { GodMessageForm } from '@/components/challenge/god-message-form';
import { StreakCounter } from '@/components/challenge/streak-counter';
import { getTodaysContent, getCurrentChallenge } from '@/lib/services/challenges';
import { saveEntry, markOfflineComplete } from '@/lib/services/entries';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Calendar, RotateCcw, Edit2 } from 'lucide-react';
import { useUserRole } from '@/lib/hooks/useUserRole';
import type { TodaysContent } from '@/lib/services/challenges';
import type { Database } from '@/lib/types/database';

type UserChallenge = Database['public']['Tables']['user_challenges']['Row'] & {
  challenge: Database['public']['Tables']['challenges']['Row'];
};

export default function TodayPage() {
  const router = useRouter();
  const [, setUser] = useState<any>(null);
  const [userChallenge, setUserChallenge] = useState<UserChallenge | null>(null);
  const [todaysContent, setTodaysContent] = useState<TodaysContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const { role: userRole } = useUserRole();
  const canEdit = userRole === 'admin' || userRole === 'editor';

  useEffect(() => {
    loadData();
    
    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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
        // No active challenge, redirect to challenge selection
        router.push('/dashboard/gratitude');
        return;
      }
      
      setUserChallenge(currentChallenge);
      
      // Get today's content
      const content = await getTodaysContent(currentChallenge.id);
      setTodaysContent(content);
      
    } catch (error) {
      console.error('Error loading today\'s content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEntry = async (entryType: 'god_message' | 'morning' | 'evening', content: string) => {
    if (!userChallenge || !todaysContent) return;
    
    try {
      await saveEntry({
        userChallengeId: userChallenge.id,
        dayNumber: todaysContent.dayNumber,
        entryType,
        content,
      });
      
      // Refresh content to get updated progress
      const updatedContent = await getTodaysContent(userChallenge.id);
      setTodaysContent(updatedContent);
      
    } catch (error) {
      console.error('Error saving entry:', error);
      throw error; // Let the component handle the error display
    }
  };

  const handleMarkOffline = async () => {
    if (!userChallenge || !todaysContent) return;
    
    try {
      await markOfflineComplete({
        userChallengeId: userChallenge.id,
        dayNumber: todaysContent.dayNumber,
      });
      
      // Refresh content to get updated progress
      const updatedContent = await getTodaysContent(userChallenge.id);
      setTodaysContent(updatedContent);
      
    } catch (error) {
      console.error('Error marking offline complete:', error);
      throw error;
    }
  };

  const handleBackToOverview = () => {
    router.push('/dashboard/gratitude');
  };

  const handleViewCalendar = () => {
    router.push('/dashboard/gratitude/calendar');
  };

  const handleEdit = (type: string, dayNumber?: number) => {
    // Navigate to edit page with appropriate parameters
    const params = new URLSearchParams({
      type,
      ...(dayNumber && { day: dayNumber.toString() }),
      ...(userChallenge?.challenge_id && { challengeId: userChallenge.challenge_id })
    });
    router.push(`/dashboard/gratitude/edit?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading today&apos;s challenge...</div>
      </div>
    );
  }

  if (!todaysContent || !userChallenge) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No challenge data available</p>
          <Button onClick={handleBackToOverview}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Challenges
          </Button>
        </div>
      </div>
    );
  }

  const { dayNumber, isReviewDay, prompt, entry, progress } = todaysContent;
  const showEvening = true; // Always show evening reflection

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Edit Button (Top Right) */}
      {canEdit && (
        <button
          onClick={() => handleEdit('all', dayNumber)}
          className="fixed top-20 right-6 z-50 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          title="Edit content"
        >
          <Edit2 className="h-5 w-5" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBackToOverview}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold">
              Day {dayNumber} of 100
            </h1>
            <p className="text-muted-foreground">
              {userChallenge.challenge?.title || 'Gratitude Challenge'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleViewCalendar}>
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </Button>
          
          {isReviewDay && (
            <Badge variant="secondary">
              <RotateCcw className="h-3 w-3 mr-1" />
              Review Day
            </Badge>
          )}
        </div>
      </div>

      {/* Progress Stats */}
      <div className="mb-6">
        <StreakCounter
          currentStreak={progress.current_streak}
          longestStreak={progress.longest_streak}
          totalDaysCompleted={progress.total_days_completed}
          currentDay={dayNumber}
          completionRate={progress.completion_rate}
          variant="compact"
        />
      </div>

      {/* Today's Content */}
      <div className="space-y-6">
        {/* Prompt Display */}
        {prompt && (
          <PromptDisplay
            dayNumber={dayNumber}
            isReviewDay={isReviewDay}
            scriptureReference={prompt.scripture_reference}
            scriptureText={prompt.scripture_text}
            contextText={prompt.context_text}
            morningPrompt={prompt.morning_prompt}
            eveningReflection={prompt.evening_reflection}
            showEvening={showEvening}
          />
        )}

        {/* God's Message */}
        {prompt && !isReviewDay && (
          <GodMessageForm
            dayNumber={dayNumber}
            initialValue={entry?.god_message || ''}
            onSave={(content) => handleSaveEntry('god_message', content)}
            isOnline={isOnline}
          />
        )}

        {/* Morning Entry */}
        <EntryForm
          dayNumber={dayNumber}
          entryType="morning"
          initialValue={entry?.morning_entry || ''}
          placeholder={isReviewDay 
            ? "Reflect on your week... What patterns do you notice in your gratitude journey?"
            : "What&apos;s on your heart today? Share your thoughts and gratitude..."
          }
          onSave={(content) => handleSaveEntry('morning', content)}
          onMarkOffline={handleMarkOffline}
          isOnline={isOnline}
        />

        {/* Evening Entry (if enabled) */}
        {showEvening && !isReviewDay && (
          <EntryForm
            dayNumber={dayNumber}
            entryType="evening"
            initialValue={entry?.evening_entry || ''}
            placeholder="As you reflect on your day, what are you grateful for?"
            onSave={(content) => handleSaveEntry('evening', content)}
            isOnline={isOnline}
          />
        )}

        {/* Completion Message */}
        {dayNumber >= 100 && (
          <div className="text-center p-8 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <h2 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
              🎉 Congratulations!
            </h2>
            <p className="text-green-600 dark:text-green-400">
              You&apos;ve completed the 100-day gratitude challenge! What an incredible journey of growth and reflection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}