'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Instagram, Youtube, ChevronDown, BookOpen, Check, Sun, Moon } from 'lucide-react';
import { CrowdLogo } from '@/components/icons/crowd-logo';
import { CrowdChurch } from '@/components/icons/crowd-church';
import { LivestreamCountdown } from '@/components/livestream-countdown';
import { useUser } from '@/contexts/user-context';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { createClient } from '@/lib/supabase/client';
import { getCurrentChallenge, getAllActiveChallenges, getTodaysContent } from '@/lib/services/challenges';
import type { TodaysContent } from '@/lib/services/challenges';
import type { Database } from '@/lib/types/database';

type UserChallenge = Database['public']['Tables']['user_challenges']['Row'] & {
  challenge: Database['public']['Tables']['challenges']['Row'];
};

export function TopNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChallengesOpen, setIsChallengesOpen] = useState(false);
  const { user } = useUser();
  const { isAdmin } = useUserRole();
  const [userChallenge, setUserChallenge] = useState<UserChallenge | null>(null);
  const [allActiveChallenges, setAllActiveChallenges] = useState<UserChallenge[]>([]);
  const [todaysContent, setTodaysContent] = useState<TodaysContent | null>(null);
  const pathname = usePathname();


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      loadChallengeData();
    }
  }, [user]); // loadChallengeData is stable, no need to include

  const loadChallengeData = async () => {
    if (!user) return;
    
    try {
      const [currentChallenge, activeChallenges] = await Promise.all([
        getCurrentChallenge(user.id),
        getAllActiveChallenges(user.id)
      ]);
      
      setUserChallenge(currentChallenge);
      setAllActiveChallenges(activeChallenges);
      
      if (currentChallenge) {
        const content = await getTodaysContent(currentChallenge.id);
        setTodaysContent(content);
      }
    } catch (error) {
      console.error('Error loading challenge data:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleChallenges = () => {
    setIsChallengesOpen(!isChallengesOpen);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  // Determine if we should show challenge progress view
  const showChallengeProgress = (pathname?.includes('/journey') || pathname?.includes('/today')) && userChallenge && todaysContent;
  
  // Check completion status for each entry type
  const hasGodMessage = todaysContent?.entry?.god_message?.trim();
  const hasMorningEntry = todaysContent?.entry?.morning_entry?.trim();
  const hasEveningEntry = todaysContent?.entry?.evening_entry?.trim();

  // Journey section navigation (to prompts, not forms)
  const navigateToSection = (section: 'bible' | 'morning' | 'evening') => {
    const sectionMap = {
      bible: 1, // Scripture section (before God's Message form)
      morning: 4, // Morning prompt section (before Morning Entry form)  
      evening: 6, // Evening prompt section (before Evening Entry form)
    };
    
    const sectionIndex = sectionMap[section];
    
    // If we're already on the journey page, try to scroll directly
    if (pathname?.includes('/journey')) {
      const url = `/dashboard/gratitude/journey?section=${sectionIndex}`;
      window.location.href = url; // Simple approach for now
    } else {
      // Navigate to the journey page with the section parameter
      const url = `/dashboard/gratitude/journey?section=${sectionIndex}`;
      window.location.href = url;
    }
  };

  return (
    <>
      {/* Livestream Countdown */}
      <LivestreamCountdown />

      {/* Main Navigation Container */}
      <div className={`
        fixed left-1/2 transform -translate-x-1/2 z-50 
        transition-all duration-500 ease-in-out 
        w-[90%] max-w-[90%]
        md:transition-all md:duration-500 md:ease-in-out md:max-w-[1200px] md:top-[32px]
        ${isScrolled 
          ? 'top-[8px] md:w-[750px]' 
          : 'top-[32px] md:w-[90%]'
        }
      `}>
        {/* Combined Navigation */}
        <nav className={`
          relative
          transition-all duration-300 ease-in-out
          ${isMenuOpen ? 'bg-[#72bbc6]/95' : ''}
          backdrop-blur-md shadow-lg
          rounded-[40px]
        `}>
          {/* Main Nav Bar */}
          <div className={`
            relative z-10
            bg-[#21252D]/95 
            backdrop-blur-md shadow-md
            rounded-[40px]
            transition-all duration-500 ease-in-out
            ${isScrolled 
              ? 'md:bg-[#21252D]/90 md:shadow-lg md:border md:border-[#21252D]/20' 
              : 'md:bg-[#21252D]/95 md:shadow-md'
            }
          `}>
            {/* Navigation Header */}
            <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-1.5">
                <CrowdLogo width={28} height={28} className="text-[#7DB9C5] md:w-8 md:h-8" />
                <div className="hidden md:block">
                  <CrowdChurch width={120} height={32} className="text-white" />
                </div>
              </Link>

              {/* Center Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                {showChallengeProgress ? (
                  /* Challenge Progress View */
                  <>
                    {/* Challenge Name + Day (Clickable for dropdown) */}
                    <div className="relative">
                      <button
                        onClick={toggleChallenges}
                        className="font-bold text-[#7DB9C5]/90 hover:text-[#7DB9C5] transition-colors flex items-center gap-2"
                      >
                        <span className="text-white font-medium">
                          {userChallenge?.challenge?.title || 'Gratitude Challenge'}
                        </span>
                        <span className="text-white/70">•</span>
                        <span className="text-white/70 text-sm">
                          Day {(todaysContent?.progress?.total_challenges_completed || 0) + 1}
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isChallengesOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Challenges Dropdown */}
                      <div className={`
                        absolute top-full left-0 mt-2 w-80 z-50
                        bg-[#21252D]/95 backdrop-blur-md
                        rounded-[20px] shadow-lg border border-[#21252D]/20
                        transition-all duration-300 ease-in-out origin-top
                        ${isChallengesOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
                      `}>
                        <div className="p-4">
                          <Link
                            href="/dashboard/gratitude/journey"
                            onClick={() => setIsChallengesOpen(false)}
                            className="block p-4 rounded-[12px] hover:bg-[#7DB9C5]/10 transition-colors group"
                          >
                            <div className="text-[#7DB9C5] font-semibold text-lg mb-1 group-hover:text-[#7DB9C5]">
                              {userChallenge?.challenge?.title || 'Gratitude Challenge'}
                            </div>
                            <div className="text-white/70 text-sm">
                              Day {(todaysContent?.progress?.total_challenges_completed || 0) + 1}
                            </div>
                          </Link>
                          <div className="p-4 text-center">
                            <div className="text-white/70 text-xs">
                              Switch to different challenge (coming soon)
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Icons */}
                    <div className="flex items-center space-x-4">
                      {/* Bible/God's Message Icon */}
                      <button
                        onClick={() => navigateToSection('bible')}
                        className="relative p-2 rounded-full hover:bg-[#7DB9C5]/10 transition-colors group"
                        title="Bible reflection"
                      >
                        <BookOpen className="h-5 w-5 text-[#7DB9C5]/90 group-hover:text-[#7DB9C5]" />
                        {hasGodMessage && (
                          <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </button>

                      {/* Morning Icon */}
                      <button
                        onClick={() => navigateToSection('morning')}
                        className="relative p-2 rounded-full hover:bg-[#7DB9C5]/10 transition-colors group"
                        title="Morning reflection"
                      >
                        <Sun className="h-5 w-5 text-[#7DB9C5]/90 group-hover:text-[#7DB9C5]" />
                        {hasMorningEntry && (
                          <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </button>

                      {/* Evening Icon */}
                      <button
                        onClick={() => navigateToSection('evening')}
                        className="relative p-2 rounded-full hover:bg-[#7DB9C5]/10 transition-colors group"
                        title="Evening reflection"
                      >
                        <Moon className="h-5 w-5 text-[#7DB9C5]/90 group-hover:text-[#7DB9C5]" />
                        {hasEveningEntry && (
                          <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </button>
                    </div>
                  </>
                ) : userChallenge && todaysContent ? (
                  /* Single challenge - direct link (no dropdown for single challenge) */
                  <Link
                    href={`/dashboard/${userChallenge.challenge.theme}/journey`}
                    className="font-bold text-[#7DB9C5]/90 hover:text-[#7DB9C5] transition-colors flex items-center gap-2"
                  >
                    <span className="text-white font-medium">
                      {userChallenge?.challenge?.title || 'Challenge'}
                    </span>
                    <span className="text-white/70">•</span>
                    <span className="text-white/70 text-sm">
                      Day {(todaysContent?.progress?.total_challenges_completed || 0) + 1}
                    </span>
                  </Link>
                ) : (
                  /* No active challenge - direct link to start */
                  <Link
                    href="/dashboard/challenges"
                    className="font-bold text-[#7DB9C5]/90 hover:text-[#7DB9C5] transition-colors"
                  >
                    Start a Challenge
                  </Link>
                )}
              </div>

              {/* Hamburger Menu */}
              <button
                onClick={toggleMenu}
                className="p-1.5 md:p-2 rounded-lg hover:bg-[#7DB9C5]/10 transition-colors"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5 md:h-6 md:w-6 text-[#7DB9C5]" />
                ) : (
                  <>
                    {/* Two-line hamburger on mobile, three-line on desktop */}
                    <div className="md:hidden text-[#7DB9C5]">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </div>
                    <Menu className="hidden md:block h-6 w-6 text-[#7DB9C5]" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Dropdown Content */}
          <div className={`
            transition-all duration-300 ease-in-out overflow-hidden
            ${isMenuOpen ? 'max-h-[90vh] md:max-h-[70vh] opacity-100' : 'max-h-0 opacity-0'}
          `}>
            {/* Central Content Container */}
            <div className="relative w-full h-full py-4">
              <div className="mx-auto w-[90%] md:w-[750px] min-h-[400px] rounded-[20px] p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  
                  {/* Left Column - Latest Livestream - Hidden on Mobile */}
                  <div className="p-4 hidden md:block">
                    <p className="text-white text-sm mb-4">Latest</p>
                    
                    {/* Title */}
                    <h4 className="font-semibold text-[#21252D] mb-2">
                      Weekly Gratitude Session: Finding Joy in Small Moments
                    </h4>
                    
                    {/* Summary */}
                    <p className="text-[#21252D]/90 text-sm mb-3 line-clamp-3">
                      Join us for an inspiring session where we explore the power of gratitude in our daily lives. 
                      Discover practical techniques to cultivate thankfulness and transform your perspective.
                    </p>
                    
                    {/* Read More Link */}
                    <Link 
                      href="/livestream/latest" 
                      className="text-white/80 hover:text-[#21252D] text-xl font-bold"
                      onClick={toggleMenu}
                    >
                      Watch Now →
                    </Link>
                  </div>

                  {/* Right Column - Menu */}
                  <div className="p-4">
                    <div className="space-y-6">
                      
                      {/* Menu Items */}
                      <div>
                        <div className="space-y-4 md:space-y-3">
                          {/* Mobile Nav Items - Only show on mobile */}
                          <div className="md:hidden space-y-4 mb-6">
                            {userChallenge && todaysContent ? (
                              <Link 
                                href="/dashboard/gratitude/journey" 
                                className="block text-white/90 hover:text-[#21252D] transition-colors text-2xl py-2"
                                onClick={toggleMenu}
                              >
                                {userChallenge.challenge?.title || 'Gratitude Challenge'}
                                <div className="text-white/70 text-sm">Day {(todaysContent.progress?.total_challenges_completed || 0) + 1}</div>
                              </Link>
                            ) : (
                              <Link 
                                href="/dashboard/challenges" 
                                className="block text-white/90 hover:text-[#21252D] transition-colors text-2xl py-2"
                                onClick={toggleMenu}
                              >
                                Start Challenge
                              </Link>
                            )}
                            
                            {/* Separator for mobile */}
                            <div className="border-t border-white/20 pt-3"></div>
                          </div>
                          
                          {user && (
                            <>
                              <Link 
                                href="/dashboard" 
                                className="block text-white/90 hover:text-[#21252D] transition-colors text-2xl md:text-4xl py-2 md:py-0"
                                onClick={toggleMenu}
                              >
                                My Dashboard
                              </Link>
                              <Link 
                                href="/dashboard/challenges" 
                                className="block text-white/90 hover:text-[#21252D] transition-colors text-2xl md:text-4xl py-2 md:py-0"
                                onClick={toggleMenu}
                              >
                                Challenges
                              </Link>
                              <Link 
                                href="/dashboard/review" 
                                className="block text-white/90 hover:text-[#21252D] transition-colors text-2xl md:text-4xl py-2 md:py-0"
                                onClick={toggleMenu}
                              >
                                Weekly Review
                              </Link>
                              <Link 
                                href="/account" 
                                className="block text-white/90 hover:text-[#21252D] transition-colors text-2xl md:text-4xl py-2 md:py-0"
                                onClick={toggleMenu}
                              >
                                My Account
                              </Link>
                            </>
                          )}
                          {isAdmin && (
                            <>
                              <Link 
                                href="/dashboard/admin" 
                                className="block text-white/90 hover:text-[#21252D] transition-colors text-2xl md:text-4xl py-2 md:py-0"
                                onClick={toggleMenu}
                              >
                                Admin
                              </Link>
                              <Link 
                                href="/dashboard/admin/challenges" 
                                className="block text-white/90 hover:text-[#21252D] transition-colors text-2xl md:text-4xl py-2 md:py-0"
                                onClick={toggleMenu}
                              >
                                Manage Challenges
                              </Link>
                            </>
                          )}
                          <Link 
                            href="/about" 
                            className="block text-white/90 hover:text-[#21252D] transition-colors text-2xl md:text-4xl py-2 md:py-0"
                            onClick={toggleMenu}
                          >
                            About Crowd
                          </Link>
                          {user && (
                            <button
                              onClick={() => {
                                handleLogout();
                                toggleMenu();
                              }}
                              className="block text-white/90 hover:text-[#21252D] transition-colors w-full text-left text-2xl md:text-4xl py-2 md:py-0"
                            >
                              Logout
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Separator Line */}
                      <div className="border-t border-white/20"></div>
                      
                      {/* Social Media Icons */}
                      <div>
                        <div className="flex space-x-4">
                          <Link href="#" className="p-2 text-white/80 hover:text-white transition-colors">
                            <Instagram className="h-5 w-5" />
                          </Link>
                          <Link href="#" className="p-2 text-white/80 hover:text-white transition-colors">
                            <Youtube className="h-5 w-5" />
                          </Link>
                          <Link href="#" className="p-2 text-white/80 hover:text-white transition-colors">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 12a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1v-6H9zm5.5 0H13v6h1.5a1.5 1.5 0 0 0 1.5-1.5v-3a1.5 1.5 0 0 0-1.5-1.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15H8.5A1.5 1.5 0 0 1 7 15.5v-4A1.5 1.5 0 0 1 8.5 10H10v7zm6.5 0H14v-7h2.5A2.5 2.5 0 0 1 19 12.5v2a2.5 2.5 0 0 1-2.5 2.5z"/>
                            </svg>
                          </Link>
                        </div>
                      </div>
                      
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}