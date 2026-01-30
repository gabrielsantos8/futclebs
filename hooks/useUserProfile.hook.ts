import { useState, useCallback } from 'react';
import { supabase, Player, PlayerStats } from '../services/supabase';

export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState<Player | null>(null);
  const [userStats, setUserStats] = useState<PlayerStats | null>(null);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data: player, error: profileError } = await supabase
        .from('players')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      if (player) {
        setUserProfile(player);
        const { data: stats } = await supabase
          .from('player_stats')
          .select('*')
          .eq('player_id', userId)
          .maybeSingle();

        if (stats) setUserStats(stats);
      } else {
        setUserProfile(null);
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
      setUserProfile(null);
    }
  }, []);

  const updateUserProfile = useCallback((updates: Partial<Player>) => {
    setUserProfile(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  return {
    userProfile,
    userStats,
    fetchUserProfile,
    updateUserProfile,
    setUserProfile,
    setUserStats
  };
};

