'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/navigation/top-nav';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/contexts/user-context';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { countries } from '@/lib/countries';

export default function OnboardingPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect user's country based on browser language and timezone
  useEffect(() => {
    const detectCountry = async () => {
      try {
        // First try browser language
        const browserLang = navigator.language || navigator.languages[0];
        const langCountry = browserLang.split('-')[1]?.toUpperCase();
        
        // Map common language-country combinations
        const langToCountry: { [key: string]: string } = {
          'EN-GB': 'GB',
          'EN-US': 'US',
          'EN-AU': 'AU',
          'EN-CA': 'CA',
          'EN-NZ': 'NZ',
        };
        
        if (langCountry && langToCountry[browserLang.toUpperCase()]) {
          setCountry(langToCountry[browserLang.toUpperCase()]);
          return;
        }
        
        // Fallback to timezone detection
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const timezoneToCountry: { [key: string]: string } = {
          'Europe/London': 'GB',
          'America/New_York': 'US',
          'America/Chicago': 'US',
          'America/Los_Angeles': 'US',
          'Australia/Sydney': 'AU',
          'Australia/Melbourne': 'AU',
          'America/Toronto': 'CA',
          'Pacific/Auckland': 'NZ',
        };
        
        for (const [tz, code] of Object.entries(timezoneToCountry)) {
          if (timezone.includes(tz)) {
            setCountry(code);
            break;
          }
        }
        
        // If still no match, try IP-based detection
        if (!country) {
          try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            if (data.country_code) {
              setCountry(data.country_code);
            }
          } catch {
            // IP detection failed, that's ok
          }
        }
      } catch (err) {
        console.error('Error detecting country:', err);
      }
    };
    
    detectCountry();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Update user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          country: country,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <TopNav />
      
      <div className="flex items-center justify-center min-h-screen pt-32 pb-20 px-4">
        <div className="w-full max-w-[50%] md:max-w-[50%] lg:max-w-[50%]">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to Crowd Hub
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Let's get to know you better
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* First Name */}
            <div>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-6 py-4 text-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0498db] focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
              />
            </div>

            {/* Last Name */}
            <div>
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-6 py-4 text-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0498db] focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
              />
            </div>

            {/* Country */}
            <div>
              <Select value={country} onValueChange={setCountry} required>
                <SelectTrigger className="w-full px-6 py-4 h-auto text-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0498db] focus:border-transparent transition-all duration-200">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {countries.map((country) => {
                    // Handle divider
                    if (country.code === 'divider') {
                      return (
                        <div key="divider" className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                      );
                    }
                    
                    return (
                      <SelectItem 
                        key={country.code} 
                        value={country.code}
                        className="py-3"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{country.flag}</span>
                          <span>{country.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !firstName || !lastName || !country}
              className="w-full px-6 py-4 h-auto text-lg rounded-full bg-[#0498db] hover:bg-[#0498db]/90 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Continue'}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}