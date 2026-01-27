import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, Player, PlayerStats, Match } from './services/supabase';
import { AuthCard } from './components/AuthCard';
import { Input } from './components/Input';
import { PlayerStatsModal } from './components/PlayerStatsModal';
import { MatchPlayersModal } from './components/MatchPlayersModal';
import { MiniStatsModal } from './components/MiniStatsModal';
import { AdminMatchManagementModal } from './components/AdminMatchManagementModal';
import { TeamSortingModal } from './components/TeamSortingModal';
import { MatchFinishModal } from './components/MatchFinishModal';
import { PlayerVoteModal } from './components/PlayerVoteModal';
import { MatchSummaryModal } from './components/MatchSummaryModal';
import { RankingTab } from './components/RankingTab';
import { CreateMatchModal } from './components/CreateMatchModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { AdminUserManagementModal } from './components/AdminUserManagementModal';
import { MatchCommentsModal } from './components/MatchCommentsModal';
import { VotingStatusModal } from './components/VotingStatusModal';

enum Step {
  PHONE_CHECK,
  LOGIN,
  REGISTER
}

type MatchCategory = 'open' | 'pending' | 'finished' | 'ranking';

interface MatchWithExtras extends Match {
  playerCount: number;
  isUserRegistered: boolean;
  hasPendingVotes?: boolean;
}

