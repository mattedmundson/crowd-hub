'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function LivestreamCountdown() {
  const [timeUntilStream, setTimeUntilStream] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const calculateTimeUntilStream = () => {
      // Get current UK time
      const now = new Date();
      const ukTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/London"}));
      
      const currentDay = ukTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const currentHour = ukTime.getHours();
      const currentMinute = ukTime.getMinutes();

      // Sunday is 0
      if (currentDay === 0) {
        // It's Sunday
        const streamHour = 19; // 7pm
        const streamMinute = 0;
        
        if (currentHour < streamHour || (currentHour === streamHour && currentMinute < streamMinute)) {
          // Before 7pm on Sunday
          const hoursUntil = streamHour - currentHour - (currentMinute > 0 ? 1 : 0);
          const minutesUntil = currentMinute > 0 ? 60 - currentMinute : 0;
          
          if (hoursUntil > 0) {
            return `We are going live today, in ${hoursUntil} ${hoursUntil === 1 ? 'hour' : 'hours'}`;
          } else {
            // Less than an hour
            const totalMinutes = (streamHour - currentHour) * 60 + (streamMinute - currentMinute);
            return `We are going live today, in ${totalMinutes} ${totalMinutes === 1 ? 'minute' : 'minutes'}`;
          }
        } else if (currentHour === streamHour || (currentHour === 19 && currentMinute < 60) || (currentHour === 20 && currentMinute === 0)) {
          // During the livestream (7pm-8pm)
          return 'We are live now!';
        } else {
          // After 8pm on Sunday
          return 'Our livestream has finished for today - but the next one will be here soon';
        }
      } else {
        // Monday through Saturday
        const daysUntilSunday = 7 - currentDay;
        
        if (daysUntilSunday === 1) {
          return 'The next Crowd Church livestream is tomorrow';
        } else {
          return `The next Crowd Church livestream is in ${daysUntilSunday} days`;
        }
      }
    };

    // Calculate immediately
    setTimeUntilStream(calculateTimeUntilStream());

    // Update every minute
    const interval = setInterval(() => {
      setTimeUntilStream(calculateTimeUntilStream());
    }, 60000);

    return () => clearInterval(interval);
  }, [mounted]);

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) {
    return <div className="text-center py-2 text-sm" />;
  }

  return (
    <div className="text-center py-2 text-sm">
      <span className="text-[#0498db]">{timeUntilStream}</span>
      {timeUntilStream && !timeUntilStream.includes('live now') && (
        <>
          <span className="text-[#0498db] mx-2">→</span>
          <Link href="/live-stream">
            <button className="text-[#0498db] underline p-0 h-auto hover:text-[#0498db]/80">
              Find Out More
            </button>
          </Link>
        </>
      )}
      {timeUntilStream.includes('live now') && (
        <>
          <span className="text-[#0498db] mx-2">→</span>
          <Link href="/live-stream">
            <button className="text-[#0498db] underline p-0 h-auto hover:text-[#0498db]/80">
              Watch Now
            </button>
          </Link>
        </>
      )}
    </div>
  );
}