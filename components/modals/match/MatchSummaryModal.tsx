
import React, { useState, useEffect } from 'react';
import { supabase, Player, PlayerStats, MatchResult } from '@/services/supabase';
import { SUPER_ADMIN_IDS } from '@/constants/app.constants';

interface MatchSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  currentUserId?: string;
  isAdmin?: boolean;
}

interface DetailedVote {
  id: string;
  voterName?: string;
  velocidade: number;
  finalizacao: number;
  passe: number;
  drible: number;
  defesa: number;
  fisico: number;
  average: number;
}

interface PlayerWithStats extends Player {
  stats?: PlayerStats;
  matchRating?: number;
  votesCount?: number;
  individualVotes?: DetailedVote[];
}

export const MatchSummaryModal: React.FC<MatchSummaryModalProps> = ({ isOpen, onClose, matchId, currentUserId, isAdmin }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roster' | 'ratings'>('roster');
  const [result, setResult] = useState<MatchResult | null>(null);
  const [teams, setTeams] = useState<{ teamA: PlayerWithStats[], teamB: PlayerWithStats[] } | null>(null);
  const [playerRatings, setPlayerRatings] = useState<PlayerWithStats[]>([]);
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [allVoted, setAllVoted] = useState(false);
  const [voterStats, setVoterStats] = useState({ current: 0, total: 0 });

  const isSuperUser = currentUserId ? SUPER_ADMIN_IDS.includes(currentUserId) : false;

  useEffect(() => {
    if (!isOpen) {
      setTeams(null);
      setPlayerRatings([]);
      setResult(null);
      setLoading(false);
      setActiveTab('roster');
      setExpandedPlayer(null);
      return;
    }

    if (matchId) {
      loadSummary();
      setActiveTab('roster');
      setExpandedPlayer(null);
    }
  }, [isOpen, matchId]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      // 1. Carregar Resultado e Times
      const { data: resultData } = await supabase
        .from('match_results')
        .select('*')
        .eq('match_id', matchId)
        .maybeSingle();

      if (resultData) {
        setResult(resultData);
        
        const allIds = [...(resultData.players_team_a || []), ...(resultData.players_team_b || [])];
        if (allIds.length > 0) {
          const { data: playersData } = await supabase
            .from('players')
            .select('*, player_stats(*)')
            .in('id', allIds);

          if (playersData) {
            const formatted: PlayerWithStats[] = playersData.map((p: any) => ({
              ...p,
              stats: Array.isArray(p.player_stats) ? p.player_stats[0] : p.player_stats
            }));

            const teamA = resultData.players_team_a.map((id: string) => formatted.find(p => p.id === id)).filter(Boolean);
            const teamB = resultData.players_team_b.map((id: string) => formatted.find(p => p.id === id)).filter(Boolean);
            setTeams({ teamA, teamB });

            // 2. Carregar TODOS os Votos da Partida
            const { data: votesData } = await supabase
              .from('player_votes')
              .select('*, voter:players!voter_id(name)')
              .eq('match_id', matchId);

             const { count: totalRegistered } = await supabase
              .from('match_players')
              .select('*', { count: 'exact', head: true })
              .eq('match_id', matchId);

            const uniqueVoters = new Set(votesData?.map(v => v.voter_id) || []);
            const hasAllVoted = uniqueVoters.size >= (totalRegistered || 0);

            setAllVoted(hasAllVoted);
            setVoterStats({ current: uniqueVoters.size, total: totalRegistered || 0 });


            if (votesData) {
              const ratings = formatted.map(player => {
                const playerVotes = votesData.filter(v => v.target_player_id === player.id);
                
                const individualVotes: DetailedVote[] = playerVotes.map(v => {
                  const attrs = player.is_goalkeeper 
                    ? [v.passe, v.defesa]
                    : [v.velocidade, v.finalizacao, v.passe, v.drible, v.defesa, v.fisico];
                  
                  const validAttrs = attrs.filter(val => val > 0);
                  const avg = validAttrs.reduce((s, val) => s + val, 0) / (validAttrs.length || 1);
                  
                  return {
                    id: v.id,
                    voterName: (v as any).voter?.name,
                    velocidade: v.velocidade,
                    finalizacao: v.finalizacao,
                    passe: v.passe,
                    drible: v.drible,
                    defesa: v.defesa,
                    fisico: v.fisico,
                    average: avg * 20
                  };
                });

                const matchRating = individualVotes.length > 0 
                  ? individualVotes.reduce((acc, v) => acc + v.average, 0) / individualVotes.length 
                  : 0;

                return {
                  ...player,
                  matchRating,
                  votesCount: individualVotes.length,
                  individualVotes
                };
              }).sort((a, b) => (b.matchRating || 0) - (a.matchRating || 0));

              setPlayerRatings(ratings);
            }
          }
        }
      }
    } catch (e) {
      console.error("Erro ao carregar resumo:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 md:p-4 bg-black/98 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="w-full h-full md:h-auto md:max-w-4xl bg-slate-900 md:border md:border-slate-800 md:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl max-h-screen md:max-h-[95vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Súmula da Partida</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Placar e Notas {isSuperUser ? 'Detalhadas' : 'Anônimas'}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Processando estatísticas...</p>
            </div>
          ) : !result ? (
            <div className="text-center py-20">
              <p className="text-slate-500 font-bold uppercase text-xs">Aguardando definição do placar.</p>
            </div>
          ) : (
             <>
              {/* Placar */}
              <div className="bg-slate-950/20 p-8 border-b border-slate-800/50">
                <div className="flex flex-col items-center gap-6">
                  <div className="flex items-center gap-6 sm:gap-12">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-emerald-500 uppercase mb-2 tracking-widest">Time A</p>
                      <span className="text-7xl font-black text-white tabular-nums">{result.goals_team_a}</span>
                    </div>
                    <div className="text-2xl font-black text-slate-700 italic mt-6">X</div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-blue-500 uppercase mb-2 tracking-widest">Time B</p>
                      <span className="text-7xl font-black text-white tabular-nums">{result.goals_team_b}</span>
                    </div>
                  </div>
                  <div className={`px-6 py-2 rounded-2xl border font-black uppercase tracking-widest text-xs ${
                    result.winner === 'A' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                    result.winner === 'B' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                    'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    {result.winner === 'A' ? '🏆 Time A Venceu' : result.winner === 'B' ? '🏆 Time B Venceu' : '🤝 Empate'}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex p-2 gap-2 bg-slate-800/20 m-6 rounded-2xl border border-slate-800/50">
                <button
                  onClick={() => setActiveTab('roster')}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                    activeTab === 'roster' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Escalações
                </button>
                <button
                  onClick={() => setActiveTab('ratings')}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                    activeTab === 'ratings' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Avaliações ({playerRatings.reduce((acc, p) => acc + (p.votesCount || 0), 0)})
                </button>
              </div>

              {/* Views */}
              <div className="px-6 pb-12">
                {activeTab === 'roster' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
                    <TeamList title="Time A" players={teams?.teamA || []} color="emerald" />
                    <TeamList title="Time B" players={teams?.teamB || []} color="blue" />
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-500">
                    {!allVoted && !isSuperUser ? (
                      <div className="py-20 text-center space-y-6 max-w-sm mx-auto animate-in zoom-in">
                        <div className="w-20 h-20 bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto text-slate-600 border border-slate-700/50">
                           <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                           </svg>
                        </div>
                        <div>
                          <h3 className="text-white font-black uppercase text-lg">Notas Bloqueadas</h3>
                          <p className="text-slate-500 text-xs mt-2 leading-relaxed font-medium px-4">
                            As avaliações só serão reveladas quando todos os {voterStats.total} jogadores confirmados tiverem enviado seus votos.
                          </p>
                        </div>
                        <div className="space-y-2 px-8">
                          <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 px-1">
                            <span>Votação em Andamento</span>
                            <span>{voterStats.current} / {voterStats.total}</span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 transition-all duration-1000" 
                              style={{ width: `${(voterStats.current / (voterStats.total || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Ranking de Performance</h3>
                          <span className="text-[9px] font-bold text-slate-600 uppercase">
                            {isSuperUser ? 'Visualização completa de Super Admin' : 'Votos são 100% anônimos'}
                          </span>
                        </div>
                        
                        {playerRatings.length === 0 ? (
                          <div className="py-20 text-center opacity-30">
                            <p className="text-xs font-black uppercase">Nenhuma avaliação realizada.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {playerRatings.map((p, idx) => (
                              <div 
                                key={p.id} 
                                className={`bg-slate-800/30 border rounded-2xl transition-all overflow-hidden ${
                                  expandedPlayer === p.id ? 'border-emerald-500' : 'border-slate-700/50 hover:border-emerald-500/30'
                                }`}
                              >
                                <div 
                                  onClick={() => setExpandedPlayer(expandedPlayer === p.id ? null : p.id)}
                                  className="p-4 flex items-center justify-between cursor-pointer active:bg-slate-800/50"
                                >
                                  <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                      idx === 0 ? 'bg-yellow-400 text-slate-950' : 
                                      idx === 1 ? 'bg-slate-300 text-slate-950' :
                                      idx === 2 ? 'bg-amber-700 text-white' :
                                      'bg-slate-800 text-slate-500'
                                    }`}>
                                      {idx + 1}º
                                    </div>
                                    <div className="overflow-hidden">
                                      <p className="text-white font-bold text-sm truncate">{p.name}</p>
                                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                        {p.votesCount} {p.votesCount === 1 ? 'Avaliação recebida' : 'Avaliações recebidas'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 shrink-0">
                                    <div className="text-right">
                                      <div className="flex items-baseline justify-end gap-1">
                                        <span className="text-xl font-black text-emerald-500 tabular-nums">
                                          {p.matchRating ? Math.round(p.matchRating) : '--'}
                                        </span>
                                        <span className="text-[8px] font-black text-emerald-500/60 uppercase">MÉDIA</span>
                                      </div>
                                    </div>
                                    <svg 
                                      className={`w-4 h-4 text-slate-600 transition-transform ${expandedPlayer === p.id ? 'rotate-180' : ''}`} 
                                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </div>
                                </div>

                                {/* Detalhamento dos Votos */}
                                {expandedPlayer === p.id && (
                                  <div className="bg-slate-950/50 border-t border-slate-800/50 p-4 animate-in slide-in-from-top-2">
                                    <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4">Detalhamento dos Votos Recebidos</h4>
                                    <div className="space-y-3">
                                      {p.individualVotes?.map((vote, vIdx) => (
                                        <div key={vote.id} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
                                          <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-2">
                                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                              <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avaliação #{vIdx + 1}</span>
                                                {isSuperUser && vote.voterName && (
                                                  <span className="text-[9px] font-black text-emerald-500/80 uppercase">Votado por: {vote.voterName}</span>
                                                )}
                                              </div>
                                            </div>
                                            <span className="text-xs font-black text-white px-2 py-0.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">{Math.round(vote.average)} pts</span>
                                          </div>
                                          <div className={`grid ${p.is_goalkeeper ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'} gap-2`}>
                                            {!p.is_goalkeeper && <MiniStat label="VEL" value={vote.velocidade} />}
                                            {!p.is_goalkeeper && <MiniStat label="FIN" value={vote.finalizacao} />}
                                            <MiniStat label="PAS" value={vote.passe} />
                                            {!p.is_goalkeeper && <MiniStat label="DRI" value={vote.drible} />}
                                            <MiniStat label="DEF" value={vote.defesa} />
                                            {!p.is_goalkeeper && <MiniStat label="FIS" value={vote.fisico} />}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const MiniStat = ({ label, value }: { label: string, value: number }) => {
  if (value === 0) return null;
  return (
    <div className="flex items-center justify-between bg-slate-950/40 px-2 py-1.5 rounded-lg border border-slate-800/50">
      <span className="text-[8px] font-black text-slate-600 uppercase">{label}</span>
      <span className="text-[10px] font-black text-white tabular-nums">{value * 20}</span>
    </div>
  );
};

const TeamList = ({ title, players, color }: { title: string, players: PlayerWithStats[], color: 'emerald' | 'blue' }) => (
  <div className="space-y-4">
    <h3 className={`font-black uppercase text-[10px] tracking-widest ${color === 'emerald' ? 'text-emerald-500' : 'text-blue-500'}`}>{title}</h3>
    <div className="grid gap-2">
      {players.map(p => (
        <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${p.is_goalkeeper ? 'bg-orange-500/20 text-orange-500' : 'bg-slate-700 text-slate-400'}`}>
            {p.is_goalkeeper ? 'GK' : 'PL'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{p.name}</p>
          </div>
          <div className="px-2 py-1 bg-slate-900/60 rounded-lg border border-slate-800 text-emerald-500 font-black text-[10px]">
            {Math.round((p.stats?.overall || 0) * 20)}
          </div>
        </div>
      ))}
    </div>
  </div>
);
