
import React, { useState, useEffect } from 'react';
import { supabase, Player, PlayerStats } from '../../../services/supabase.ts';
import { calculateByPosition } from '@/utils/overall.utils.ts';

interface TeamSortingModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  isAdmin: boolean;
}

interface PlayerWithStats extends Player {
  stats?: PlayerStats;
}

export const TeamSortingModal: React.FC<TeamSortingModalProps> = ({ isOpen, onClose, matchId, isAdmin }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [teams, setTeams] = useState<{ teamA: PlayerWithStats[], teamB: PlayerWithStats[] } | null>(null);
  const [noTeamsDefined, setNoTeamsDefined] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTeams(null);
      setNoTeamsDefined(false);
      setLoading(false);
      setIsLocked(true);
      return;
    }

    if (matchId) checkExistingAndLoad();
  }, [isOpen, matchId]);

  const checkExistingAndLoad = async () => {
    setLoading(true);
    setNoTeamsDefined(false);
    try {
      const { data: existingResult } = await supabase
        .from('match_results')
        .select('*')
        .eq('match_id', matchId)
        .maybeSingle();

      if (existingResult && existingResult.players_team_a && existingResult.players_team_a.length > 0) {
        const allIds = [...existingResult.players_team_a, ...existingResult.players_team_b];
        const { data: playersData } = await supabase
          .from('players')
          .select('*, player_stats(velocidade, finalizacao, passe, drible, defesa, fisico, esportividade)')
          .in('id', allIds);

        if (playersData) {
          const formattedPlayers: PlayerWithStats[] = playersData.map((p: any) => ({
            ...p,
             stats: p.player_stats ? {...p.player_stats, overall: calculateByPosition(p, p.player_stats)} : null,
          }));

          const teamA = existingResult.players_team_a.map((id: string) => formattedPlayers.find(p => p.id === id)).filter(Boolean);
          const teamB = existingResult.players_team_b.map((id: string) => formattedPlayers.find(p => p.id === id)).filter(Boolean);

          setTeams({ teamA, teamB });
          setIsLocked(true);
        }
      } else {
        if (isAdmin) {
          await fetchAndSort();
          setIsLocked(false);
        } else {
          setNoTeamsDefined(true);
        }
      }
    } catch (e) {
      console.error("Erro ao carregar times:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAndSort = async () => {
    setLoading(true);
    try {
      const { data: roster } = await supabase.from('match_players').select('players(*, player_stats(*))').eq('match_id', matchId);
      if (!roster) return;

      const players: PlayerWithStats[] = roster.map((r: any) => ({
        ...r.players,
         stats: r.players.player_stats ? {...r.players.player_stats, overall: calculateByPosition(r.players, r.players.player_stats)} : null,
      }));

      sortTeams(players);
    } finally { setLoading(false); }
  };

  const sortTeams = (pool: PlayerWithStats[]) => {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    const gks = shuffled.filter(p => p.is_goalkeeper);
    const field = shuffled.filter(p => !p.is_goalkeeper);

    const teamA: PlayerWithStats[] = [];
    const teamB: PlayerWithStats[] = [];

    // Distribui goleiros alternadamente
    gks.forEach((gk, i) => i % 2 === 0 ? teamA.push(gk) : teamB.push(gk));

    // Função para contar jogadores de cada posição em um time
    const getPositionCount = (team: PlayerWithStats[], position: string) => {
      return team.filter(p => p.positions && p.positions.includes(position)).length;
    };

    // Função para calcular distância da formação ideal (2-1-2)
    const getFormationDistance = (team: PlayerWithStats[]) => {
      const posCount = {
        Ataque: getPositionCount(team, 'Ataque'),
        Meio: getPositionCount(team, 'Meio'),
        Defesa: getPositionCount(team, 'Defesa')
      };

      // Formação ideal: 2 atacantes, 1 meio, 2 defensores
      return Math.pow(posCount.Ataque - 2, 2) +
             Math.pow(posCount.Meio - 1, 2) +
             Math.pow(posCount.Defesa - 2, 2);
    };

    // Função para determinar a posição principal de um jogador
    const getPrimaryPosition = (player: PlayerWithStats): String | null => {
      if (!player.positions || player.positions.length === 0) return null;
      // Se tiver 2 posições, prioriza a primeira
      return player.positions[0];
    };

    // Separa jogadores por posição
    const attackers = field.filter(p => getPrimaryPosition(p) === 'Ataque');
    const midfielders = field.filter(p => getPrimaryPosition(p) === 'Meio');
    const defenders = field.filter(p => getPrimaryPosition(p) === 'Defesa');
    const noPosition = field.filter(p => !getPrimaryPosition(p));

    // Ordena cada grupo por overall
    attackers.sort((a, b) => (b.stats?.overall || 0) - (a.stats?.overall || 0));
    midfielders.sort((a, b) => (b.stats?.overall || 0) - (a.stats?.overall || 0));
    defenders.sort((a, b) => (b.stats?.overall || 0) - (a.stats?.overall || 0));
    noPosition.sort((a, b) => (b.stats?.overall || 0) - (a.stats?.overall || 0));

    // Função para adicionar jogador ao time que mais precisa daquela posição
    const addPlayerByPosition = (players: PlayerWithStats[], targetPosition: string) => {
      players.forEach(player => {
        const countA = getPositionCount(teamA, targetPosition);
        const countB = getPositionCount(teamB, targetPosition);

        if (countA < countB) {
          teamA.push(player);
        } else if (countB < countA) {
          teamB.push(player);
        } else {
          // Se estão empatados, adiciona ao time com menor distância da formação ideal
          const tempA = [...teamA, player];
          const tempB = [...teamB, player];

          const distanceA = getFormationDistance(tempA);
          const distanceB = getFormationDistance(tempB);

          if (distanceA <= distanceB) {
            teamA.push(player);
          } else {
            teamB.push(player);
          }
        }
      });
    };

    // Distribui jogadores por posição: Atacantes, Meio-campistas, Defensores
    addPlayerByPosition(attackers, 'Ataque');
    addPlayerByPosition(midfielders, 'Meio');
    addPlayerByPosition(defenders, 'Defesa');

    // Distribui jogadores sem posição definida tentando completar a formação ideal
    noPosition.forEach(player => {
      const countAtaqueA = getPositionCount(teamA, 'Ataque');
      const countMeioA = getPositionCount(teamA, 'Meio');
      const countDefesaA = getPositionCount(teamA, 'Defesa');

      const countAtaqueB = getPositionCount(teamB, 'Ataque');
      const countMeioB = getPositionCount(teamB, 'Meio');
      const countDefesaB = getPositionCount(teamB, 'Defesa');

      // Verifica qual time está mais distante da formação ideal
      const needsA = {
        ataque: Math.max(0, 2 - countAtaqueA),
        meio: Math.max(0, 1 - countMeioA),
        defesa: Math.max(0, 2 - countDefesaA)
      };

      const needsB = {
        ataque: Math.max(0, 2 - countAtaqueB),
        meio: Math.max(0, 1 - countMeioB),
        defesa: Math.max(0, 2 - countDefesaB)
      };

      const totalNeedsA = needsA.ataque + needsA.meio + needsA.defesa;
      const totalNeedsB = needsB.ataque + needsB.meio + needsB.defesa;

      if (totalNeedsA > totalNeedsB) {
        teamA.push(player);
      } else if (totalNeedsB > totalNeedsA) {
        teamB.push(player);
      } else {
        // Se estão iguais, adiciona ao time com menos jogadores
        if (teamA.length <= teamB.length) {
          teamA.push(player);
        } else {
          teamB.push(player);
        }
      }
    });

    setTeams({ teamA, teamB });
  };

  const handleMovePlayer = (playerId: string, from: 'teamA' | 'teamB') => {
    if (!teams || isLocked || !isAdmin) return;

    const to = from === 'teamA' ? 'teamB' : 'teamA';
    const playerToMove = teams[from].find(p => p.id === playerId);
    
    if (!playerToMove) return;

    setTeams({
      ...teams,
      [from]: teams[from].filter(p => p.id !== playerId),
      [to]: [...teams[to], playerToMove]
    });
  };

  const handleSave = async () => {
    if (!teams || saving || isLocked || !isAdmin) return;
    setSaving(true);
    try {
      await supabase.from('match_results').upsert({
        match_id: matchId,
        players_team_a: teams.teamA.map(p => p.id),
        players_team_b: teams.teamB.map(p => p.id),
        goals_team_a: 0,
        goals_team_b: 0
      });
      setSaveSuccess(true);
      setTimeout(() => { 
        setSaveSuccess(false); 
        setIsLocked(true);
      }, 1500);
    } finally { setSaving(false); }
  };

  const handleCopyToClipboard = () => {
    if (!teams) return;

    const formatTeam = (title: string, players: PlayerWithStats[], emoji: string) => {
      const playerList = players
        .map(p => `- ${p.name}${p.is_goalkeeper ? ' *(GK)*' : ''}`)
        .join('\n');
      return `*${emoji} ${title.toUpperCase()}*\n${playerList}`;
    };

    const text = `⚽ *ESCALAÇÃO FUTLEBS* ⚽\n\n${formatTeam('Time A', teams.teamA, '🟢')}\n\n${formatTeam('Time B', teams.teamB, '🔵')}\n\n_Gerado por FutClebs_`;

    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch(err => {
      console.error('Erro ao copiar:', err);
      alert('Não foi possível copiar para a área de transferência.');
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-4 bg-black/95 backdrop-blur-xl animate-in zoom-in duration-300">
      <div className="w-full h-full md:h-auto md:max-w-6xl bg-slate-950 md:bg-slate-900 md:border md:border-slate-800 md:rounded-[2.5rem] overflow-hidden flex flex-col max-h-screen md:max-h-[90vh] shadow-2xl">
        
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Escalação da Partida</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Confira a divisão das equipes</p>
            </div>
            {isLocked && teams && (
              <span className="px-2 py-1 bg-slate-800 text-slate-400 rounded-lg text-[8px] font-black uppercase border border-slate-700">Modo Leitura</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {teams && (
              <button 
                onClick={handleCopyToClipboard}
                className={`p-3 rounded-xl transition-all flex items-center gap-2 group ${copySuccess ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                title="Copiar para WhatsApp"
              >
                {copySuccess ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                )}
                <span className="text-[10px] font-black uppercase hidden sm:inline">{copySuccess ? 'Copiado!' : 'Copiar Escalação'}</span>
              </button>
            )}
            {isLocked && isAdmin && teams && (
              <button 
                onClick={() => setIsLocked(false)}
                className="p-3 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-xl hover:bg-orange-500 hover:text-slate-950 transition-all"
                title="Desbloquear para edição"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-32">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Processando equipes...</p>
            </div>
          ) : noTeamsDefined ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
              <div className="w-20 h-20 bg-slate-800/50 rounded-[1.5rem] flex items-center justify-center text-slate-600 border border-slate-800">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <div>
                <h3 className="text-white font-black uppercase text-lg">Aguardando Escalação</h3>
                <p className="text-slate-500 text-xs mt-2 max-w-xs mx-auto font-medium">O administrador ainda não definiu os times para esta partida. Volte em breve!</p>
              </div>
            </div>
          ) : teams && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
              {(isLocked || !isAdmin) && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] z-0">
                   <svg className="w-96 h-96 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>
                </div>
              )}
              <TeamColumn 
                title="Time A" 
                players={teams.teamA} 
                color="emerald" 
                onMovePlayer={(pid) => handleMovePlayer(pid, 'teamA')} 
                isLocked={isLocked || !isAdmin}
              />
              <TeamColumn 
                title="Time B" 
                players={teams.teamB} 
                color="blue" 
                onMovePlayer={(pid) => handleMovePlayer(pid, 'teamB')} 
                isLocked={isLocked || !isAdmin}
              />
            </div>
          )}
        </div>

        {isAdmin && teams && !noTeamsDefined && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isLocked ? (
              <>
                <button onClick={fetchAndSort} disabled={saving || saveSuccess} className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  Resetar/Sortear
                </button>
                <button onClick={handleSave} disabled={saving || saveSuccess} className={`w-full sm:w-64 py-4 font-black text-xs uppercase rounded-2xl transition-all flex items-center justify-center gap-2 ${saveSuccess ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-xl shadow-emerald-600/20 active:scale-95'}`}>
                  {saving ? <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" /> : saveSuccess ? "Time Confirmado!" : "Confirmar Escalação"}
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="px-10 py-4 bg-slate-800/50 border border-slate-700 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center gap-3">
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  Escalação Fixada para a Partida
                </div>
                <p className="text-[9px] text-slate-600 font-bold uppercase">Clique no cadeado acima para editar manualmente</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
 
const TeamColumn = ({ 
  title, 
  players, 
  color, 
  onMovePlayer, 
  isLocked 
}: { 
  title: string, 
  players: PlayerWithStats[], 
  color: 'emerald' | 'blue', 
  onMovePlayer: (pid: string) => void,
  isLocked: boolean
}) => {
  const gks = players.filter(p => p.is_goalkeeper).length;
  const field = players.length - gks;
  const totalOvr = Math.round(players.reduce((acc, p) => acc + (p.stats?.overall || 0), 0));

  return (
    <div className="space-y-4 relative z-10 flex flex-col">
      <div className={`flex justify-between items-end border-b pb-3 ${color === 'emerald' ? 'border-emerald-500/30' : 'border-blue-500/30'}`}>
        <div>
          <h3 className={`font-black uppercase text-2xl ${color === 'emerald' ? 'text-emerald-500' : 'text-blue-500'}`}>{title}</h3>
          <div className="flex gap-2 mt-1">
            <span className="text-[9px] font-black uppercase text-slate-500 border border-slate-800 px-2 py-0.5 rounded-md">{field} Linha</span>
            <span className="text-[9px] font-black uppercase text-slate-500 border border-slate-800 px-2 py-0.5 rounded-md">{gks} Goleiro</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Team OVR</p>
          <p className="text-3xl font-black text-white tabular-nums">{totalOvr}</p>
        </div>
      </div>
      <div className="grid gap-2">
        {players.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-slate-800 rounded-2xl">
            <p className="text-[10px] font-black uppercase text-slate-700">Equipe Vazia</p>
          </div>
        ) : (
          players.map(p => (
              <div
                key={p.id}
                className="group flex items-center gap-3 p-3 bg-slate-800/40 border border-slate-700/50 rounded-2xl
                          hover:bg-slate-800/70 hover:border-emerald-500/20 transition-all duration-300"
              >
                <div className="relative shrink-0">
                  <div className="absolute -inset-2 rounded-full bg-emerald-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {p.avatar ? (
                    <img
                      src={p.avatar}
                      alt="Avatar"
                      className="relative w-10 h-10 rounded-full object-cover border-2 border-white/15
                                shadow-lg shadow-black/30
                                group-hover:scale-[1.06] group-hover:border-white/40 transition-all duration-300"
                    />
                  ) : (
                    <div
                      className="relative w-10 h-10 rounded-full bg-slate-900/60 border-2 border-white/10
                                flex items-center justify-center
                                shadow-lg shadow-black/30
                                group-hover:scale-[1.06] group-hover:border-white/25 transition-all duration-300"
                    >
                      <span className="text-white font-black text-sm">
                        {p.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0
                              transition-all duration-300 group-hover:scale-105 ${
                    p.is_goalkeeper
                      ? 'bg-orange-500/20 text-orange-500 border border-orange-500/25 shadow-lg shadow-orange-500/10'
                      : 'bg-slate-700/60 text-slate-300 border border-white/10'
                  }`}
                >
                  {p.is_goalkeeper ? 'GK' : 'PL'}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate group-hover:text-white transition-colors">
                    {p.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {p.positions && p.positions.length > 0 ? (
                      p.positions.map((pos, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 bg-slate-700/60 text-slate-300 rounded text-[8px] font-black uppercase border border-slate-600/50"
                        >
                          {pos === 'Goleiro' ? '🧤' : pos === 'Defesa' ? '🛡️' : pos === 'Meio' ? '⚡' : '⚽'} {pos}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {p.is_goalkeeper ? 'Goleiro' : 'Sem posição'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className="px-2 py-1 bg-slate-950/60 rounded-xl border border-slate-800
                              text-emerald-400 font-black text-[10px] tabular-nums
                              group-hover:bg-emerald-500/10 group-hover:border-emerald-500/25 transition-all"
                  >
                    {Math.round((p.stats?.overall || 0))}
                  </div>

                  {!isLocked && (
                    <button
                      onClick={() => onMovePlayer(p.id)}
                      className={`p-2 rounded-xl transition-all active:scale-95 ${
                        color === 'emerald'
                          ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white'
                          : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-slate-950'
                      }`}
                      title={color === 'emerald' ? "Mover para Time B" : "Mover para Time A"}
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${color === 'emerald' ? 'rotate-0' : 'rotate-180'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))

        )}
      </div>
    </div>
  );
};
