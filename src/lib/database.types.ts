
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
      puzzle_levels: {
        Row: {
          id: number
          difficulty: 'easy' | 'medium' | 'hard' | 'very-hard'
          initial_state: Json
          solution: Json
          created_at: string
        }
        Insert: {
          id: number
          difficulty: 'easy' | 'medium' | 'hard' | 'very-hard'
          initial_state: Json
          solution: Json
          created_at?: string
        }
        Update: {
          id?: number
          difficulty?: 'easy' | 'medium' | 'hard' | 'very-hard'
          initial_state?: Json
          solution?: Json
          created_at?: string
        }
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          game_id: string
          id: string
          player_id: string
          player_name: string
        }
        Insert: {
          content: string
          created_at?: string
          game_id: string
          id?: string
          player_id: string
          player_name: string
        }
        Update: {
          content?: string
          created_at?: string
          game_id?: string
          id?: string
          player_id?: string
          player_name?: string
        }
      }
      games: {
        Row: {
          phase: string
          voting_results: Json
          night_actions: Json
          chat: Json
          created_at: string
          updated_at: string
          id: string
          created_by: string
          players: Json
          day_count: number
          messages: Json
        }
        Insert: {
          phase: string
          voting_results?: Json
          night_actions?: Json
          chat?: Json
          created_at?: string
          updated_at?: string
          id?: string
          created_by: string
          players?: Json
          day_count?: number
          messages?: Json
        }
        Update: {
          phase?: string
          voting_results?: Json
          night_actions?: Json
          chat?: Json
          created_at?: string
          updated_at?: string
          id?: string
          created_by?: string
          players?: Json
          day_count?: number
          messages?: Json
        }
      }
    }
  }
}
