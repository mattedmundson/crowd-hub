'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTodaysContent, getCurrentChallenge } from '@/lib/services/challenges';
import { saveEntry } from '@/lib/services/entries';
import { createClient } from '@/lib/supabase/client';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { Edit2 } from 'lucide-react';
import { HundredDayGrid } from '@/components/challenge/hundred-day-grid';
import { MinimalWriter } from '@/components/journey/minimal-writer';
import type { TodaysContent } from '@/lib/services/challenges';
import type { Database } from '@/lib/types/database';

type UserChallenge = Database['public']['Tables']['user_challenges']['Row'] & {
  challenge: Database['public']['Tables']['challenges']['Row'];
};

export default function JourneyPage() {
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
  
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);
  const { role: userRole } = useUserRole();
  const canEdit = userRole === 'admin' || userRole === 'editor';

  const scrollToSection = (sectionIndex: number) => {
    const section = sectionsRef.current[sectionIndex];
    if (section) {
      section.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);


  // Handle section navigation from URL parameters
  useEffect(() => {
    const sectionParam = searchParams?.get('section');
    if (sectionParam && !loading) {
      const sectionIndex = parseInt(sectionParam, 10);
      if (!isNaN(sectionIndex) && sectionIndex >= 0 && sectionIndex <= 12) {
        // Delay to ensure the page is fully loaded
        setTimeout(() => scrollToSection(sectionIndex), 500);
      }
    }
  }, [searchParams, loading]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      
      setScrollY(currentScrollY);
      
      // Determine which section is currently in view
      const sectionIndex = Math.floor(currentScrollY / viewportHeight);
      setCurrentSection(Math.min(sectionIndex, 12)); // 0-12 sections
      
      // Calculate scroll progress for Bible verse animation
      // Animation should happen as we scroll through the Bible verse section
      const animationStart = viewportHeight * 0.5; // Start halfway through section 1
      const animationEnd = viewportHeight * 1.67;  // Complete at 2/3 through section 2
      
      let newProgress = 0;
      if (currentScrollY < animationStart) {
        newProgress = 0;
      } else if (currentScrollY > animationEnd) {
        newProgress = 1;
      } else {
        newProgress = (currentScrollY - animationStart) / (animationEnd - animationStart);
        newProgress = Math.min(Math.max(newProgress, 0), 1);
      }
      
      setScrollProgress(newProgress);
      
      // Calculate scroll progress for Bible verse recap animation (section 8)
      const recapSectionStart = viewportHeight * 7.75; // Start between section 7 and 8
      const recapAnimationEnd = viewportHeight * 8.67;  // Complete at 2/3 through section 8
      
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
      
      // Calculate when elements should become sticky (when Bible verse hits nav)
      const stickyTrigger = viewportHeight * 1.3; // When verse starts hitting nav
      const stickyEnd = viewportHeight * 2.5;   // When scaling animation completes
      
      let stickySizeProgress = 0;
      if (currentScrollY < stickyEnd) {
        stickySizeProgress = 0;
      } else if (currentScrollY > stickyEnd + viewportHeight) {
        stickySizeProgress = 1;
      } else {
        stickySizeProgress = (currentScrollY - stickyEnd) / viewportHeight;
      }
      
      setStickyProgress(stickySizeProgress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }
      
      const currentChallenge = await getCurrentChallenge(user.id);
      
      if (!currentChallenge) {
        router.push('/dashboard/gratitude');
        return;
      }
      
      setUserChallenge(currentChallenge);
      
      const content = await getTodaysContent(currentChallenge.id);
      setTodaysContent(content);
      setGodMessage(content.entry?.god_message || '');
      setMorningEntry(content.entry?.morning_entry || '');
      setEveningEntry(content.entry?.evening_entry || '');
      
      // Load completed days for the progress grid
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
      
      // Get all entries for this user challenge that have content
      const { data: entries, error } = await supabase
        .from('challenge_entries')
        .select('day_number, morning_entry, evening_entry, god_message, completed_offline')
        .eq('user_challenge_id', userChallengeId)
        .order('day_number');
      
      if (error) {
        console.error('Error loading completed days:', error);
        return;
      }
      
      // A day is considered completed if it has any content or is marked as completed offline
      const completed = entries
        .filter(entry => 
          entry.morning_entry?.trim() || 
          entry.evening_entry?.trim() || 
          entry.god_message?.trim() || 
          entry.completed_offline
        )
        .map(entry => entry.day_number);
      
      setCompletedDays(completed);
    } catch (error) {
      console.error('Error loading completed days:', error);
    }
  };

  const handleSaveGodMessage = async () => {
    if (!userChallenge || !todaysContent || !godMessage.trim()) return;
    
    await saveEntry({
      userChallengeId: userChallenge.id,
      dayNumber: todaysContent.dayNumber,
      entryType: 'god_message',
      content: godMessage,
    });
    
    // Refresh completed days
    if (userChallenge) {
      await loadCompletedDays(userChallenge.id);
    }
  };

  const handleSaveMorningEntry = async () => {
    if (!userChallenge || !todaysContent || !morningEntry.trim()) return;
    
    await saveEntry({
      userChallengeId: userChallenge.id,
      dayNumber: todaysContent.dayNumber,
      entryType: 'morning',
      content: morningEntry,
    });
    
    // Refresh completed days
    if (userChallenge) {
      await loadCompletedDays(userChallenge.id);
    }
  };

  const handleSaveEveningEntry = async () => {
    if (!userChallenge || !todaysContent || !eveningEntry.trim()) return;
    
    await saveEntry({
      userChallengeId: userChallenge.id,
      dayNumber: todaysContent.dayNumber,
      entryType: 'evening',
      content: eveningEntry,
    });
    
    // Refresh completed days
    if (userChallenge) {
      await loadCompletedDays(userChallenge.id);
    }
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Preparing your journey...</div>
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

  const { dayNumber, prompt } = todaysContent;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  return (
    <div className="relative">
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

      {/* Section 1: Opening Prayer */}
      <section 
        ref={(el) => sectionsRef.current[0] = el}
        className="min-h-screen flex items-center justify-center px-6"
      >
        <div className="text-center max-w-2xl mx-auto space-y-8">
          <h1 className="text-4xl md:text-6xl font-light leading-tight text-foreground">
            Close your eyes, take a deep breath and commit this time to the Lord
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-light">
            Day {dayNumber}
          </p>
          <div className="pt-16">
            <button 
              onClick={() => scrollToSection(1)}
              className="hover:text-foreground hover:animate-bounce transition-colors cursor-pointer"
              title="Continue to scripture"
            >
              <svg className="w-6 h-6 mx-auto text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Section 2: Bible Verse */}
      <section 
        ref={(el) => sectionsRef.current[1] = el}
        className="min-h-screen flex items-center justify-center px-6"
      >
        <div className="text-center max-w-5xl mx-auto space-y-8">
          {prompt?.scripture_reference && (
            <p 
              className="text-xl md:text-2xl text-primary font-medium transition-all duration-300"
              style={{
                opacity: 0.3 + (scrollProgress * 0.7),
                transform: `translateY(${(1 - scrollProgress) * 20}px)`
              }}
            >
              {prompt.scripture_reference}
            </p>
          )}
          {prompt?.scripture_text && (
            <blockquote 
              className="text-3xl md:text-5xl font-black leading-relaxed"
              style={{
                transform: `translateY(${(1 - scrollProgress) * 50}px)`
              }}
            >
              "
              {prompt.scripture_text.split(' ').map((word, index) => {
                const totalWords = prompt.scripture_text.split(' ').length;
                // Complete the animation much earlier - when we're only partway through the scroll
                const adjustedProgress = Math.min(1, scrollProgress * 2); // Animation completes at 50% scroll
                const wordRevealPoint = index / totalWords;
                const wordProgress = Math.max(0, Math.min(1, (adjustedProgress - wordRevealPoint) * totalWords));
                
                return (
                  <span
                    key={index}
                    className="transition-opacity duration-300"
                    style={{
                      opacity: 0.05 + (wordProgress * 0.95)
                    }}
                  >
                    {word}
                    {index < totalWords - 1 ? ' ' : ''}
                  </span>
                );
              })}
              "
            </blockquote>
          )}
          <div className="pt-16">
            <button 
              onClick={() => scrollToSection(2)}
              className="transition-opacity duration-300 hover:text-foreground hover:animate-bounce cursor-pointer"
              style={{ opacity: scrollProgress < 0.8 ? 1 : 0 }}
              title="Continue to context"
            >
              <svg className="w-6 h-6 mx-auto text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Section 3: Context */}
      <section 
        ref={(el) => sectionsRef.current[2] = el}
        className="min-h-screen flex items-center justify-center px-6"
      >
        <div className="text-center max-w-2xl mx-auto space-y-8">
          {prompt?.context_text && (
            <div className="text-xl md:text-2xl leading-relaxed text-muted-foreground text-left bg-muted/20 rounded-lg p-10">
              {prompt.context_text.split('\n').map((paragraph, index) => (
                <p key={index} className={index > 0 ? 'mt-5' : ''}>
                  {paragraph}
                </p>
              ))}
            </div>
          )}
          <div className="pt-16">
            <button 
              onClick={() => scrollToSection(3)}
              className="hover:text-foreground hover:animate-bounce transition-colors cursor-pointer"
              title="Continue to reflection"
            >
              <svg className="w-6 h-6 mx-auto text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Section 4: God's Message Form */}
      <section 
        ref={(el) => sectionsRef.current[3] = el}
        className="min-h-screen"
      >
        <MinimalWriter
          value={godMessage}
          onChange={setGodMessage}
          onSave={handleSaveGodMessage}
          onNext={() => scrollToSection(4)}
          placeholder="What is God speaking to your heart about this scripture?"
        />
      </section>

      {/* Section 5: Morning Reflection Prompt */}
      <section 
        ref={(el) => sectionsRef.current[4] = el}
        className="min-h-screen flex items-center justify-center px-6"
      >
        <div className="text-center max-w-2xl mx-auto space-y-8">
          {prompt?.morning_prompt && (
            <div className="text-xl md:text-2xl leading-relaxed text-muted-foreground text-left bg-muted/20 rounded-lg p-10">
              {prompt.morning_prompt.split('\n').map((paragraph, index) => (
                <p key={index} className={index > 0 ? 'mt-5' : ''}>
                  {paragraph}
                </p>
              ))}
            </div>
          )}
          <div className="pt-16">
            <button 
              onClick={() => scrollToSection(5)}
              className="hover:text-foreground hover:animate-bounce transition-colors cursor-pointer"
              title="Continue to write reflection"
            >
              <svg className="w-6 h-6 mx-auto text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Section 6: Morning Entry Form */}
      <section 
        ref={(el) => sectionsRef.current[5] = el}
        className="min-h-screen"
      >
        <MinimalWriter
          value={morningEntry}
          onChange={setMorningEntry}
          onSave={handleSaveMorningEntry}
          onNext={() => scrollToSection(6)}
          placeholder="What's on your heart today? Share your thoughts and gratitude..."
        />
      </section>

      {/* Section 7: Evening Reflection Prompt */}
      <section 
        ref={(el) => sectionsRef.current[6] = el}
        className="min-h-screen flex items-center justify-center px-6"
      >
        <div className="text-center max-w-2xl mx-auto space-y-8">
          {prompt?.evening_reflection && (
            <div className="text-xl md:text-2xl leading-relaxed text-muted-foreground text-left bg-muted/20 rounded-lg p-10">
              {prompt.evening_reflection.split('\n').map((paragraph, index) => (
                <p key={index} className={index > 0 ? 'mt-5' : ''}>
                  {paragraph}
                </p>
              ))}
            </div>
          )}
          <div className="pt-16">
            <button 
              onClick={() => scrollToSection(7)}
              className="hover:text-foreground hover:animate-bounce transition-colors cursor-pointer"
              title="Continue to write reflection"
            >
              <svg className="w-6 h-6 mx-auto text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Section 8: Evening Entry Form */}
      <section 
        ref={(el) => sectionsRef.current[7] = el}
        className="min-h-screen"
      >
        <MinimalWriter
          value={eveningEntry}
          onChange={setEveningEntry}
          onSave={handleSaveEveningEntry}
          onNext={() => scrollToSection(8)}
          placeholder="As you reflect on your day, what are you grateful for?"
        />
      </section>

      {/* Section 9: Bible Verse Recap */}
      <section 
        ref={(el) => sectionsRef.current[8] = el}
        className="min-h-screen flex items-center justify-center px-6"
      >
        <div className="text-center max-w-5xl mx-auto space-y-8">
          {prompt?.scripture_reference && (
            <p className="text-xl md:text-2xl text-primary font-medium">
              {prompt.scripture_reference}
            </p>
          )}
          {prompt?.scripture_text && (
            <blockquote className="text-3xl md:text-5xl font-black leading-relaxed">
              "
              {prompt.scripture_text.split(' ').map((word, index) => {
                const totalWords = prompt.scripture_text.split(' ').length;
                // Start animation immediately when section is in view and complete by scroll progress
                const adjustedProgress = Math.min(1, recapScrollProgress * 3); // Faster animation
                const wordRevealPoint = index / totalWords;
                const wordProgress = Math.max(0, Math.min(1, (adjustedProgress - wordRevealPoint) * totalWords));
                
                return (
                  <span
                    key={index}
                    className="transition-opacity duration-300"
                    style={{
                      opacity: 0.05 + (wordProgress * 0.95)
                    }}
                  >
                    {word}
                    {index < totalWords - 1 ? ' ' : ''}
                  </span>
                );
              })}
              "
            </blockquote>
          )}
          <div className="pt-16">
            <button 
              onClick={() => scrollToSection(9)}
              className="hover:text-foreground hover:animate-bounce transition-colors cursor-pointer"
              title="Continue"
            >
              <svg className="w-6 h-6 mx-auto text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Section 10: God's Message Review */}
      <section 
        ref={(el) => sectionsRef.current[9] = el}
        className="min-h-screen flex items-center justify-center px-6"
      >
        <div className="text-center max-w-2xl mx-auto space-y-8">
          <p className="text-base md:text-lg text-primary font-medium text-left">
            What you wrote about this verse...
          </p>
          {godMessage && (
            <div className="text-xl md:text-2xl leading-relaxed text-left" style={{ color: '#0498db' }}>
              {godMessage.split('\n').map((paragraph, index) => (
                <p key={index} className={index > 0 ? 'mt-5' : ''}>
                  {paragraph}
                </p>
              ))}
            </div>
          )}
          <div className="pt-16">
            <button 
              onClick={() => scrollToSection(10)}
              className="hover:text-foreground hover:animate-bounce transition-colors cursor-pointer"
              title="Continue"
            >
              <svg className="w-6 h-6 mx-auto text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Section 11: Morning Entry Review */}
      <section 
        ref={(el) => sectionsRef.current[10] = el}
        className="min-h-screen flex items-center justify-center px-6"
      >
        <div className="text-center max-w-2xl mx-auto space-y-8">
          <p className="text-base md:text-lg text-primary font-medium text-left">
            What you wrote this morning...
          </p>
          {morningEntry && (
            <div className="text-xl md:text-2xl leading-relaxed text-left" style={{ color: '#0498db' }}>
              {morningEntry.split('\n').map((paragraph, index) => (
                <p key={index} className={index > 0 ? 'mt-5' : ''}>
                  {paragraph}
                </p>
              ))}
            </div>
          )}
          <div className="pt-16">
            <button 
              onClick={() => scrollToSection(11)}
              className="hover:text-foreground hover:animate-bounce transition-colors cursor-pointer"
              title="Continue"
            >
              <svg className="w-6 h-6 mx-auto text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Section 12: Evening Entry Review */}
      <section 
        ref={(el) => sectionsRef.current[11] = el}
        className="min-h-screen flex items-center justify-center px-6"
      >
        <div className="text-center max-w-2xl mx-auto space-y-8">
          <p className="text-base md:text-lg text-primary font-medium text-left">
            What you wrote this evening...
          </p>
          {eveningEntry && (
            <div className="text-xl md:text-2xl leading-relaxed text-left" style={{ color: '#0498db' }}>
              {eveningEntry.split('\n').map((paragraph, index) => (
                <p key={index} className={index > 0 ? 'mt-5' : ''}>
                  {paragraph}
                </p>
              ))}
            </div>
          )}
          <div className="pt-16">
            <button 
              onClick={() => scrollToSection(12)}
              className="hover:text-foreground hover:animate-bounce transition-colors cursor-pointer"
              title="Continue"
            >
              <svg className="w-6 h-6 mx-auto text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Section 13: Completion */}
      <section 
        ref={(el) => sectionsRef.current[12] = el}
        className="min-h-screen flex items-center justify-center px-6"
      >
        <div className="text-center max-w-2xl mx-auto space-y-8">
          <h1 className="text-4xl md:text-6xl font-light leading-tight text-foreground">
            Day {todaysContent?.dayNumber} Complete
          </h1>
          
          <div className="pt-16">
            <HundredDayGrid 
              completedDays={completedDays}
              currentDay={todaysContent?.dayNumber}
              size="medium"
            />
          </div>
          
          <div className="pt-16">
            <button
              onClick={() => router.push('/dashboard/gratitude/today')}
              className="px-8 py-3 text-lg font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}