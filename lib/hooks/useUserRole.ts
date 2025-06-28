'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export type UserRole = 'user' | 'contributor' | 'editor' | 'admin';

export function useUserRole() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const supabase = createClient();
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole(null);
          setLoading(false);
          return;
        }

        // Fetch user role using the stored function
        const { data, error } = await supabase.rpc('get_current_user_role');

        if (error) {
          console.error('Error fetching user role:', error);
          setError(error.message);
          setRole('user'); // Default to user role
        } else {
          setRole(data as UserRole || 'user');
        }
      } catch (err) {
        console.error('Error in fetchUserRole:', err);
        setError('Failed to fetch user role');
        setRole('user');
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, []);

  const isAdmin = role === 'admin';
  const isEditor = role === 'editor' || isAdmin;
  const isContributor = role === 'contributor' || isEditor;

  return {
    role,
    loading,
    error,
    isAdmin,
    isEditor,
    isContributor
  };
}