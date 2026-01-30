
import React, { useState, useEffect, useMemo } from 'react';
import { supabase, Player, PlayerStats } from '../../../services/supabase.ts';

interface AdminMatchManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  onRefresh: () => void;
}

interface PlayerWithStats extends Player {
  stats?: PlayerStats;
}

export const AdminMatchManagementModal: React.FC<AdminMatchManagementModalProps> = ({
  isOpen,
  onClose,
  matchId,
  onRefresh
}) => {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [allPlayers, setAllPlayers] = useState<PlayerWithStats[]>([]);
  const [confirmedIds, setConfirmedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'confirmed' | 'available'>('confirmed');
  
  const [selectedToRemove, setSelectedToRemove] = useState<Set<string>>(new Set());
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<{title: string, msg: string} | null>(null);

  const MAX_GK = 2;
  const MAX_FIELD = 12;

  useEffect(() => {
    if (isOpen && matchId) loadData();
  }, [isOpen, matchId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: playersData } = await supabase.from('players').select('*, player_stats(*)');
      const { data: confirmedData } = await supabase.from('match_players').select('player_id').eq('match_id', matchId);

      if (playersData) {
        setAllPlayers(playersData.map((p: any) => ({
          ...p,
          stats: Array.isArray(p.player_stats) ? p.player_stats[0] : p.player_stats
        })));
      }
      if (confirmedData) setConfirmedIds(confirmedData.map(c => c.player_id));
      
      setSelectedToRemove(new Set());
      setSelectedToAdd(new Set());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const confirmedPlayers = useMemo(() => allPlayers.filter(p => confirmedIds.includes(p.id)), [allPlayers, confirmedIds]);
  const availablePlayers = useMemo(() => 
    allPlayers.filter(p => !confirmedIds.includes(p.id) && (searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase()))), 
  [allPlayers, confirmedIds, searchQuery]);

  const currentGk = confirmedPlayers.filter(p => p.is_goalkeeper).length;
  const currentField = confirmedPlayers.length - currentGk;

  const handleBulkRemove = async () => {
    setActionLoading(true);
    try {
      await supabase.from('match_players').delete().eq('match_id', matchId).in('player_id', Array.from(selectedToRemove));
      await loadData();
      onRefresh();
    } finally { setActionLoading(false); }
  };

  const handleBulkAdd = async () => {
    const adding = allPlayers.filter(p => selectedToAdd.has(p.id));
    const newGks = adding.filter(p => p.is_goalkeeper).length;
    const newField = adding.length - newGks;

    if (currentGk + newGks > MAX_GK) return setError({title: "Limite Goleiros", msg: "Apenas 2 goleiros permitidos."});
    if (currentField + newField > MAX_FIELD) return setError({title: "Limite Linha", msg: "Apenas 12 jogadores de linha permitidos."});

    setActionLoading(true);
    try {
      const inserts = Array.from(selectedToAdd).map(pid => ({ match_id: matchId, player_id: pid }));
      await supabase.from('match_players').insert(inserts);
      await loadData();
      onRefresh();
    } finally { setActionLoading(false); }
  };

  const toggleSelect = (id: string, set: Set<string>, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    setter(next);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-0 md:p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full h-full md:h-auto md:max-w-4xl bg-slate-950 md:bg-slate-900 md:border md:border-slate-800 md:rounded-[2.5rem] overflow-hidden flex flex-col max-h-screen md:max-h-[85vh] shadow-2xl">
        
        {/* Header com Status Consolidado */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Gestão da Lista</h2>
            <div className="flex gap-2 mt-2">
              <div className={`px-3 py-1 rounded-lg border flex items-center gap-2 transition-all ${currentField >= 12 ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}>
                <span className="text-[10px] font-black uppercase">Linha</span>
                <span className="text-xs font-black">{currentField}/12</span>
              </div>
              <div className={`px-3 py-1 rounded-lg border flex items-center gap-2 transition-all ${currentGk >= 2 ? 'bg-orange-500 text-slate-950 border-orange-400' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}>
                <span className="text-[10px] font-black uppercase">Goleiros</span>
                <span className="text-xs font-black">{currentGk}/2</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-2xl transition-colors text-slate-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs Estilizadas */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-2 gap-2">
          <button 
            onClick={() => setActiveTab('confirmed')} 
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'confirmed' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-500 hover:bg-slate-800'}`}
          >
            Confirmados ({confirmedPlayers.length})
          </button>
          <button 
            onClick={() => setActiveTab('available')} 
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'available' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-800'}`}
          >
            Disponíveis ({availablePlayers.length})
          </button>
        </div>

        {/* Área de Conteúdo */}
        <div className="flex-1 overflow-hidden flex flex-col relative bg-slate-950/30">
          {activeTab === 'confirmed' ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {confirmedPlayers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-20">
                    <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                    <p className="font-black uppercase text-xs">Nenhum convocado</p>
                  </div>
                ) : (
                  confirmedPlayers.map(p => (
                    <PlayerManagementRow 
                      key={p.id} 
                      player={p} 
                      selected={selectedToRemove.has(p.id)} 
                      onToggle={() => toggleSelect(p.id, selectedToRemove, setSelectedToRemove)} 
                      theme="red" 
                    />
                  ))
                )}
              </div>
              {selectedToRemove.size > 0 && (
                <div className="p-6 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 animate-in slide-in-from-bottom-5">
                  <button onClick={handleBulkRemove} disabled={actionLoading} className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase rounded-2xl transition-all shadow-xl shadow-red-600/20 active:scale-95">
                    Remover {selectedToRemove.size} Jogadores da Partida
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-4 border-b border-slate-800/50">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Filtrar por nome do craque..." 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-12 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" 
                  />
                  <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {availablePlayers.map(p => (
                  <PlayerManagementRow 
                    key={p.id} 
                    player={p} 
                    selected={selectedToAdd.has(p.id)} 
                    onToggle={() => toggleSelect(p.id, selectedToAdd, setSelectedToAdd)} 
                    theme="emerald" 
                  />
                ))}
              </div>
              {selectedToAdd.size > 0 && (
                <div className="p-6 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 animate-in slide-in-from-bottom-5">
                  <button onClick={handleBulkAdd} disabled={actionLoading} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase rounded-2xl transition-all shadow-xl shadow-emerald-600/20 active:scale-95">
                    Adicionar {selectedToAdd.size} Jogadores à Lista
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] text-center w-full max-w-xs shadow-2xl animate-in zoom-in">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-500 border border-red-500/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 15c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <h3 className="text-white font-black uppercase mb-2 tracking-tight">{error.title}</h3>
            <p className="text-slate-400 text-xs mb-8 leading-relaxed font-medium">{error.msg}</p>
            <button onClick={() => setError(null)} className="w-full py-4 bg-white text-slate-950 font-black text-[10px] uppercase rounded-2xl hover:bg-slate-200 transition-colors">Entendi</button>
          </div>
        </div>
      )}
    </div>
  );
};

interface PlayerManagementRowProps {
  player: Player;
  selected: boolean;
  onToggle: () => void;
  theme: 'emerald' | 'red';
}

const PlayerManagementRow: React.FC<PlayerManagementRowProps> = ({ player, selected, onToggle, theme }) => (
  <div 
    onClick={onToggle} 
    className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all group ${
      selected 
        ? (theme === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-red-500/10 border-red-500/40') 
        : 'bg-slate-800/30 border-slate-700/30 hover:border-slate-600 hover:bg-slate-800/50'
    }`}
  >
    {/* Checkbox */}
    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
      selected 
        ? (theme === 'emerald' ? 'bg-emerald-500 border-emerald-500' : 'bg-red-500 border-red-500') 
        : 'border-slate-600 group-hover:border-slate-500'
    }`}>
      {selected && <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
    </div>

    {/* Info Jogador */}
    <div className="flex-1 min-w-0">
      <span className={`text-sm font-black block truncate transition-colors ${selected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
        {player.name}
      </span>
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter truncate">
        {player.phone ? `+55 ${player.phone.slice(0, 2)} ${player.phone.slice(2, 7)}-${player.phone.slice(7)}` : 'Sem contato'}
      </span>
    </div>

    {/* Badge de Posição - O GRANDE DESTAQUE */}
    <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 shrink-0 ${
      player.is_goalkeeper 
        ? 'bg-orange-500/20 border-orange-500/30 text-orange-500' 
        : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500'
    }`}>
      {player.is_goalkeeper ? (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          <span className="text-[9px] font-black uppercase tracking-widest">Goleiro</span>
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          <span className="text-[9px] font-black uppercase tracking-widest">Linha</span>
        </>
      )}
    </div>
  </div>
);
