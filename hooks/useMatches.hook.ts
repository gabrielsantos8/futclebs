import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { MatchWithExtras } from '../types/app.types';

export const useMatches = () => {
  const [matches, setMatches] = useState<MatchWithExtras[]>([]);

  const fetchMatches = useCallback(async (userId: string) => {
    try {
      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: false });

      if (!matchesData) return;

      const processedMatches = await Promise.all(
        matchesData.map(async (m) => {
          const { count } = await supabase
            .from('match_players')
            .select('*', { count: 'exact', head: true })
            .eq('match_id', m.id);

          const { data: userReg } = await supabase
            .from('match_players')
            .select('*')
            .eq('match_id', m.id)
            .eq('player_id', userId)
            .maybeSingle();

          let hasPendingVotes = false;

          if (m.status === 'finished' && userReg) {
            const { data: matchRes } = await supabase
              .from('match_results')
              .select('players_team_a, players_team_b')
              .eq('match_id', m.id)
              .maybeSingle();

            if (matchRes) {
              const teamA = matchRes.players_team_a || [];
              const teamB = matchRes.players_team_b || [];
              const allPlayerIds = [...teamA, ...teamB];

              const { data: existingPlayers } = await supabase
                .from('players')
                .select('id')
                .in('id', allPlayerIds);

              const existingPlayerIds = new Set(existingPlayers?.map(p => p.id) || []);

              const userTeamIds = teamA.includes(userId)
                ? teamA
                : teamB.includes(userId)
                ? teamB
                : [];

              const teammatesIds = userTeamIds.filter(
                id => id !== userId && existingPlayerIds.has(id)
              );

              if (teammatesIds.length > 0) {
                const { data: votes } = await supabase
                  .from('player_votes')
                  .select('target_player_id')
                  .eq('match_id', m.id)
                  .eq('voter_id', userId)
                  .in('target_player_id', teammatesIds);

                const votedIds = new Set(
                  votes?.map(v => v.target_player_id)
                    .filter(id => existingPlayerIds.has(id)) || []
                );

                hasPendingVotes = teammatesIds.some(tid => !votedIds.has(tid));
              }
            }
          }

          return {
            ...m,
            playerCount: count || 0,
            isUserRegistered: !!userReg,
            hasPendingVotes
          } as MatchWithExtras;
        })
      );

      setMatches(processedMatches);
    } catch (err) {
      console.error('Erro ao carregar partidas:', err);
    }
  }, []);

  const deleteMatch = useCallback(async (matchId: string) => {
    await supabase.from('match_comments').delete().eq('match_id', matchId);
    await supabase.from('player_votes').delete().eq('match_id', matchId);
    await supabase.from('match_results').delete().eq('match_id', matchId);
    await supabase.from('match_players').delete().eq('match_id', matchId);

    const { error } = await supabase.from('matches').delete().eq('id', matchId);
    if (error) throw error;
  }, []);

  return {
    matches,
    fetchMatches,
    deleteMatch
  };
};

