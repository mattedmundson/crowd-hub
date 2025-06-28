export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      challenges: {
        Row: {
          id: string
          title: string
          description: string | null
          total_days: number
          category: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          total_days?: number
          category?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          total_days?: number
          category?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      challenge_prompts: {
        Row: {
          id: string
          challenge_id: string
          day_number: number
          scripture_reference: string | null
          scripture_text: string | null
          context_text: string | null
          morning_prompt: string
          evening_reflection: string | null
          created_at: string
        }
        Insert: {
          id?: string
          challenge_id: string
          day_number: number
          scripture_reference?: string | null
          scripture_text?: string | null
          context_text?: string | null
          morning_prompt: string
          evening_reflection?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          challenge_id?: string
          day_number?: number
          scripture_reference?: string | null
          scripture_text?: string | null
          context_text?: string | null
          morning_prompt?: string
          evening_reflection?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_prompts_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          }
        ]
      }
      user_challenges: {
        Row: {
          id: string
          user_id: string
          challenge_id: string
          start_date: string
          schedule_type: 'morning' | 'both'
          current_day: number
          longest_streak: number
          current_streak: number
          last_entry_date: string | null
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          challenge_id: string
          start_date?: string
          schedule_type: 'morning' | 'both'
          current_day?: number
          longest_streak?: number
          current_streak?: number
          last_entry_date?: string | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          challenge_id?: string
          start_date?: string
          schedule_type?: 'morning' | 'both'
          current_day?: number
          longest_streak?: number
          current_streak?: number
          last_entry_date?: string | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      challenge_entries: {
        Row: {
          id: string
          user_challenge_id: string
          day_number: number
          god_message: string | null
          morning_entry: string | null
          evening_entry: string | null
          completed_offline: boolean
          review_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_challenge_id: string
          day_number: number
          god_message?: string | null
          morning_entry?: string | null
          evening_entry?: string | null
          completed_offline?: boolean
          review_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_challenge_id?: string
          day_number?: number
          god_message?: string | null
          morning_entry?: string | null
          evening_entry?: string | null
          completed_offline?: boolean
          review_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_entries_user_challenge_id_fkey"
            columns: ["user_challenge_id"]
            isOneToOne: false
            referencedRelation: "user_challenges"
            referencedColumns: ["id"]
          }
        ]
      }
      // Include existing user_roles table for compatibility
      user_roles: {
        Row: {
          user_id: string
          role: string
          updated_at: string
        }
        Insert: {
          user_id: string
          role: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      // Include profiles table for compatibility
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          country: string | null
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          country?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          country?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_current_day: {
        Args: {
          start_date: string
        }
        Returns: number
      }
      update_challenge_progress: {
        Args: {
          user_challenge_uuid: string
        }
        Returns: void
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_user_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}