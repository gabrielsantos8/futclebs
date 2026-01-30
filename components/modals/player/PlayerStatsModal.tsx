
import React, { useState, useEffect } from 'react';
import { supabase, PlayerStats } from '../../../services/supabase.ts';

interface PlayerStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats | null;
  playerName: string;
  playerId: string;
  isGoalkeeper: boolean;
  onViewMatchSummary: (matchId: string) => void;
}

interface MatchHistoryItem {
  id: string;
  date: string;
  goalsA: number;
  goalsB: number;
  winner: 'A' | 'B' | 'draw' | null;
  userTeam: 'A' | 'B' | null;
  matchOvr: number; // OVR específico desta partida
}

export const PlayerStatsModal: React.FC<PlayerStatsModalProps> = ({ 
  isOpen, 
  onClose, 
  stats, 
  playerName, 
  playerId,
  isGoalkeeper, 
  onViewMatchSummary 
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'history'>('stats');
  const [history, setHistory] = useState<MatchHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setHistory([]);
      setLoadingHistory(false);
      return;
    }

    fetchHistory();
  }, [isOpen, playerId]);

  const fetchHistory = async () => {
    if (!playerId) return;
    setLoadingHistory(true);
    try {
      // 1. Buscar participações e resultados
      const { data: participations, error: pError } = await supabase
        .from('match_players')
        .select(`
          match_id,
          matches!inner (
            id,
            match_date,
            status,
            match_results (
              goals_team_a,
              goals_team_b,
              winner,
              players_team_a
            )
          )
        `)
        .eq('player_id', playerId)
        .eq('matches.status', 'finished');

      if (pError) throw pError;

      // 2. Buscar todos os votos recebidos pelo jogador para calcular o OVR por partida
      const { data: votes, error: vError } = await supabase
        .from('player_votes')
        .select('*')
        .eq('target_player_id', playerId);

      if (vError) throw vError;

      if (participations) {
        const formattedHistory = participations
          .map((participation: any) => {
            const m = participation.matches;
            if (!m) return null;

            const res = Array.isArray(m.match_results) ? m.match_results[0] : m.match_results;
            if (!res) return null;

            const playersA = res.players_team_a || [];
            const userTeam = playersA.includes(playerId) ? 'A' : 'B';
            
            // Calcular OVR desta partida específica baseada nos votos recebidos nela
            const matchVotes = votes?.filter(v => v.match_id === m.id) || [];
            let matchOvr = 0;

            if (matchVotes.length > 0) {
              const avgs = matchVotes.map(v => {
                const attrs = isGoalkeeper 
                  ? [v.passe, v.defesa]
                  : [v.velocidade, v.finalizacao, v.passe, v.drible, v.defesa, v.fisico];
                const valid = attrs.filter(val => val > 0);
                return (valid.reduce((a, b) => a + b, 0) / (valid.length || 1)) * 20;
              });
              matchOvr = avgs.reduce((a, b) => a + b, 0) / avgs.length;
            } else {
              // Se não houver votos na partida, usamos o overall atual como fallback ou 0
              matchOvr = (stats?.overall || 0) * 20;
            }
            
            return {
              id: m.id,
              date: m.match_date,
              goalsA: res.goals_team_a,
              goalsB: res.goals_team_b,
              winner: res.winner,
              userTeam: userTeam,
              matchOvr: matchOvr
            } as MatchHistoryItem;
          })
          .filter((item): item is MatchHistoryItem => item !== null)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Ordem cronológica para o gráfico
        
        setHistory(formattedHistory);
      }
    } catch (e) {
      console.error("Erro ao carregar histórico:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!isOpen) return null;

  const SCALING = 20;

  const allStatItems = [
    { label: 'Velocidade', value: (stats?.velocidade || 0) * SCALING, color: 'bg-blue-500', key: 'VEL' },
    { label: 'Finalização', value: (stats?.finalizacao || 0) * SCALING, color: 'bg-red-500', key: 'FIN' },
    { label: 'Passe', value: (stats?.passe || 0) * SCALING, color: 'bg-emerald-500', key: 'PAS' },
    { label: 'Drible', value: (stats?.drible || 0) * SCALING, color: 'bg-yellow-500', key: 'DRI' },
    { label: 'Defesa', value: (stats?.defesa || 0) * SCALING, color: 'bg-slate-500', key: 'DEF' },
    { label: 'Físico', value: (stats?.fisico || 0) * SCALING, color: 'bg-orange-500', key: 'FIS' },
  ];

  const statItems = isGoalkeeper 
    ? allStatItems.filter(item => item.key === 'PAS' || item.key === 'DEF')
    : allStatItems;

  // Preparar dados para o gráfico baseados no histórico real (máximo 7 pontos para não poluir)
  const chartData = history.slice(-7).map(item => ({
    label: new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    val: item.matchOvr
  }));

  const maxVal = 100;
  const chartHeight = 120;
  const chartWidth = 400;

  const points = chartData.length > 1 
    ? chartData.map((d, i) => {
        const x = (i / (chartData.length - 1)) * chartWidth;
        const y = chartHeight - (d.val / maxVal) * chartHeight;
        return `${x},${y}`;
      }).join(' ')
    : chartData.length === 1 
      ? `0,${chartHeight - (chartData[0].val / maxVal) * chartHeight} ${chartWidth},${chartHeight - (chartData[0].val / maxVal) * chartHeight}`
      : "";

  const fillPoints = chartData.length > 1 
    ? `0,${chartHeight} ${points} ${chartWidth},${chartHeight}`
    : "";

  const getResultBadge = (item: MatchHistoryItem) => {
    if (item.winner === 'draw') return { label: 'Empate', color: 'bg-slate-800 text-slate-400 border-slate-700/50' };
    const won = item.winner === item.userTeam;
    return won 
      ? { label: 'Vitória', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' }
      : { label: 'Derrota', color: 'bg-red-500/10 text-red-500 border-red-500/30' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full h-full md:h-auto md:max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[95vh] md:max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{playerName}</h2>
              {isGoalkeeper && (
                <span className="text-[10px] font-black bg-orange-500 text-slate-950 px-2 py-0.5 rounded-md uppercase">Goleiro</span>
              )}
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Perfil do Atleta</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-2 bg-slate-800/30 m-4 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === 'stats' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-500 hover:text-slate-200'
            }`}
          >
            Atributos
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === 'history' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-500 hover:text-slate-200'
            }`}
          >
            Histórico ({history.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 pt-2 overflow-y-auto custom-scrollbar flex-1">
          {activeTab === 'stats' ? (
            <div className="space-y-8 pb-4">
              {/* Overall Display */}
              <div className="flex items-center justify-center py-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-8 border-emerald-500/20 flex items-center justify-center">
                    <span className="text-5xl font-black text-white">{stats?.overall ? Math.round(Number(stats.overall) * SCALING) : 0}</span>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                    Overall
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {statItems.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 px-1">
                      <span>{item.label}</span>
                      <span className="text-white">{Math.round(item.value)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} transition-all duration-1000 ease-out`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-800/50">
                <h3 className="text-[10px] font-black uppercase text-slate-500 mb-6 tracking-widest text-center">Evolução em Partidas</h3>
                {chartData.length > 0 ? (
                  <div className="relative h-[160px] w-full flex flex-col justify-end">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-[120px] overflow-visible" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <polygon points={fillPoints} fill="url(#chartGradient)" />
                      <polyline fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      {chartData.map((d, i) => (
                        <circle 
                          key={i} 
                          cx={chartData.length > 1 ? (i / (chartData.length - 1)) * chartWidth : chartWidth / 2} 
                          cy={chartHeight - (d.val / maxVal) * chartHeight} 
                          r="4" 
                          fill="#10b981" 
                          stroke="#0f172a" 
                          strokeWidth="2" 
                        />
                      ))}
                    </svg>
                    <div className="flex justify-between mt-4 px-1">
                      {chartData.map((d, i) => <span key={i} className="text-[9px] font-black text-slate-500 uppercase">{d.label}</span>)}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 opacity-20">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Aguardando primeira partida oficial...</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3 pb-6">
              {loadingHistory ? (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resgatando memórias...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-20 bg-slate-800/20 rounded-3xl border border-dashed border-slate-800">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-600">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-400 font-bold text-sm">Nenhuma partida registrada ainda.</p>
                  <p className="text-slate-600 text-[10px] mt-1 font-black uppercase tracking-wider">Aparecerá aqui após seu primeiro jogo!</p>
                </div>
              ) : (
                [...history].reverse().map((item) => {
                  const badge = getResultBadge(item);
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => onViewMatchSummary(item.id)}
                      className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-2xl flex items-center justify-between group hover:border-emerald-500/50 hover:bg-slate-800/60 transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <div className="flex flex-col gap-1.5 flex-1">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                          {new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border transition-colors ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="text-white font-bold text-sm truncate max-w-[120px] sm:max-w-none">Pelada Clebinho</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-baseline gap-1 justify-end">
                            <span className={`text-2xl font-black ${item.userTeam === 'A' ? 'text-white' : 'text-slate-500'}`}>{item.goalsA}</span>
                            <span className="text-[10px] font-black text-slate-700 italic mx-0.5">X</span>
                            <span className={`text-2xl font-black ${item.userTeam === 'B' ? 'text-white' : 'text-slate-500'}`}>{item.goalsB}</span>
                          </div>
                          <p className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">
                             Time {item.userTeam}
                          </p>
                        </div>
                        
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-emerald-500 group-hover:bg-emerald-500/10 transition-all shrink-0">
                          <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
