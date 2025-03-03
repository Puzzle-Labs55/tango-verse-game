
import GameBoard from "@/components/GameBoard";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams, useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const levelParam = searchParams.get('level');
  const [puzzleId, setPuzzleId] = useState<number>(levelParam ? parseInt(levelParam) : 1);

  useEffect(() => {
    if (!levelParam) {
      // Only fetch the latest level if no level is specified in URL
      const fetchLatestPuzzleId = async () => {
        const { data, error } = await supabase
          .from('puzzle_levels')
          .select('id')
          .order('id', { ascending: false })
          .limit(1)
          .single();
        
        if (data) {
          setPuzzleId(data.id);
          // Update URL to include level parameter
          navigate(`/?level=${data.id}`, { replace: true });
        } else {
          // If no levels found, create level 1
          setPuzzleId(1);
          navigate(`/?level=1`, { replace: true });
        }
      };

      fetchLatestPuzzleId();
    }
  }, [levelParam, navigate]);

  const handleLevelComplete = (level: number, stars: number) => {
    console.log(`Level ${level} completed with ${stars} stars`);
    // You could save this to user progress in the database if needed
  };

  return <GameBoard level={puzzleId} onLevelComplete={handleLevelComplete} />;
};

export default Index;
