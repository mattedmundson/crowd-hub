// Stub for Supabase client - replace with your actual implementation
export function createClient() {
  return {
    auth: {
      signOut: async () => {
        // Implement your sign out logic
        console.log('Signing out...');
      }
    }
  };
}