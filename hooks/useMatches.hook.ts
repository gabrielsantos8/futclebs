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
    const isDev = import.meta.env.DEV;
    if (isDev) console.log('🗑️ Iniciando exclusão da partida:', matchId);

    // Verificação de autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      if (isDev) console.error('❌ Erro de autenticação:', authError);
      throw new Error('Você precisa estar logado para deletar partidas');
    }
    if (isDev) console.log('👤 Usuário autenticado:', user.id);

    // Verificação de super admin
    const superAdminIds = ['5e05a3d9-3a9a-4ad0-99f7-72315bbf5990', '64043e4d-79e3-4875-974d-4eafa3a23823'];
    const isSuperAdmin = superAdminIds.includes(user.id);
    if (isDev) console.log('🔐 É super admin?', isSuperAdmin, '| Seu ID:', user.id);

    if (!isSuperAdmin) {
      throw new Error('Acesso negado: apenas super admins podem deletar partidas');
    }

    // Deletar relacionamentos em ordem (de dependentes para independentes)
    if (isDev) console.log('🧹 Deletando comentários...');
    const { error: commentsError, data: commentsData } = await supabase
      .from('match_comments')
      .delete()
      .eq('match_id', matchId)
      .select();
    
    if (commentsError) {
      if (isDev) console.error('❌ Erro ao deletar comentários:', commentsError);
    } else {
      if (isDev) console.log('✅ Comentários deletados:', commentsData?.length || 0);
    }

    if (isDev) console.log('🧹 Deletando votos...');
    const { error: votesError, data: votesData } = await supabase
      .from('player_votes')
      .delete()
      .eq('match_id', matchId)
      .select();
    
    if (votesError) {
      if (isDev) console.error('❌ Erro ao deletar votos:', votesError);
    } else {
      if (isDev) console.log('✅ Votos deletados:', votesData?.length || 0);
    }

    if (isDev) console.log('🧹 Deletando resultados...');
    const { error: resultsError, data: resultsData } = await supabase
      .from('match_results')
      .delete()
      .eq('match_id', matchId)
      .select();
    
    if (resultsError) {
      if (isDev) console.error('❌ Erro ao deletar resultados:', resultsError);
    } else {
      if (isDev) console.log('✅ Resultados deletados:', resultsData?.length || 0);
    }

    if (isDev) console.log('🧹 Deletando jogadores...');
    const { error: playersError, data: playersData } = await supabase
      .from('match_players')
      .delete()
      .eq('match_id', matchId)
      .select();
    
    if (playersError) {
      if (isDev) console.error('❌ Erro ao deletar jogadores:', playersError);
    } else {
      if (isDev) console.log('✅ Jogadores deletados:', playersData?.length || 0);
    }

    // Finalmente, deletar a partida
    if (isDev) console.log('🗑️ Deletando partida principal...');
    const { error: matchError, data: matchData } = await supabase
      .from('matches')
      .delete()
      .eq('id', matchId)
      .select();

    if (matchError) {
      if (isDev) console.error('❌ Erro ao deletar partida:', matchError);
      throw new Error(`Erro ao deletar partida: ${matchError.message}`);
    }

    if (!matchData || matchData.length === 0) {
      if (isDev) console.error('⚠️ Partida não foi deletada (pode não existir ou sem permissão)');
      throw new Error('Falha ao deletar: A partida não foi encontrada ou você não tem permissão para deletá-la');
    }

    if (isDev) console.log('✅ Partida deletada com sucesso:', matchData);
    if (isDev) console.log('🎉 Exclusão concluída!');
  }, []);

  return {
    matches,
    fetchMatches,
    deleteMatch
  };
};

