
import React, { useEffect, useState } from 'react';
import { supabase, PlayerStats } from '../services/supabase';
import { ConfirmationModal } from './ConfirmationModal';

interface RegisteredPlayer {
  player_id: string;
  name: string;
  is_goalkeeper: boolean;
  stats: PlayerStats | null;
  avatar: string | null;
}

interface MatchPlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  currentUserId: string;
  currentUserIsGoalkeeper: boolean;
  onPlayerClick: (player: RegisteredPlayer) => void;
  onRefreshMatchList?: () => void;
}

export const MatchPlayersModal: React.FC<MatchPlayersModalProps> = ({ 
  isOpen, 
  onClose, 
  matchId, 
  currentUserId,
  currentUserIsGoalkeeper,
  onPlayerClick,
  onRefreshMatchList
}) => {
  const [players, setPlayers] = useState<RegisteredPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const MAX_PLAYERS = 14;
  const MAX_GOALKEEPERS = 2;
  const MAX_FIELD_PLAYERS = 12;

  const isUserRegistered = players.some(p => p.player_id === currentUserId);
  
  const gkCount = players.filter(p => p.is_goalkeeper).length;
  const fieldCount = players.length - gkCount;
  
  const isFull = players.length >= MAX_PLAYERS;
  const isGkFull = gkCount >= MAX_GOALKEEPERS;
  const isFieldFull = fieldCount >= MAX_FIELD_PLAYERS;

  const canUserJoin = currentUserIsGoalkeeper ? !isGkFull : !isFieldFull;
  const isBlockedByRole = !isUserRegistered && !isFull && !canUserJoin;

  useEffect(() => {
    if (!isOpen) {
      setPlayers([]);
      setLoading(false);
      return;
    }

    if (matchId) {
      fetchRegisteredPlayers();
    }
  }, [isOpen, matchId]);

  const fetchRegisteredPlayers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('match_players')
        .select(`
          player_id,
          players ( 
            name,
            is_goalkeeper,
            player_stats ( * ),
            avatar
          )
        `)
        .eq('match_id', matchId);

      if (error) throw error;

      const formatted = (data as any[]).map(item => {
        const rawStats = item.players?.player_stats;
        const stats = Array.isArray(rawStats) ? rawStats[0] : rawStats;

        return {
          player_id: item.player_id,
          name: item.players?.name || 'Jogador sem nome',
          is_goalkeeper: !!item.players?.is_goalkeeper,
          stats: stats || null,
          avatar: item.players?.avatar || null
        };
      });

      setPlayers(formatted);
    } catch (err) {
      console.error('Erro ao buscar inscritos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMatch = async () => {
    if (isUserRegistered || isFull || !canUserJoin || actionLoading) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('match_players')
        .insert([
          { 
            match_id: matchId, 
            player_id: currentUserId 
          }
        ]);

      if (error) throw error;
      
      await fetchRegisteredPlayers();
      if (onRefreshMatchList) onRefreshMatchList();
    } catch (err: any) {
      console.error('Erro ao entrar na partida:', err);
      alert('Erro ao entrar na partida: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveMatch = async () => {
    if (!isUserRegistered || actionLoading) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('match_players')
        .delete()
        .eq('match_id', matchId)
        .eq('player_id', currentUserId);

      if (error) throw error;
      
      setIsConfirmModalOpen(false);
      await fetchRegisteredPlayers();
      if (onRefreshMatchList) onRefreshMatchList();
    } catch (err: any) {
      console.error('Erro ao remover presença:', err);
      alert('Erro ao remover presença: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <div>
              <h2 className="text-xl font-bold text-white">Lista de Presença</h2>
              <div className="flex gap-3 mt-1">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isFieldFull ? 'text-red-400' : 'text-slate-400'}`}>
                  Linha: {fieldCount}/{MAX_FIELD_PLAYERS}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isGkFull ? 'text-orange-400' : 'text-slate-400'}`}>
                  Goleiros: {gkCount}/{MAX_GOALKEEPERS}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Carregando escalação...</p>
              </div>
            ) : players.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-slate-500 font-medium">Nenhum jogador confirmado ainda.</p>
              </div>
            ) : (
              players.map((p) => (
                <div 
                  key={p.player_id}
                  className={`flex flex-col p-4 ${p.player_id === currentUserId ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5' : 'bg-slate-800/40 border-slate-700/50'} border rounded-2xl group hover:border-emerald-500/30 transition-all cursor-pointer`}
                  onClick={() => onPlayerClick(p)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex items-center gap-3 overflow-hidden">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 ${p.is_goalkeeper ? 'bg-orange-500/20 text-orange-500 border border-orange-500/20' : 'bg-slate-800 text-slate-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 border border-slate-700/50 group-hover:border-emerald-500/20'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold block truncate group-hover:text-emerald-400 transition-colors">
                            {p.name}
                          </span>
                          {p.is_goalkeeper && (
                            <span className="text-[8px] font-black bg-orange-500 text-slate-950 px-1.5 py-0.5 rounded-md uppercase shrink-0">GK</span>
                          )}
                          {p.player_id === currentUserId && <span className="text-[10px] text-emerald-500 font-bold ml-1 shrink-0">(Você)</span>}
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Ficha completa</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center min-w-[50px] px-2 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg shrink-0">
                      <span className="text-emerald-500 font-black text-lg leading-none">
                        {p.stats?.overall ? Math.round(Number(p.stats.overall) * 20) : '--'}
                      </span>
                      <span className="text-[8px] font-black text-emerald-500/60 uppercase">OVR</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {!loading && (
            <div className="p-6 bg-slate-900 border-t border-slate-800 space-y-3">
              {isBlockedByRole && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-center">
                  <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest">
                    {currentUserIsGoalkeeper 
                      ? "Limite de 2 goleiros atingido nesta partida." 
                      : "Vagas de linha esgotadas. Restam apenas vagas para goleiros!"}
                  </p>
                </div>
              )}

              {isUserRegistered ? (
                <div className="flex flex-col gap-3">
                  <div className="w-full py-4 bg-emerald-500/10 text-emerald-500 font-black text-center rounded-2xl text-xs uppercase tracking-widest border border-emerald-500/20 shadow-inner">
                    Você já está confirmado! ⚽
                  </div>
                  <button
                    onClick={() => setIsConfirmModalOpen(true)}
                    disabled={actionLoading}
                    className="w-full py-4 bg-slate-800 hover:bg-red-500/10 border border-slate-700/50 hover:border-red-500/30 text-slate-400 hover:text-red-500 font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Desistir da Partida
                  </button>
                </div>
              ) : isFull ? (
                <div className="w-full py-4 bg-slate-800 text-slate-500 font-bold text-center rounded-2xl text-xs uppercase tracking-widest border border-slate-700/50">
                  Partida Lotada (14/14)
                </div>
              ) : (
                <button
                  onClick={handleJoinMatch}
                  disabled={actionLoading || !canUserJoin}
                  className={`w-full py-4 font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                    canUserJoin 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-emerald-600/20 active:scale-[0.98]' 
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {actionLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Confirmar Presença
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal 
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleLeaveMatch}
        isLoading={actionLoading}
        title="Remover Presença?"
        description="Você deixará de participar desta pelada. Tem certeza que deseja sair da lista?"
        confirmLabel="Sim, Sair agora"
        cancelLabel="Vou jogar!"
      />
    </>
  );
};
