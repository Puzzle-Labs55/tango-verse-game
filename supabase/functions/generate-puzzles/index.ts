
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Block {
  id: number;
  type: 'sun' | 'moon' | null;
  rotation: number;
  isLocked: boolean;
  isHint: boolean;
}

const GRID_SIZE = 6;

const generateValidBoard = (): Block[] => {
  // ... copy the existing generateValidBoard logic from GameBoard.tsx
  // This ensures we use the same puzzle generation logic
};

const createPuzzle = (solution: Block[], difficulty: string): Block[] => {
  // ... copy the existing createPuzzle logic from GameBoard.tsx
  // This ensures we use the same puzzle creation logic
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate puzzles for each level
    for (let level = 1; level <= 100; level++) {
      const difficulty = (() => {
        const cyclePosition = (level - 1) % 5;
        switch (cyclePosition) {
          case 0:
          case 1:
            return 'easy';
          case 2:
            return 'medium';
          case 3:
            return 'hard';
          case 4:
            return 'very-hard';
          default:
            return 'easy';
        }
      })();

      console.log(`Generating level ${level} (${difficulty})...`);

      const solution = generateValidBoard();
      const initialState = createPuzzle(solution, difficulty);

      const { error } = await supabaseClient
        .from('puzzle_levels')
        .upsert({
          id: level,
          difficulty,
          initial_state: initialState,
          solution
        })

      if (error) {
        console.error(`Error storing level ${level}:`, error);
        continue;
      }

      console.log(`Level ${level} generated and stored successfully`);
    }

    return new Response(JSON.stringify({ message: 'Puzzles generated successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
