
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
    }
  }
}
