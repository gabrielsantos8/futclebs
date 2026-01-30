
import React, { useState, useEffect } from 'react';
import { supabase, PlayerStats } from '../../../services/supabase.ts';

interface PlayerVoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  currentUserId: string;
  onRefresh: () => void;
}

interface VoteTarget {
  id: string;
  name: string;
  is_goalkeeper: boolean;
  avatar: string | null;
}

export const PlayerVoteModal: React.FC<PlayerVoteModalProps> = ({ isOpen, onClose, matchId, currentUserId, onRefresh }) => {
  const [playersToVote, setPlayersToVote] = useState<VoteTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [currentRatings, setCurrentRatings] = useState({
    velocidade: 3,
    finalizacao: 3,
    passe: 3,
    drible: 3,
    defesa: 3,
    fisico: 3
  });

  useEffect(() => {
    if (!isOpen) {
      setPlayersToVote([]);
      setLoading(false);
      setCurrentIndex(0);
      return;
    }

    if (matchId) loadPlayers();
  }, [isOpen, matchId]);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      // 1. Descobrir o time do usuário logado
      const { data: matchResult } = await supabase
        .from('match_results')
        .select('players_team_a, players_team_b')
        .eq('match_id', matchId)
        .maybeSingle();

      if (!matchResult) {
        setPlayersToVote([]);
        return;
      }

      const teamA = matchResult.players_team_a || [];
      const teamB = matchResult.players_team_b || [];
      
      const userTeamIds = teamA.includes(currentUserId) ? teamA : teamB.includes(currentUserId) ? teamB : [];

      if (userTeamIds.length === 0) {
        // Usuário não participou desta partida ou times não definidos
        setPlayersToVote([]);
        return;
      }

      // 2. Buscar participantes que são do mesmo time (excluindo o próprio usuário)
      const { data: participants } = await supabase
        .from('match_players')
        .select('player_id, players(name, is_goalkeeper, avatar)')
        .eq('match_id', matchId)
        .in('player_id', userTeamIds)
        .neq('player_id', currentUserId);

      // 3. Verificar quem já foi votado
      const { data: alreadyVoted } = await supabase
        .from('player_votes')
        .select('target_player_id')
        .eq('match_id', matchId)
        .eq('voter_id', currentUserId);

      const votedIds = new Set(alreadyVoted?.map(v => v.target_player_id) || []);
      
      if (participants) {
        const remaining = participants
          .filter((p: any) => !votedIds.has(p.player_id))
          .map((p: any) => ({
            id: p.player_id,
            name: p.players.name,
            is_goalkeeper: p.players.is_goalkeeper,
            avatar: p.players.avatar
          }));
        setPlayersToVote(remaining);
      }
    } catch (err) {
      console.error("Erro ao carregar jogadores para votação:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNextVote = async () => {
    if (submitting || playersToVote.length === 0) return;
    
    setSubmitting(true);
    const target = playersToVote[currentIndex];
    
    try {
      const ratingsToSubmit = {
        velocidade: currentRatings.velocidade,
        finalizacao: currentRatings.finalizacao,
        passe: currentRatings.passe,
        drible: currentRatings.drible,
        defesa: currentRatings.defesa,
        fisico: currentRatings.fisico
      };

      const { error } = await supabase.from('player_votes').insert({
        match_id: matchId,
        voter_id: currentUserId,
        target_player_id: target.id,
        ...ratingsToSubmit
      });

      if (error) throw error;

      if (currentIndex < playersToVote.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setCurrentRatings({
          velocidade: 3,
          finalizacao: 3,
          passe: 3,
          drible: 3,
          defesa: 3,
          fisico: 3
        });
        // Scroll to top of the content area
        const contentArea = document.getElementById('vote-content-area');
        if (contentArea) contentArea.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        onRefresh();
        onClose();
      }
    } catch (e: any) {
      console.error(e);
      alert("Erro ao salvar voto: " + (e.message || "Tente novamente"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishVoting = async () => {
    if (submitting) return;

    const remainingPlayers = playersToVote.slice(currentIndex);
    const confirmMsg = remainingPlayers.length > 1
      ? `Você ainda tem ${remainingPlayers.length} jogadores para avaliar. Deseja finalizar agora? Os votos restantes serão preenchidos com nota média (3 estrelas - 60 pts).`
      : 'Deseja finalizar a votação agora? Este jogador receberá nota média (3 estrelas - 60 pts).';

    if (!confirm(confirmMsg)) {
      return;
    }

    setSubmitting(true);

    try {
      // Criar votos com nota média (3) para todos os jogadores restantes
      const votesToInsert = remainingPlayers.map(player => ({
        match_id: matchId,
        voter_id: currentUserId,
        target_player_id: player.id,
        velocidade: 3,
        finalizacao: 3,
        passe: 3,
        drible: 3,
        defesa: 3,
        fisico: 3
      }));

      const { error } = await supabase
        .from('player_votes')
        .insert(votesToInsert);

      if (error) throw error;

      onRefresh();
      onClose();
    } catch (e: any) {
      console.error('Erro ao finalizar votação:', e);
      alert('Erro ao finalizar votação: ' + (e.message || 'Tente novamente'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentPlayer = playersToVote[currentIndex];

  const allAttributes = [
    { key: 'velocidade', label: 'Velocidade', icon: '⚡' },
    { key: 'finalizacao', label: 'Finalização', icon: '🎯' },
    { key: 'passe', label: 'Passe', icon: '⚽' },
    { key: 'drible', label: 'Drible', icon: '👟' },
    { key: 'defesa', label: 'Defesa', icon: '🛡️' },
    { key: 'fisico', label: 'Físico', icon: '💪' },
  ] as const;

  const visibleAttributes = currentPlayer?.is_goalkeeper
    ? allAttributes.filter(attr => attr.key === 'passe' || attr.key === 'defesa')
    : allAttributes;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-6 bg-black/98 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="w-full h-full md:h-auto md:max-w-2xl bg-slate-950 md:bg-slate-900 md:border md:border-slate-800 md:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl md:max-h-[90vh]">
        
        {/* Header com Progresso */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex-1">
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Avaliação do seu Time</h2>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${((currentIndex + 1) / (playersToVote.length || 1)) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase whitespace-nowrap">
                {playersToVote.length > 0 ? `${currentIndex + 1} de ${playersToVote.length}` : '0 de 0'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-3 ml-4 text-slate-500 hover:text-white hover:bg-slate-800 rounded-2xl transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div id="vote-content-area" className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar pb-32">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Localizando seus companheiros...</p>
            </div>
          ) : playersToVote.length === 0 ? (
            <div className="text-center py-20 space-y-6 max-w-sm mx-auto animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-emerald-500 border border-emerald-500/20 shadow-xl shadow-emerald-500/5">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <p className="text-white font-black uppercase text-lg tracking-tight">Tudo em ordem!</p>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed font-medium">Você já avaliou todos os jogadores do seu time ou ainda não jogou nesta partida.</p>
              </div>
              <button onClick={onClose} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all">Fechar Súmula</button>
            </div>
          ) : (
            <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-500">
              {/* Header do Jogador Atual */}
              <div className="text-center space-y-3">
                <div className="inline-flex flex-col items-center">
                   <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center text-3xl font-black text-white border border-slate-700/50 shadow-2xl mb-4 group-hover:scale-105 transition-transform">
                    {currentPlayer.avatar ? (
                      <img src={currentPlayer.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                    ) : ( 
                      <span className="text-white font-black text-xl sm:text-3xl">
                        {currentPlayer.avatar ? <img src={currentPlayer.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" /> : currentPlayer.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                   </div>
                   <h3 className="text-3xl font-black text-white tracking-tight">{currentPlayer.name}</h3>
                   <span className={`mt-2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    currentPlayer.is_goalkeeper 
                      ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' 
                      : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                  }`}>
                    {currentPlayer.is_goalkeeper ? '🛡️ Goleiro do Time' : '🏃 Jogador de Linha'}
                  </span>
                </div>
              </div>

              {/* Grid de Atributos - Responsivo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                {visibleAttributes.map(attr => (
                  <RatingRow 
                    key={attr.key}
                    label={attr.label}
                    icon={attr.icon}
                    value={currentRatings[attr.key as keyof typeof currentRatings]} 
                    onChange={v => setCurrentRatings(r => ({...r, [attr.key]: v}))} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Fixo */}
        {!loading && playersToVote.length > 0 && (
          <div className="p-6 md:p-8 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 space-y-3">
            <button
              onClick={handleNextVote}
              disabled={submitting}
              className="w-full max-w-md mx-auto block py-5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-sm uppercase tracking-widest rounded-[1.25rem] transition-all shadow-2xl shadow-emerald-600/30 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-6 h-6 border-3 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <>
                  <span>{currentIndex === playersToVote.length - 1 ? 'Concluir Avaliações' : 'Avaliar Próximo Jogador'}</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </>
              )}
            </button>

            {playersToVote.length > 1 && (
              <button
                onClick={handleFinishVoting}
                disabled={submitting}
                className="w-full max-w-md mx-auto block py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all border border-slate-700/50 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                title="Finalizar votação com notas médias (3 estrelas) para os jogadores restantes"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Finalizar Votação ({playersToVote.length - currentIndex} restantes)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const RatingRow: React.FC<{ label: string, icon: string, value: number, onChange: (v: number) => void }> = ({ label, icon, value, onChange }) => (
  <div className="flex flex-col gap-3 group">
    <div className="flex justify-between items-center px-1">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest group-focus-within:text-emerald-500 transition-colors">{label}</span>
      </div>
      <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-700/30">
        <span className="text-[11px] font-black text-emerald-500 tabular-nums">{value * 20} pts</span>
      </div>
    </div>
    <div className="flex justify-between gap-1.5 sm:gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          className={`flex-1 h-14 rounded-2xl border transition-all flex items-center justify-center relative active:scale-90 ${
            star <= value 
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500 shadow-lg shadow-emerald-500/5' 
              : 'bg-slate-800/30 border-slate-700/30 text-slate-700 hover:border-slate-600'
          }`}
        >
          <svg 
            className={`w-6 h-6 transition-all duration-300 ${star <= value ? 'fill-emerald-500 scale-110' : 'fill-none'}`} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      ))}
    </div>
  </div>
);
