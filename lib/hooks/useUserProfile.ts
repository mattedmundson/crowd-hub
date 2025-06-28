'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  country: string | null;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const supabase = createClient();
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setProfile(null);
          setLoading(false);
          return;
        }

        // Fetch user profile
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, country')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          setError(error.message);
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error('Error in fetchProfile:', err);
        setError('Failed to fetch user profile');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    error,
    firstName: profile?.first_name
  };
}