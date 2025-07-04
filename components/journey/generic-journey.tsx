'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTodaysContent, getCurrentChallenge } from '@/lib/services/challenges';
import { saveEntry } from '@/lib/services/entries';
import { createClient } from '@/lib/supabase/client';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { Edit2, Info } from 'lucide-react';
import { HundredDayGrid } from '@/components/challenge/hundred-day-grid';
import { MinimalWriter } from '@/components/journey/minimal-writer';
import { OnboardingModal } from '@/components/journey/onboarding-modal';
import type { TodaysContent } from '@/lib/services/challenges';
import type { Database } from '@/lib/types/database';

type UserChallenge = Database['public']['Tables']['user_challenges']['Row'] & {
  challenge: Database['public']['Tables']['challenges']['Row'];
};

interface GenericJourneyProps {
  challengeTheme: string; // 'gratitude', 'prayer', 'faith', etc.
}

export function GenericJourney({ challengeTheme }: GenericJourneyProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userChallenge, setUserChallenge] = useState<UserChallenge | null>(null);
  const [todaysContent, setTodaysContent] = useState<TodaysContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [godMessage, setGodMessage] = useState('');
  const [morningEntry, setMorningEntry] = useState('');
  const [eveningEntry, setEveningEntry] = useState('');
  const [recapScrollProgress, setRecapScrollProgress] = useState(0);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [currentSection, setCurrentSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [stickyProgress, setStickyProgress] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);
  const { role: userRole } = useUserRole();
  const canEdit = userRole === 'admin' || userRole === 'editor';

  // Theme-specific configurations
  const getThemeConfig = (theme: string) => {
    const configs = {
      gratitude: {
        title: 'Gratitude',
        color: 'emerald',
        icon: '🙏',
        openingText: 'Close your eyes, take a deep breath and commit this time to the Lord',
        placeholder: "What's on your heart today? Share your thoughts and gratitude...",
        morningPromptPrefix: 'Morning Gratitude',
        eveningPromptPrefix: 'Evening Reflection',
        completionMessage: 'Your heart has been opened to gratitude today.',
      },
      prayer: {
        title: 'Prayer',
        color: 'blue',
        icon: '✨',
        openingText: 'Enter into this sacred space with reverence and open your heart to prayer',
        placeholder: "What prayers are stirring in your heart? Share your conversations with God...",
        morningPromptPrefix: 'Morning Prayer',
        eveningPromptPrefix: 'Evening Prayer',
        completionMessage: 'Your prayers have been lifted up today.',
      },
      faith: {
        title: 'Faith',
        color: 'purple',
        icon: '⛪',
        openingText: 'Step forward in faith, trusting in God\'s perfect plan for your life',
        placeholder: "How is God growing your faith? Share your spiritual insights...",
        morningPromptPrefix: 'Morning Faith',
        eveningPromptPrefix: 'Evening Faith',
        completionMessage: 'Your faith has been strengthened today.',
      },
      service: {
        title: 'Service',
        color: 'orange',
        icon: '🤝',
        openingText: 'Prepare your heart to serve others as Christ served us',
        placeholder: "How can you serve God and others today? Share your heart for service...",
        morningPromptPrefix: 'Morning Service',
        eveningPromptPrefix: 'Evening Service',
        completionMessage: 'You have answered the call to serve today.',
      },
      worship: {
        title: 'Worship',
        color: 'pink',
        icon: '🎵',
        openingText: 'Come before the Lord with joy and let your heart overflow with worship',
        placeholder: "How is your heart moved to worship? Share your praise and adoration...",
        morningPromptPrefix: 'Morning Worship',
        eveningPromptPrefix: 'Evening Worship',
        completionMessage: 'Your worship has been a sweet offering today.',
      },
      scripture: {
        title: 'Scripture',
        color: 'teal',
        icon: '📖',
        openingText: 'Open your heart to receive God\'s Word and let it transform your life',
        placeholder: "What is God speaking to you through His Word? Share your insights...",
        morningPromptPrefix: 'Morning Scripture',
        eveningPromptPrefix: 'Evening Scripture',
        completionMessage: 'God\'s Word has spoken to your heart today.',
      },
    };
    return configs[theme as keyof typeof configs] || configs.gratitude;
  };

  const themeConfig = getThemeConfig(challengeTheme);

  const scrollToSection = (sectionIndex: number) => {
    const section = sectionsRef.current[sectionIndex];
    if (section) {
      section.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('crowdhub-onboarding-seen', 'true');
    setShowOnboarding(false);
  };

  const showOnboardingInfo = () => {
    setShowOnboarding(true);
  };

  useEffect(() => {
    loadData();
    
    // Check if user has seen onboarding before
    const hasSeenOnboarding = localStorage.getItem('crowdhub-onboarding-seen');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  // Handle section navigation from URL parameters
  useEffect(() => {
    const sectionParam = searchParams?.get('section');
    if (sectionParam && !loading) {
      const sectionIndex = parseInt(sectionParam, 10);
      if (!isNaN(sectionIndex) && sectionIndex >= 0 && sectionIndex <= 12) {
        setTimeout(() => scrollToSection(sectionIndex), 500);
      }
    } else if (!loading) {
      // If no section param, scroll to top
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    }
  }, [searchParams, loading]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      
      setScrollY(currentScrollY);
      
      const sectionIndex = Math.floor(currentScrollY / viewportHeight);
      setCurrentSection(Math.min(sectionIndex, 12));
      
      // Scripture animation (Section 2) - starts when you scroll into scripture section
      const scriptureStart = viewportHeight * 1;
      const scriptureEnd = viewportHeight * 2;
      
      let newProgress = 0;
      if (currentScrollY < scriptureStart) {
        newProgress = 0;
      } else if (currentScrollY > scriptureEnd) {
        newProgress = 1;
      } else {
        newProgress = (currentScrollY - scriptureStart) / (scriptureEnd - scriptureStart);
        newProgress = Math.min(Math.max(newProgress, 0), 1);
      }
      
      setScrollProgress(newProgress);
      
      // Scripture recap animation (Section 9) - starts when you scroll into recap section
      const recapSectionStart = viewportHeight * 8;
      const recapAnimationEnd = viewportHeight * 9;
      
      let newRecapProgress = 0;
      if (currentScrollY < recapSectionStart) {
        newRecapProgress = 0;
      } else if (currentScrollY > recapAnimationEnd) {
        newRecapProgress = 1;
      } else {
        newRecapProgress = (currentScrollY - recapSectionStart) / (recapAnimationEnd - recapSectionStart);
        newRecapProgress = Math.min(Math.max(newRecapProgress, 0), 1);
      }
      
      setRecapScrollProgress(newRecapProgress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/dashboard/challenges');
        return;
      }

      const currentChallenge = await getCurrentChallenge(user.id);
      if (!currentChallenge) {
        router.push('/dashboard/challenges');
        return;
      }

      // Check if this challenge matches the expected theme
      if (currentChallenge.challenge.theme !== challengeTheme) {
        router.push('/dashboard/challenges');
        return;
      }

      setUserChallenge(currentChallenge);
      
      const content = await getTodaysContent(currentChallenge.id);
      setTodaysContent(content);
      setGodMessage(content.entry?.god_message || '');
      setMorningEntry(content.entry?.morning_entry || '');
      setEveningEntry(content.entry?.evening_entry || '');
      
      await loadCompletedDays(currentChallenge.id);
      
    } catch (error) {
      console.error('Error loading journey content:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedDays = async (userChallengeId: string) => {
    try {
      const supabase = createClient();
      
      const { data: entries, error } = await supabase
        .from('challenge_entries')
        .select('challenge_number, morning_entry, evening_entry, god_message, completed_offline')
        .eq('user_challenge_id', userChallengeId)
        .order('challenge_number');
      
      if (error) {
        console.error('Error loading completed challenges:', error);
        return;
      }
      
      const completed = entries
        .filter(entry => 
          entry.morning_entry?.trim() || 
          entry.evening_entry?.trim() || 
          entry.god_message?.trim() || 
          entry.completed_offline
        )
        .map(entry => entry.challenge_number);
      
      setCompletedDays(completed);
    } catch (error) {
      console.error('Error loading completed days:', error);
    }
  };

  const handleSaveGodMessage = async () => {
    if (!userChallenge || !todaysContent || !godMessage.trim()) return;
    
    await saveEntry({
      userChallengeId: userChallenge.id,
      challengeNumber: todaysContent.challengeNumber,
      entryType: 'god_message',
      content: godMessage,
    });
    
    if (userChallenge) {
      await loadCompletedDays(userChallenge.id);
    }
  };

  const handleSaveMorningEntry = async () => {
    if (!userChallenge || !todaysContent || !morningEntry.trim()) return;
    
    await saveEntry({
      userChallengeId: userChallenge.id,
      challengeNumber: todaysContent.challengeNumber,
      entryType: 'morning',
      content: morningEntry,
    });
    
    if (userChallenge) {
      await loadCompletedDays(userChallenge.id);
    }
  };

  const handleSaveEveningEntry = async () => {
    if (!userChallenge || !todaysContent || !eveningEntry.trim()) return;
    
    await saveEntry({
      userChallengeId: userChallenge.id,
      challengeNumber: todaysContent.challengeNumber,
      entryType: 'evening',
      content: eveningEntry,
    });
    
    if (userChallenge) {
      await loadCompletedDays(userChallenge.id);
    }
  };

  const handleEdit = (type: string, challengeNumber?: number) => {
    const params = new URLSearchParams({
      type,
      ...(challengeNumber && { challenge: challengeNumber.toString() }),
      ...(userChallenge?.challenge_id && { challengeId: userChallenge.challenge_id })
    });
    router.push(`/dashboard/admin/challenges/${userChallenge?.challenge_id}/edit?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Preparing your {themeConfig.title.toLowerCase()} journey...</div>
        </div>
      </div>
    );
  }

  if (!todaysContent || !userChallenge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No challenge data available</p>
        </div>
      </div>
    );
  }

  const { challengeNumber, prompt } = todaysContent;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  return (
    <div className="relative">
      {/* Info Button (Bottom Right) */}
      <button
        onClick={showOnboardingInfo}
        className="fixed bottom-6 right-6 z-50 p-3 bg-[#0498db] text-white rounded-full shadow-lg hover:bg-[#0498db]/90 transition-colors"
        title="How it works"
      >
        <Info className="h-5 w-5" />
      </button>

      {/* Edit Button (Top Right) */}
      {canEdit && (
        <button
          onClick={() => handleEdit('all', challengeNumber)}
          className="fixed top-20 right-6 z-50 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          title="Edit content"
        >
          <Edit2 className="h-5 w-5" />
        </button>
      )}

      {/* Section 1: Opening Prayer */}
      <section 
        ref={(el) => sectionsRef.current[0] = el}
        className="min-h-screen flex items-center justify-center px-6"
      >
        <div className="text-center max-w-2xl mx-auto space-y-8">
          <h1 className="text-4xl md:text-6xl font-light leading-tight text-foreground">
            Close your eyes, take a deep breath and commit this time to the Lord
          </h1>
        </div>
      </section>

      {/* Section 2: Scripture */}
      {prompt?.scripture_text && (
        <section 
          ref={(el) => sectionsRef.current[1] = el}
          className="min-h-screen flex items-center justify-center px-6"
        >
          <div className="text-center max-w-4xl mx-auto space-y-8">
            {canEdit && (
              <button
                onClick={() => handleEdit('scripture', todaysContent?.challengeNumber)}
                className="absolute top-4 right-4 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                title="Edit scripture"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
            
            <div className="text-2xl md:text-4xl font-light leading-relaxed text-foreground">
              {prompt.scripture_text.split(' ').map((word, index, words) => {
                const wordProgress = index / words.length;
                const shouldShow = scrollProgress >= wordProgress;
                
                return (
                  <span
                    key={index}
                    className={`inline-block transition-all duration-300 ${
                      shouldShow 
                        ? 'opacity-100 transform translate-y-0' 
                        : 'opacity-0 transform translate-y-4'
                    }`}
                    style={{
                      transitionDelay: shouldShow ? `${(index % 10) * 50}ms` : '0ms'
                    }}
                  >
                    {word}{index < words.length - 1 ? ' ' : ''}
                  </span>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Section 3: Context */}
      {prompt?.context_text && (
        <section 
          ref={(el) => sectionsRef.current[2] = el}
          className="min-h-screen flex items-center justify-center px-6"
        >
          <div className="text-center max-w-2xl mx-auto space-y-8">
            <div className="text-lg md:text-xl leading-relaxed text-foreground space-y-6">
              {prompt.context_text.split('\n').filter(p => p.trim()).map((paragraph, index) => (
                <p key={index} className="leading-relaxed" style={{ lineHeight: '1.8' }}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section 4: God's Message Form */}
      <section 
        ref={(el) => sectionsRef.current[3] = el}
        className="min-h-screen flex items-center justify-center px-6"
      >
        <div className="text-center max-w-2xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-4xl font-light text-foreground">
            What is God saying to you?
          </h2>
          
          <MinimalWriter
            value={godMessage}
            onChange={setGodMessage}
            onSave={handleSaveGodMessage}
            placeholder={themeConfig.placeholder}
            className="min-h-[200px]"
          />
        </div>
      </section>

      {/* Section 5: Morning Reflection Prompt */}
      {prompt?.morning_prompt && (
        <section 
          ref={(el) => sectionsRef.current[4] = el}
          className="min-h-screen flex items-center justify-center px-6"
        >
          <div className="text-center max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-light text-foreground">
              Morning Gratitude
            </h2>
            <div className="text-lg md:text-xl leading-relaxed text-muted-foreground">
              {prompt.morning_prompt.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section 6: Morning Entry Form */}
      <section 
        ref={(el) => sectionsRef.current[5] = el}
        className="min-h-screen flex items-center justify-center px-6"
      >
        <div className="w-full max-w-4xl mx-auto">
          <MinimalWriter
            value={morningEntry}
            onChange={setMorningEntry}
            onSave={handleSaveMorningEntry}
            placeholder="What are you grateful for this morning?"
            title="Morning Entry"
            className="min-h-[200px]"
          />
        </div>
      </section>

      {/* Section 7: Evening Reflection Prompt */}
      {prompt?.evening_prompt && (
        <section 
          ref={(el) => sectionsRef.current[6] = el}
          className="min-h-screen flex items-center justify-center px-6"
        >
          <div className="text-center max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-light text-foreground">
              Evening Reflection
            </h2>
            <div className="text-lg md:text-xl leading-relaxed text-muted-foreground">
              {prompt.evening_prompt.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section 8: Evening Entry Form */}
      <section 
        ref={(el) => sectionsRef.current[7] = el}
        className="min-h-screen flex items-center justify-center px-6"
      >
        <div className="w-full max-w-4xl mx-auto">
          <MinimalWriter
            value={eveningEntry}
            onChange={setEveningEntry}
            onSave={handleSaveEveningEntry}
            placeholder="What are you reflecting on this evening?"
            title="Evening Entry"
            className="min-h-[200px]"
          />
        </div>
      </section>

      {/* Section 9: Scripture Recap */}
      {prompt?.scripture_text && (
        <section 
          ref={(el) => sectionsRef.current[8] = el}
          className="min-h-screen flex items-center justify-center px-6"
        >
          <div className="text-center max-w-4xl mx-auto space-y-8">
            {prompt.scripture_reference && (
              <h2 className="text-xl md:text-2xl font-medium text-muted-foreground">
                {prompt.scripture_reference}
              </h2>
            )}
            
            <div className="text-2xl md:text-4xl font-light leading-relaxed text-foreground">
              {prompt.scripture_text.split(' ').map((word, index, words) => {
                const wordProgress = index / words.length;
                const shouldShow = recapScrollProgress >= wordProgress;
                
                return (
                  <span
                    key={index}
                    className={`inline-block transition-all duration-300 ${
                      shouldShow 
                        ? 'opacity-100 transform translate-y-0' 
                        : 'opacity-0 transform translate-y-4'
                    }`}
                    style={{
                      transitionDelay: shouldShow ? `${(index % 10) * 50}ms` : '0ms'
                    }}
                  >
                    {word}{index < words.length - 1 ? ' ' : ''}
                  </span>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Section 10: God's Message Review */}
      <section 
        ref={(el) => sectionsRef.current[9] = el}
        className="min-h-screen flex items-center justify-center px-6"
      >
        <div className="text-center max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-4xl font-light text-foreground">
            What God revealed to you
          </h2>
          {godMessage ? (
            <div className="text-lg md:text-xl leading-relaxed text-brand-500">
              {godMessage.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No reflection recorded yet.</p>
          )}
        </div>
      </section>

      {/* Section 11: Morning Review */}
      <section 
        ref={(el) => sectionsRef.current[10] = el}
        className="min-h-screen flex items-center justify-center px-6"
      >
        <div className="text-center max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-4xl font-light text-foreground">
            Your morning gratitude
          </h2>
          {morningEntry ? (
            <div className="text-lg md:text-xl leading-relaxed text-brand-500">
              {morningEntry.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No morning entry recorded yet.</p>
          )}
        </div>
      </section>

      {/* Section 12: Evening Review */}
      <section 
        ref={(el) => sectionsRef.current[11] = el}
        className="min-h-screen flex items-center justify-center px-6"
      >
        <div className="text-center max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-4xl font-light text-foreground">
            Your evening reflection
          </h2>
          {eveningEntry ? (
            <div className="text-lg md:text-xl leading-relaxed text-brand-500">
              {eveningEntry.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No evening entry recorded yet.</p>
          )}
        </div>
      </section>

      {/* Section 13: Completion */}
      <section 
        ref={(el) => sectionsRef.current[12] = el}
        className="min-h-screen flex items-center justify-center px-6"
      >
        <div className="text-center max-w-2xl mx-auto space-y-8">
          <h1 className="text-4xl md:text-6xl font-light leading-tight text-foreground">
            Day {(todaysContent?.progress?.total_challenges_completed || 0) + 1} Complete
          </h1>
          
          <div className="text-lg text-muted-foreground">
            {themeConfig.completionMessage}
          </div>
          
          <div className="pt-16">
            <HundredDayGrid 
              completedChallenges={completedDays}
              currentChallenge={todaysContent?.challengeNumber}
              totalChallenges={userChallenge?.challenge?.total_challenges || 100}
              size="medium"
            />
          </div>
          
          <div className="pt-16">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-8 py-3 text-lg font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}