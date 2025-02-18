
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = React.useState<any>(null);

  React.useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('game_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-game-muted to-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Player Dashboard</h1>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>Current Level: {stats?.current_level || 1}</p>
                <p>Puzzles Completed: {stats?.puzzles_completed || 0}</p>
                <p>Best Time: {stats?.best_time ? `${stats.best_time}s` : 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Global Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>Global Average Time: {stats?.global_avg_time ? `${stats.global_avg_time}s` : 'N/A'}</p>
                <p>Your Ranking: {stats?.ranking || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button onClick={() => navigate('/')} className="mt-6">
          Play Game
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