const App: React.FC = () => {
  const [step, setStep] = useState<Step>(Step.PHONE_CHECK);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<Player | null>(null);
  const [userStats, setUserStats] = useState<PlayerStats | null>(null);
  const [matches, setMatches] = useState<MatchWithExtras[]>([]);
  const [activeCategory, setActiveCategory] = useState<MatchCategory>('open');
  const [activeAdminMenu, setActiveAdminMenu] = useState<string | null>(null);

  // Modals
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isMatchPlayersModalOpen, setIsMatchPlayersModalOpen] = useState(false);
  const [isAdminManagementOpen, setIsAdminManagementOpen] = useState(false);
  const [isTeamSortingOpen, setIsTeamSortingOpen] = useState(false);
  const [isMatchFinishOpen, setIsMatchFinishOpen] = useState(false);
  const [isPlayerVoteOpen, setIsPlayerVoteOpen] = useState(false);
  const [isMatchSummaryOpen, setIsMatchSummaryOpen] = useState(false);
  const [isCreateMatchOpen, setIsCreateMatchOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isMatchCommentsOpen, setIsMatchCommentsOpen] = useState(false);
  const [isVotingStatusOpen, setIsVotingStatusOpen] = useState(false);
  const [isAdminUserManagementOpen, setIsAdminUserManagementOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isMiniStatsOpen, setIsMiniStatsOpen] = useState(false);
  const [selectedPlayerData, setSelectedPlayerData] = useState<{ name: string, is_goalkeeper: boolean, stats: PlayerStats | null, avatar: string | null } | null>(null);

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

  const avatarObjectUrlRef = useRef<string | null>(null);

  // Crop states
  const cropBoxRef = useRef<HTMLDivElement | null>(null);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [zoom, setZoom] = useState(1);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);

  // Form states
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isGoalkeeper, setIsGoalkeeper] = useState(false);

  const fetchMatches = useCallback(async (userId: string) => {
    try {
      const { data: matchesData } = await supabase.from('matches').select('*').order('match_date', { ascending: false });
      if (!matchesData) return;

      const processedMatches = await Promise.all(matchesData.map(async (m) => {
        const { count } = await supabase.from('match_players').select('*', { count: 'exact', head: true }).eq('match_id', m.id);
        const { data: userReg } = await supabase.from('match_players').select('*').eq('match_id', m.id).eq('player_id', userId).maybeSingle();

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

            const userTeamIds = teamA.includes(userId) ? teamA : teamB.includes(userId) ? teamB : [];
            const teammatesIds = userTeamIds.filter(id => id !== userId);

            if (teammatesIds.length > 0) {
              const { data: votes } = await supabase
                .from('player_votes')
                .select('target_player_id')
                .eq('match_id', m.id)
                .eq('voter_id', userId)
                .in('target_player_id', teammatesIds);

              const votedIds = new Set(votes?.map(v => v.target_player_id) || []);
              hasPendingVotes = teammatesIds.some(tid => !votedIds.has(tid));
            }
          }
        }

        return { ...m, playerCount: count || 0, isUserRegistered: !!userReg, hasPendingVotes } as MatchWithExtras;
      }));

      setMatches(processedMatches);
    } catch (err) {
      console.error("Erro ao carregar partidas:", err);
    }
  }, []);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data: player, error: profileError } = await supabase.from('players').select('*').eq('id', userId).maybeSingle();
      if (profileError) throw profileError;

      if (player) {
        setUserProfile(player);
        const { data: stats } = await supabase.from('player_stats').select('*').eq('player_id', userId).maybeSingle();
        if (stats) setUserStats(stats);
      } else {
        setUserProfile(null);
      }
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
      setUserProfile(null);
    }
  }, []);

  const loadUserData = useCallback(async (userId: string) => {
    await Promise.all([
      fetchUserProfile(userId),
      fetchMatches(userId)
    ]);
  }, [fetchUserProfile, fetchMatches]);

  useEffect(async () => {
    let mounted = true;

    const init = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;
        if (!mounted) return;

        setSession(session);

        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          setUserProfile(null);
          setUserStats(null);
          setStep(Step.PHONE_CHECK);
        }
      } catch (err) {
        console.error('[AUTH INIT ERROR]', err);
      } finally {
        if (mounted) setInitializing(false);
      }
    };

    await init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      setSession(session);

      if (session?.user) {
        await loadUserData(session.user.id);
      } else {
        setUserProfile(null);
        setUserStats(null);
        setStep(Step.PHONE_CHECK);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Erro ao sair:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleOpenPlayersList = (matchId: string) => { setSelectedMatchId(matchId); setIsMatchPlayersModalOpen(true); };
  const handleOpenVoteModal = (matchId: string) => { setSelectedMatchId(matchId); setIsPlayerVoteOpen(true); };
  const handleOpenSummaryModal = (matchId: string) => { setSelectedMatchId(matchId); setIsMatchSummaryOpen(true); };
  const handleOpenAdminManagement = (matchId: string) => { setSelectedMatchId(matchId); setIsAdminManagementOpen(true); setActiveAdminMenu(null); };
  const handleOpenTeamSorting = (matchId: string) => { setSelectedMatchId(matchId); setIsTeamSortingOpen(true); setActiveAdminMenu(null); };
  const handleOpenVotingStatus = (matchId: string) => { setSelectedMatchId(matchId); setIsVotingStatusOpen(true); };
  const handleOpenMatchFinish = (matchId: string) => { setSelectedMatchId(matchId); setIsMatchFinishOpen(true); setActiveAdminMenu(null); };
  const handleOpenCommentsModal = (matchId: string) => { setSelectedMatchId(matchId); setIsMatchCommentsOpen(true); };

  const handleDeleteMatch = async () => {
    if (!selectedMatchId || !userProfile) return;
    setLoading(true);
    try {
      await supabase.from('match_comments').delete().eq('match_id', selectedMatchId);
      await supabase.from('player_votes').delete().eq('match_id', selectedMatchId);
      await supabase.from('match_results').delete().eq('match_id', selectedMatchId);
      await supabase.from('match_players').delete().eq('match_id', selectedMatchId);
      const { error: deleteError } = await supabase.from('matches').delete().eq('id', selectedMatchId);
      if (deleteError) throw deleteError;
      await fetchMatches(userProfile.id);
      setIsDeleteConfirmOpen(false);
      setSelectedMatchId(null);
      setActiveAdminMenu(null);
    } catch (err: any) {
      console.error("Erro ao excluir partida:", err);
      setError("Erro ao excluir partida");
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter(m => {
    if (activeCategory === 'open') return m.status === 'open';
    if (activeCategory === 'pending') return m.hasPendingVotes;
    if (activeCategory === 'finished') return m.status === 'finished' && !m.hasPendingVotes;
    return true;
  });

  const getCategoryCount = (cat: MatchCategory) => {
    if (cat === 'open') return matches.filter(m => m.status === 'open').length;
    if (cat === 'pending') return matches.filter(m => m.hasPendingVotes).length;
    if (cat === 'finished') return matches.filter(m => m.status === 'finished' && !m.hasPendingVotes).length;
    return 0;
  };

  // ✅ Avatar: abrir modal
  const openAvatarModal = () => {
    setIsAvatarModalOpen(true);
    setAvatarFile(null);
    setAvatarSrc(null);
    setCropX(0);
    setCropY(0);
    setZoom(1);
  };

  const closeAvatarModal = () => {
    setIsAvatarModalOpen(false);

    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
      avatarObjectUrlRef.current = null;
    }

    setAvatarFile(null);
    setAvatarSrc(null);
    setCropX(0);
    setCropY(0);
    setZoom(1);
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleAvatarSelectFile = (file: File | null) => {
    if (!file) return;

    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
      avatarObjectUrlRef.current = null;
    }

    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    avatarObjectUrlRef.current = url;

    setAvatarSrc(url);
    setCropX(0);
    setCropY(0);
    setZoom(1);
  };

  // ✅ Drag no crop
  const onCropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!avatarSrc) return;
    setIsDragging(true);
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    dragStartRef.current = { x: e.clientX, y: e.clientY, cx: cropX, cy: cropY };
  };

  const onCropPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setCropX(dragStartRef.current.cx + dx);
    setCropY(dragStartRef.current.cy + dy);
  };

  const onCropPointerUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // ✅ Gerar Base64 (256x256) com crop (clamp - sem preto)
  const generateCroppedBase64 = async (): Promise<string | null> => {
    if (!avatarSrc || !cropBoxRef.current) return null;

    const boxSize = cropBoxRef.current.clientWidth;
    const outputSize = 256;

    const img = new Image();
    img.src = avatarSrc;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    });

    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const baseScale = Math.max(boxSize / iw, boxSize / ih);
    const totalScale = baseScale * zoom;

    const renderedW = iw * totalScale;
    const renderedH = ih * totalScale;

    const imgLeft = (boxSize - renderedW) / 2 + cropX;
    const imgTop = (boxSize - renderedH) / 2 + cropY;

    let sx = (0 - imgLeft) / totalScale;
    let sy = (0 - imgTop) / totalScale;
    let sSize = boxSize / totalScale;

    if (sx < 0) sx = 0;
    if (sy < 0) sy = 0;

    if (sx + sSize > iw) sSize = iw - sx;
    if (sy + sSize > ih) sSize = ih - sy;

    if (sSize <= 0) return null;

    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      img,
      sx,
      sy,
      sSize,
      sSize,
      0,
      0,
      outputSize,
      outputSize
    );

    return canvas.toDataURL('image/jpeg', 0.9);
  };

