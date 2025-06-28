'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function UpdateMetadataButton() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const updateMetadata = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Just set the metadata directly since we know the values
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: 'Matt',
          last_name: 'Edmundson',
          country: 'GB'
        }
      });

      if (error) throw error;

      setSuccess(true);
      
      // Refresh the page to see the changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Error updating metadata:', error);
      alert('Error updating metadata: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-green-600 font-medium">
        ✅ Metadata updated successfully! Refreshing page...
      </div>
    );
  }

  return (
    <Button 
      onClick={updateMetadata} 
      disabled={loading}
      className="w-fit"
    >
      {loading ? 'Updating...' : 'Fix Navigation Name'}
    </Button>
  );
}