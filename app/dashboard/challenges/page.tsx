'use client';

import { useState, useEffect } from 'react';
import { Clock, Users, CheckCircle, ArrowRight, Calendar, Target } from 'lucide-react';
import { getChallenges, getAllActiveChallenges, startChallenge } from '@/lib/services/challenges';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/contexts/user-context';
import type { Database } from '@/lib/types/database';

type Challenge = Database['public']['Tables']['challenges']['Row'];
type UserChallenge = Database['public']['Tables']['user_challenges']['Row'] & {
  challenge: Challenge;
};

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingChallenge, setStartingChallenge] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [challengesData, activeChallengesData] = await Promise.all([
        getChallenges(),
        getAllActiveChallenges(user!.id)
      ]);
      
      setChallenges(challengesData);
      setActiveChallenges(activeChallengesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChallenge = async (challengeId: string) => {
    if (!user) return;

    setStartingChallenge(challengeId);
    try {
      const challenge = challenges.find(c => c.id === challengeId);
      await startChallenge({ 
        challengeId, 
        scheduleType: 'both' // Default to both morning and evening
      }, user.id);
      
      // Redirect to the theme-specific journey page
      const theme = challenge?.theme || 'gratitude';
      window.location.href = `/dashboard/${theme}/journey`;
    } catch (error) {
      console.error('Error starting challenge:', error);
      alert('Failed to start challenge. Please try again.');
    } finally {
      setStartingChallenge(null);
    }
  };

  const getThemeColor = (theme: string) => {
    const colors = {
      gratitude: 'from-green-500 to-emerald-600',
      prayer: 'from-blue-500 to-indigo-600',
      faith: 'from-purple-500 to-violet-600',
      service: 'from-orange-500 to-amber-600',
      worship: 'from-pink-500 to-rose-600',
      scripture: 'from-teal-500 to-cyan-600',
    };
    return colors[theme as keyof typeof colors] || 'from-gray-500 to-slate-600';
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'gratitude': return '🙏';
      case 'prayer': return '✨';
      case 'faith': return '⛪';
      case 'service': return '🤝';
      case 'worship': return '🎵';
      case 'scripture': return '📖';
      default: return '✨';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="text-center">Loading challenges...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Challenge
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Discover meaningful spiritual practices designed to help you grow in faith, 
            gratitude, and connection with God. Each challenge offers a unique journey 
            tailored to your spiritual needs.
          </p>
        </div>

        {/* Active Challenges Alert */}
        {activeChallenges.length > 0 && (
          <div className="mb-8 space-y-4">
            {activeChallenges.map((activeChallenge) => (
              <div key={activeChallenge.id} className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{getThemeIcon(activeChallenge.challenge.theme)}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                        {activeChallenge.challenge.title}
                      </h3>
                      <p className="text-blue-700 dark:text-blue-300">
                        Day {activeChallenge.total_completed + 1} of {activeChallenge.challenge.total_challenges}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.location.href = `/dashboard/${activeChallenge.challenge.theme}/journey`}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Challenge Header - Dark Background */}
              <div className="bg-[#21252D] p-6 text-white">
                <h3 className="text-xl font-bold mb-2">{challenge.title}</h3>
                <p className="text-[#7DB9C5] text-sm">
                  {challenge.theme.charAt(0).toUpperCase() + challenge.theme.slice(1)} Journey
                </p>
              </div>

              {/* Challenge Content - Muted Background */}
              <div className="p-6 bg-gray-50 dark:bg-gray-800">
                {challenge.description && (
                  <p className="text-gray-900 dark:text-gray-300 mb-6 leading-relaxed">
                    {challenge.description}
                  </p>
                )}

                {/* Challenge Stats */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <Target className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-900 dark:text-gray-300">
                      {challenge.total_challenges} challenges total
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-900 dark:text-gray-300">
                      ~{Math.ceil(challenge.total_challenges / (challenge.weekly_schedule ? 5 : 7))} weeks
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-900 dark:text-gray-300">
                      10-15 minutes daily
                    </span>
                  </div>
                  {challenge.category && (
                    <div className="flex items-center gap-3 text-sm">
                      <Users className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-900 dark:text-gray-300">
                        {challenge.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  {(() => {
                    const isActive = activeChallenges.some(ac => ac.challenge_id === challenge.id);
                    
                    if (isActive) {
                      return (
                        <button
                          onClick={() => window.location.href = `/dashboard/${challenge.theme}/journey`}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#0498db] text-white rounded-full hover:bg-white hover:text-[#0498db] hover:border-[#0498db] border-2 border-[#0498db] transition-all duration-300"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Continue Challenge
                        </button>
                      );
                    } else {
                      return (
                        <button
                          onClick={() => handleStartChallenge(challenge.id)}
                          disabled={startingChallenge === challenge.id}
                          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full border-2 transition-all duration-300 ${
                            startingChallenge === challenge.id
                              ? 'bg-gray-400 text-white cursor-not-allowed border-gray-400'
                              : 'bg-[#0498db] text-white border-[#0498db] hover:bg-white hover:text-[#0498db] hover:border-[#0498db]'
                          }`}
                        >
                          {startingChallenge === challenge.id ? (
                            'Starting...'
                          ) : (
                            <>
                              Start Challenge
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {challenges.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              No Challenges Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Challenges are being prepared for you. Check back soon!
            </p>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-16 bg-gray-50 dark:bg-gray-800 rounded-xl p-8">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            How Challenges Work
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-3">📅</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Flexible Schedule
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Most challenges follow a Mon-Fri schedule with Sunday reviews. 
                Missed days don't break your progress.
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">🎯</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Complete All Challenges
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                The goal is to complete all challenges in the series, 
                not to maintain perfect daily streaks.
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">💭</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Reflect & Grow
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Each challenge includes scripture, reflection prompts, 
                and space for your personal insights.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}