const handleAvatarSaveBase64 = async () => {
    if (!userProfile || !avatarSrc) return;
    if (avatarUploading) return;

    setAvatarUploading(true);
    setError(null);

    try {
      const base64 = await generateCroppedBase64();
      if (!base64) throw new Error('Não foi possível gerar o avatar');

      setUserProfile((prev) => (prev ? { ...prev, avatar: base64 } : prev));

      const { error: updateError } = await supabase.from('players').update({ avatar: base64 }).eq('id', session?.user.id);


      if (updateError) throw updateError;

      closeAvatarModal();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Erro ao atualizar avatar");

    } finally {
      await fetchUserProfile(userProfile.id);
    }
};


 const handleAvatarRemove = async () => {
  if (!userProfile) return;
  if (avatarUploading) return;

  setAvatarUploading(true);
  setError(null);

  try {
    setUserProfile((prev) => (prev ? { ...prev, avatar: null } : prev));

    const { data, error: updateError } = await supabase
      .from('players')
      .update({ avatar: null })
      .eq('id', session?.user.id)
      .select('id')
      .limit(1);

    if (updateError) throw updateError;

    if (!data || data.length === 0) {
      throw new Error('UPDATE não aplicado (RLS bloqueando ou ID não encontrado)');
    }

    closeAvatarModal();
  } catch (err: any) {
    console.error(err);
    setError(err?.message || "Erro ao remover avatar");
    await fetchUserProfile(userProfile.id);
  } finally {
    setAvatarUploading(false);
  }
};


  if (initializing) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest animate-pulse">Iniciando...</p>
    </div>
  );

  if (session && userProfile) {
    return (
      <div className="min-h-screen bg-slate-950 pb-20 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="flex justify-between items-center">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">FutClebs • Dashboard</p>
              <h1 className="text-2xl font-black text-white">{userProfile.name}</h1>
              {userProfile.is_admin && (
                <span className="text-[10px] font-black bg-white text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-tighter border border-white/20">Modo Admin</span>
              )}
            </div>
            <div className="flex gap-2">
              {userProfile.is_admin && (
                <>
                  <button
                    onClick={() => setIsAdminUserManagementOpen(true)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 rounded-xl transition-all text-xs font-black uppercase"
                  >
                    Gerenciar Usuários
                  </button>
                  <button
                    onClick={() => setIsCreateMatchOpen(true)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl transition-all text-xs font-black uppercase shadow-lg shadow-emerald-600/20"
                  >
                    Criar Partida
                  </button>
                </>
              )}
              <button onClick={handleLogout} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all text-xs font-black uppercase">
                Sair
              </button>
            </div>
          </header>

          <div
            onClick={() => setIsStatsModalOpen(true)}
            className="group relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-[2.5rem] shadow-2xl cursor-pointer active:scale-95 transition-all"
          >
            <div className="flex justify-between items-center relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAvatarModal();
                    }}
                    className="relative group/avatar"
                    title="Editar avatar"
                  >
                    <div className="relative">
                      {userProfile.avatar ? (
                        <img
                          src={userProfile.avatar}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full object-cover border-2 border-white/30 transition-all duration-300 group-hover/avatar:scale-105 group-hover/avatar:border-white/70 shadow-lg shadow-black/30"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border-2 border-white/10 transition-all duration-300 group-hover/avatar:scale-105 group-hover/avatar:border-white/40 shadow-lg shadow-black/30">
                          <span className="text-white font-black text-xl">
                            {userProfile.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}

                      <div className="absolute inset-0 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 ring-2 ring-white/40" />
                    </div>

                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-950 border border-white/20 flex items-center justify-center transition-all duration-300 group-hover/avatar:scale-110 group-hover/avatar:border-white/50">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M15.232 5.232l3.536 3.536M9 11l6.732-6.732a2.5 2.5 0 013.536 3.536L12.536 14.536a2.5 2.5 0 01-1.768.732H9v-2.732A2.5 2.5 0 019.732 11z"
                        />
                      </svg>
                    </div>
                  </button>

                  <p className="text-emerald-200 text-[10px] font-black uppercase tracking-widest">Seu Nível</p>
                  <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase border border-white/10 tracking-widest">
                    {userProfile.is_goalkeeper ? 'Goleiro' : 'Linha'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-5xl font-black text-white tabular-nums">
                    {userStats?.overall
                      ? Math.round(Number(userStats.overall) * 20)
                      : '--'}
                  </span>
                  <span className="text-emerald-300 font-bold">OVR</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-md group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
            </div>
          </div>

          <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 gap-1 overflow-x-auto no-scrollbar">
            <TabBtn active={activeCategory === 'open'} onClick={() => setActiveCategory('open')} label="Abertas" count={getCategoryCount('open')} />
            <TabBtn active={activeCategory === 'pending'} onClick={() => setActiveCategory('pending')} label="Votar" count={getCategoryCount('pending')} highlight />
            <TabBtn active={activeCategory === 'finished'} onClick={() => setActiveCategory('finished')} label="Histórico" count={getCategoryCount('finished')} />
            <TabBtn active={activeCategory === 'ranking'} onClick={() => setActiveCategory('ranking')} label="Ranking" count={0} />
          </div>

          <div className="space-y-4">
            {activeCategory === 'ranking' ? (
              <RankingTab onPlayerClick={(p) => { setSelectedPlayerData({ name: p.name, is_goalkeeper: p.is_goalkeeper, stats: p.stats, avatar: p.avatar }); setIsMiniStatsOpen(true); }} />
            ) : (
              loading ? (
                <div className="py-20 text-center"><div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" /></div>
              ) : filteredMatches.length === 0 ? (
                <div className="py-20 text-center bg-slate-900/40 rounded-[2.5rem] border border-dashed border-slate-800 text-slate-500 font-medium">
                  Nenhuma partida encontrada nesta categoria.
                </div>
              ) : (
                filteredMatches.map(match => (
                  <div key={match.id} className="bg-slate-900/60 p-5 rounded-[2rem] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-4 w-full">
                      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex flex-col items-center justify-center text-emerald-500 font-bold shrink-0 border border-slate-700/50">
                        <span className="text-lg leading-none">{match.match_date.split('-')[2]}</span>
                        <span className="text-[10px] opacity-60 uppercase">{new Date(match.match_date + 'T12:00:00').toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                        <span className="text-[8px] opacity-40 font-black">{match.match_date.split('-')[0]}</span>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h3 className="text-white font-bold truncate">Pelada Clebinho</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${match.status === 'open' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                            match.hasPendingVotes ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                            {match.hasPendingVotes ? 'Votar' : match.status === 'open' ? 'Aberta' : 'Finalizada'}
                          </span>
                          <span className="text-slate-500 text-[10px] font-bold">• {match.playerCount} Confirmados</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full flex flex-col gap-3 mt-2 sm:mt-0 sm:w-auto">
                      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full">
                        {match.status === 'finished' && !match.hasPendingVotes && (
                          <button
                            onClick={() => handleOpenCommentsModal(match.id)}
                            className="px-3 py-3 bg-slate-800/80 text-emerald-500 hover:text-emerald-400 border border-emerald-500/20 rounded-xl font-black text-[9px] sm:text-[10px] uppercase transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-emerald-500/5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                            Resenha
                          </button>
                        )}

                        {(match.status === 'open' || match.status === 'finished') && (
                          <button
                            onClick={() => { setSelectedMatchId(match.id); setIsTeamSortingOpen(true); }}
                            className="px-3 py-3 bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/50 rounded-xl font-black text-[9px] sm:text-[10px] uppercase transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                          >
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            Escalação
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (match.hasPendingVotes) handleOpenVoteModal(match.id);
                            else if (match.status === 'finished') handleOpenSummaryModal(match.id);
                            else handleOpenPlayersList(match.id);
                          }}
                          className={`px-3 py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase transition-all shadow-lg text-center flex items-center justify-center gap-2 ${match.hasPendingVotes ? 'bg-orange-600 hover:bg-orange-500 text-slate-950 shadow-orange-600/20' :
                            match.status === 'open' ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-emerald-600/20' :
                              'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/30'
                            }`}
                        >
                          {match.hasPendingVotes ? 'Votar Agora' : match.status === 'open' ? 'Inscritos' : 'Resumo'}
                        </button>
                      </div>

                      {/* Menu Admin - Exibido abaixo ou ao lado em telas maiores */}
                      {userProfile.is_admin && (
                        <div className="w-full">
                          {match.status === 'open' && (
                            <>
                              {activeAdminMenu === match.id ? (
                                <div className="flex flex-wrap gap-1.5 animate-in slide-in-from-top-2 duration-300 justify-center sm:justify-end">
                                  <button onClick={() => handleOpenAdminManagement(match.id)} className="px-3 py-2 bg-slate-800 text-white rounded-lg font-black text-[8px] uppercase hover:bg-slate-700 transition-all border border-slate-700/50">Lista</button>
                                  <button onClick={() => handleOpenTeamSorting(match.id)} className="px-3 py-2 bg-blue-600 text-white rounded-lg font-black text-[8px] uppercase hover:bg-blue-500 transition-all border border-blue-400/30">Sortear</button>
                                  <button onClick={() => handleOpenMatchFinish(match.id)} className="px-3 py-2 bg-red-600 text-white rounded-lg font-black text-[8px] uppercase hover:bg-red-500 transition-all border border-red-400/30">Finalizar</button>
                                  <button onClick={() => { setSelectedMatchId(match.id); setIsDeleteConfirmOpen(true); }} className="px-3 py-2 bg-red-950/50 text-red-500 border border-red-900/30 rounded-lg font-black text-[8px] uppercase hover:bg-red-600 hover:text-white transition-all">Excluir</button>
                                  <button onClick={() => setActiveAdminMenu(null)} className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white border border-slate-700/50">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => setActiveAdminMenu(match.id)} className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 text-slate-400 hover:text-white border border-slate-800 rounded-xl font-black text-[9px] uppercase transition-all flex items-center justify-center gap-2">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                  Painel Admin
                                </button>
                              )}
                            </>
                          )}

                          {match.status === 'finished' && (
                            <button
                              onClick={() => handleOpenVotingStatus(match.id)}
                              className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 text-slate-400 hover:text-white border border-slate-800 rounded-xl font-black text-[9px] uppercase transition-all flex items-center justify-center gap-2"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                              </svg>
                              Status Votação
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {isAvatarModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={closeAvatarModal}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

            <div
              className="relative w-full max-w-md rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/40" />

              <div className="relative p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Personalização</p>
                    <h2 className="text-white font-black text-lg">Editar Avatar</h2>
                  </div>
                  <button
                    type="button"
                    onClick={closeAvatarModal}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-slate-300 font-bold text-xs">Cortar imagem</p>
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        1:1
                      </span>
                    </div>

                    <div
                      ref={cropBoxRef}
                      className={`relative w-full aspect-square rounded-2xl overflow-hidden border border-white/10 bg-slate-950 select-none ${avatarSrc ? 'cursor-grab active:cursor-grabbing' : ''}`}
                      onPointerDown={onCropPointerDown}
                      onPointerMove={onCropPointerMove}
                      onPointerUp={onCropPointerUp}
                      onPointerCancel={onCropPointerUp}
                      onPointerLeave={onCropPointerUp}
                    >
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 opacity-40">
                          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/10" />
                          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/10" />
                          <div className="absolute top-1/3 left-0 right-0 h-px bg-white/10" />
                          <div className="absolute top-2/3 left-0 right-0 h-px bg-white/10" />
                        </div>

                        <div className="absolute inset-0 ring-1 ring-white/15 rounded-2xl" />
                        <div className="absolute inset-0 shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.15)]" />
                      </div>

                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt="Crop"
                          draggable={false}
                          className="absolute top-1/2 left-1/2 will-change-transform"
                          style={{
                            transform: `translate(calc(-50% + ${cropX}px), calc(-50% + ${cropY}px)) scale(${zoom})`,
                            transformOrigin: 'center',
                            minWidth: '100%',
                            minHeight: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-center p-6">
                          <div className="space-y-2">
                            <div className="mx-auto w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                              <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                            <p className="text-slate-200 font-black text-sm">Selecione uma foto</p>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                              Arraste para posicionar • Zoom para ajustar
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Zoom</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                          {zoom.toFixed(2)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.01}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                        disabled={!avatarSrc}
                      />
                    </div>

                    <p className="mt-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      Dica: segure e arraste para mover
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleAvatarSelectFile(e.target.files?.[0] || null)}
                      />
                      <div className="w-full px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-black uppercase tracking-widest text-center cursor-pointer transition-all">
                        Selecionar Foto
                      </div>
                    </label>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={!avatarSrc || avatarUploading}
                        onClick={handleAvatarSaveBase64}
                        className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.99]"
                      >
                        {avatarUploading ? "Salvando..." : "Salvar Avatar"}
                      </button>

                      <button
                        type="button"
                        disabled={avatarUploading || (!userProfile?.avatar)}
                        onClick={handleAvatarRemove}
                        className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-red-300 hover:text-red-200 disabled:opacity-50 font-black text-xs uppercase tracking-widest transition-all"
                      >
                        Remover
                      </button>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        AVATAR SUPREMO
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium mt-1">
                        Escolha seu avatar para farmar aura.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <PlayerStatsModal isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} stats={userStats} playerName={userProfile.name} playerId={userProfile.id} isGoalkeeper={userProfile.is_goalkeeper} onViewMatchSummary={(mid) => { setSelectedMatchId(mid); setIsMatchSummaryOpen(true); }} />
        <MatchPlayersModal isOpen={isMatchPlayersModalOpen} onClose={() => setIsMatchPlayersModalOpen(false)} matchId={selectedMatchId || ''} currentUserId={userProfile.id} currentUserIsGoalkeeper={userProfile.is_goalkeeper} onPlayerClick={(p) => { setSelectedPlayerData({ name: p.name, is_goalkeeper: p.is_goalkeeper, stats: p.stats }); setIsMiniStatsOpen(true); }} onRefreshMatchList={() => fetchMatches(userProfile.id)} />
        <AdminMatchManagementModal isOpen={isAdminManagementOpen} onClose={() => setIsAdminManagementOpen(false)} matchId={selectedMatchId || ''} onRefresh={() => fetchMatches(userProfile.id)} />
        <TeamSortingModal isOpen={isTeamSortingOpen} onClose={() => setIsTeamSortingOpen(false)} matchId={selectedMatchId || ''} isAdmin={userProfile.is_admin} />
        <MatchFinishModal isOpen={isMatchFinishOpen} onClose={() => setIsMatchFinishOpen(false)} matchId={selectedMatchId || ''} onRefresh={() => fetchMatches(userProfile.id)} />
        <PlayerVoteModal isOpen={isPlayerVoteOpen} onClose={() => setIsPlayerVoteOpen(false)} matchId={selectedMatchId || ''} currentUserId={userProfile.id} onRefresh={() => fetchMatches(userProfile.id)} />
        <MatchSummaryModal isOpen={isMatchSummaryOpen} onClose={() => setIsMatchSummaryOpen(false)} matchId={selectedMatchId || ''} currentUserId={userProfile.id} isAdmin={userProfile.is_admin} />
        <CreateMatchModal isOpen={isCreateMatchOpen} onClose={() => setIsCreateMatchOpen(false)} onRefresh={() => fetchMatches(userProfile.id)} />
        <AdminUserManagementModal isOpen={isAdminUserManagementOpen} onClose={() => setIsAdminUserManagementOpen(false)} currentUserId={userProfile.id} />
        <ConfirmationModal isOpen={isDeleteConfirmOpen} onClose={() => { setIsDeleteConfirmOpen(false); setSelectedMatchId(null); }} onConfirm={handleDeleteMatch} isLoading={loading} title="Excluir Partida?" description="Esta ação é irreversível. Todos os dados da partida, incluindo inscritos e resultados, serão removidos permanentemente." confirmLabel="Sim, Excluir" cancelLabel="Cancelar" />
        <MiniStatsModal isOpen={isMiniStatsOpen} onClose={() => setIsMiniStatsOpen(false)} name={selectedPlayerData?.name || ''} isGoalkeeper={selectedPlayerData?.is_goalkeeper || false} stats={selectedPlayerData?.stats || null} avatar={selectedPlayerData?.avatar || null} />
        <MatchCommentsModal isOpen={isMatchCommentsOpen} onClose={() => setIsMatchCommentsOpen(false)} matchId={selectedMatchId || ''} currentUserId={userProfile.id} isAdmin={userProfile.is_admin} />
        <VotingStatusModal isOpen={isVotingStatusOpen} onClose={() => setIsVotingStatusOpen(false)} matchId={selectedMatchId || ''} isAdmin={userProfile.is_admin} />
      </div>
    );
  }

  const handleCheckPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) return setError('Telefone inválido');
    setLoading(true);
    setError(null);
    try {
      const { data } = await supabase.from('players').select('id').eq('phone', cleanPhone).maybeSingle();
      setStep(data ? Step.LOGIN : Step.REGISTER);
    } catch (err) {
      setError('Erro ao verificar telefone');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        phone: `+55${phone.replace(/\D/g, '')}`,
        password
      });
      if (loginError) throw loginError;
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'Senha incorreta' : 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Informe seu nome');
    if (password.length < 6) return setError('Senha muito curta');

    setLoading(true);
    setError(null);

    try {
      const cleanPhone = phone.replace(/\D/g, '');

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          phone: `+55${cleanPhone}`,
          password,
        });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error('Usuário não criado');

      const userId = signUpData.user.id;

      /* cria profile */
      const { error: profileError } = await supabase
        .from('players')
        .insert({
          id: userId,
          name: name.trim(),
          phone: cleanPhone,
          is_goalkeeper: isGoalkeeper,
          avatar: null,
        });

      if (profileError) throw profileError;

      /* cria stats */
      const { error: statsError } = await supabase
        .from('player_stats')
        .insert({ player_id: userId });

      if (statsError) throw statsError;

      /* 🔥 FORÇA reload dos dados */
      await loadUserData(userId);

      /* opcional: força step neutro */
      setStep(Step.PHONE_CHECK);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <AuthCard title={step === Step.REGISTER ? 'Novo Craque' : 'FutClebs'} subtitle={
        step === Step.PHONE_CHECK ? "Sua plataforma definitiva para organizar a pelada semanal." :
          step === Step.LOGIN ? "Bem-vindo de volta! Informe sua senha para entrar." :
            "Crie seu perfil de jogador para começar a participar."
      }>
        <form onSubmit={step === Step.PHONE_CHECK ? handleCheckPhone : step === Step.LOGIN ? handleLogin : handleRegister} className="space-y-4">
          {step === Step.PHONE_CHECK && <Input label="WhatsApp" value={phone} onChange={handlePhoneChange} placeholder="(00) 00000-0000" required />}
          {step === Step.LOGIN && <Input label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus />}
          {step === Step.REGISTER && (
            <div className="space-y-4">
              <Input label="Nome Completo" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: João Silva" />
              <div onClick={() => setIsGoalkeeper(!isGoalkeeper)} className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${isGoalkeeper ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${isGoalkeeper ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div>
                    <span className={`text-sm font-bold block ${isGoalkeeper ? 'text-emerald-500' : 'text-slate-300'}`}>Eu sou Goleiro</span>
                    <p className="text-[10px] text-slate-500">Marque se você joga no gol</p>
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full relative transition-colors ${isGoalkeeper ? 'bg-emerald-600' : 'bg-slate-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${isGoalkeeper ? 'left-5' : 'left-1'}`} /></div>
              </div>
              <Input label="Crie uma Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" />
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50">
            {loading ? (
              <div className="w-6 h-6 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin mx-auto" />
            ) : step === Step.REGISTER ? 'Concluir Cadastro' : 'Entrar'}
          </button>
          {error && <p className="text-red-500 text-center text-[10px] font-black uppercase tracking-widest bg-red-500/10 py-2 rounded-lg border border-red-500/20 animate-in fade-in slide-in-from-top-1">{error}</p>}
        </form>
      </AuthCard>
    </div>
  );
};

const TabBtn: React.FC<{ active: boolean; onClick: () => void; label: string; count: number; highlight?: boolean }> = ({ active, onClick, label, count, highlight }) => (
  <button onClick={onClick} className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative flex items-center justify-center gap-2 min-w-fit ${active ? (highlight ? 'bg-orange-600 text-slate-950 shadow-lg shadow-orange-600/20' : 'bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-600/20') : 'text-slate-500 hover:text-slate-300'
    }`}>
    {label}
    {count > 0 && (
      <span className={`px-1.5 py-0.5 rounded-full text-[10px] leading-none ${active ? 'bg-slate-950/20 text-slate-950' : highlight ? 'bg-orange-600/20 text-orange-500' : 'bg-slate-800 text-slate-400'}`}>
        {count}
      </span>
    )}
  </button>
);

export default App;
