'use client';

import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Heart, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCurrentChallenge, calculateCurrentWeek } from '@/lib/services/challenges';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/contexts/user-context';
import type { Database } from '@/lib/types/database';

type WeeklyReview = Database['public']['Tables']['weekly_reviews']['Row'];
type UserChallenge = Database['public']['Tables']['user_challenges']['Row'] & {
  challenge: Database['public']['Tables']['challenges']['Row'];
};

export default function WeeklyReviewPage() {
  const [userChallenge, setUserChallenge] = useState<UserChallenge | null>(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [weeklyReview, setWeeklyReview] = useState<WeeklyReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useUser();

  // Form state
  const [formData, setFormData] = useState({
    challenges_completed_this_week: 0,
    key_learnings: '',
    biggest_challenge: '',
    gratitude_highlights: '',
    weekly_intentions: '',
    specific_goals: '',
    prayer_requests: '',
    celebrate_wins: '',
    encouragement_notes: '',
    overall_mood_rating: 5,
    spiritual_growth_rating: 5,
    consistency_rating: 5,
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, currentWeek]);

  const loadData = async () => {
    try {
      const challenge = await getCurrentChallenge(user!.id);
      if (!challenge) {
        window.location.href = '/dashboard/challenges';
        return;
      }

      setUserChallenge(challenge);
      
      const week = calculateCurrentWeek(challenge.start_date);
      setCurrentWeek(week);

      // Load existing review for this week
      await loadWeeklyReview(challenge.id, week);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyReview = async (userChallengeId: string, weekNumber: number) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('weekly_reviews')
        .select('*')
        .eq('user_challenge_id', userChallengeId)
        .eq('week_number', weekNumber)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading weekly review:', error);
        return;
      }

      if (data) {
        setWeeklyReview(data);
        setFormData({
          challenges_completed_this_week: data.challenges_completed_this_week,
          key_learnings: data.key_learnings || '',
          biggest_challenge: data.biggest_challenge || '',
          gratitude_highlights: data.gratitude_highlights || '',
          weekly_intentions: data.weekly_intentions || '',
          specific_goals: data.specific_goals || '',
          prayer_requests: data.prayer_requests || '',
          celebrate_wins: data.celebrate_wins || '',
          encouragement_notes: data.encouragement_notes || '',
          overall_mood_rating: data.overall_mood_rating || 5,
          spiritual_growth_rating: data.spiritual_growth_rating || 5,
          consistency_rating: data.consistency_rating || 5,
        });
      }
    } catch (error) {
      console.error('Error loading weekly review:', error);
    }
  };

  const handleSave = async () => {
    if (!userChallenge) return;

    setSaving(true);
    try {
      const supabase = createClient();
      
      const reviewData = {
        user_challenge_id: userChallenge.id,
        week_number: currentWeek,
        review_date: new Date().toISOString().split('T')[0],
        ...formData,
      };

      if (weeklyReview) {
        // Update existing review
        const { error } = await supabase
          .from('weekly_reviews')
          .update(reviewData)
          .eq('id', weeklyReview.id);

        if (error) throw error;
      } else {
        // Create new review
        const { error } = await supabase
          .from('weekly_reviews')
          .insert([reviewData]);

        if (error) throw error;
      }

      await loadWeeklyReview(userChallenge.id, currentWeek);
    } catch (error) {
      console.error('Error saving weekly review:', error);
      alert('Failed to save review. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentWeek > 1) {
      setCurrentWeek(currentWeek - 1);
    } else if (direction === 'next') {
      setCurrentWeek(currentWeek + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="text-center">Loading your weekly review...</div>
      </div>
    );
  }

  if (!userChallenge) {
    return (
      <div className="min-h-screen p-8">
        <div className="text-center">
          <p>No active challenge found.</p>
        </div>
      </div>
    );
  }

  const themeConfig = {
    gratitude: { color: 'emerald', icon: '🙏' },
    prayer: { color: 'blue', icon: '✨' },
    faith: { color: 'purple', icon: '⛪' },
    service: { color: 'orange', icon: '🤝' },
    worship: { color: 'pink', icon: '🎵' },
    scripture: { color: 'teal', icon: '📖' },
  };

  const theme = themeConfig[userChallenge.challenge.theme as keyof typeof themeConfig] || themeConfig.gratitude;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={() => navigateWeek('prev')}
              disabled={currentWeek <= 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <span className="text-3xl">{theme.icon}</span>
                Week {currentWeek} Review
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {userChallenge.challenge.title}
              </p>
            </div>

            <button
              onClick={() => navigateWeek('next')}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Review Form */}
        <div className="space-y-8">
          {/* Week Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              This Week's Progress
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Challenges Completed
                </label>
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={formData.challenges_completed_this_week}
                  onChange={(e) => setFormData({ ...formData, challenges_completed_this_week: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Overall Mood (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.overall_mood_rating}
                  onChange={(e) => setFormData({ ...formData, overall_mood_rating: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-center text-sm text-gray-600">{formData.overall_mood_rating}/10</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Spiritual Growth (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.spiritual_growth_rating}
                  onChange={(e) => setFormData({ ...formData, spiritual_growth_rating: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-center text-sm text-gray-600">{formData.spiritual_growth_rating}/10</div>
              </div>
            </div>
          </div>

          {/* Reflection Questions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Key Learnings
                </h3>
                <textarea
                  value={formData.key_learnings}
                  onChange={(e) => setFormData({ ...formData, key_learnings: e.target.value })}
                  placeholder="What did you learn about yourself or God this week?"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Biggest Challenge</h3>
                <textarea
                  value={formData.biggest_challenge}
                  onChange={(e) => setFormData({ ...formData, biggest_challenge: e.target.value })}
                  placeholder="What was most difficult this week?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Celebrate Wins</h3>
                <textarea
                  value={formData.celebrate_wins}
                  onChange={(e) => setFormData({ ...formData, celebrate_wins: e.target.value })}
                  placeholder="What victories, big or small, can you celebrate?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Weekly Intentions
                </h3>
                <textarea
                  value={formData.weekly_intentions}
                  onChange={(e) => setFormData({ ...formData, weekly_intentions: e.target.value })}
                  placeholder="What are your intentions for the coming week?"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Specific Goals</h3>
                <textarea
                  value={formData.specific_goals}
                  onChange={(e) => setFormData({ ...formData, specific_goals: e.target.value })}
                  placeholder="What specific goals will you focus on?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Prayer Requests</h3>
                <textarea
                  value={formData.prayer_requests}
                  onChange={(e) => setFormData({ ...formData, prayer_requests: e.target.value })}
                  placeholder="What would you like prayer for?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="text-center">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}