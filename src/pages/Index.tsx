
import GameBoard from "@/components/GameBoard";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const Index = () => {
  const [puzzleId, setPuzzleId] = useState<number>(1);

  useEffect(() => {
    const fetchLatestPuzzleId = async () => {
      const { data, error } = await supabase
        .from('puzzle_levels')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setPuzzleId(data.id);
      }
    };

    fetchLatestPuzzleId();
  }, []);

  return <GameBoard level={puzzleId} />;
};

export default Index;
