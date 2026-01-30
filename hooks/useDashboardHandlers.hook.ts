import { useCallback } from 'react';
import { Player } from '../services/supabase';

export const useDashboardHandlers = (
  userProfile: Player | null,
  isSuperAdmin: boolean,
  deleteMatch: (matchId: string) => Promise<void>,
  fetchMatches: (userId: string) => void,
  fetchUserProfile: (userId: string) => void,
  modals: any,
  avatar: any,
  updateUserProfile: (updates: Partial<Player>) => void,
  setError: (error: string | null) => void,
  setLoading: (loading: boolean) => void,
  setActiveAdminMenu: (menu: string | null) => void
) => {
  const handleDeleteMatch = useCallback(async () => {
    if (!modals.selectedMatchId || !userProfile) return;

    setLoading(true);
    try {
      await deleteMatch(modals.selectedMatchId);
      await fetchMatches(userProfile.id);
      modals.closeModal('isDeleteConfirmOpen');
      modals.setSelectedMatchId(null);
      setActiveAdminMenu(null);
    } catch (err: any) {
      console.error('Erro ao excluir partida:', err);
      setError('Erro ao excluir partida');
    } finally {
      setLoading(false);
    }
  }, [modals, userProfile, deleteMatch, fetchMatches, setError, setLoading, setActiveAdminMenu]);

  const handleOpenVotingStatus = useCallback((matchId: string) => {
    if (!isSuperAdmin) {
      setError('Acesso negado: apenas super admins podem ver o status de votação');
      return;
    }
    modals.setSelectedMatchId(matchId);
    modals.openModal('isVotingStatusOpen');
  }, [isSuperAdmin, modals, setError]);

  const handleAvatarSave = useCallback(async () => {
    if (!userProfile) return;

    try {
      await avatar.saveAvatar();
      updateUserProfile({ avatar: userProfile.avatar });
      modals.closeModal('isAvatarModalOpen');
    } catch (err: any) {
      setError(err?.message || 'Erro ao atualizar avatar');
      await fetchUserProfile(userProfile.id);
    }
  }, [userProfile, avatar, updateUserProfile, modals, setError, fetchUserProfile]);

  const handleAvatarRemove = useCallback(async () => {
    if (!userProfile) return;

    try {
      await avatar.removeAvatar();
      updateUserProfile({ avatar: null });
      modals.closeModal('isAvatarModalOpen');
    } catch (err: any) {
      setError(err?.message || 'Erro ao remover avatar');
      await fetchUserProfile(userProfile.id);
    }
  }, [userProfile, avatar, updateUserProfile, modals, setError, fetchUserProfile]);

  return {
    handleDeleteMatch,
    handleOpenVotingStatus,
    handleAvatarSave,
    handleAvatarRemove
  };
};

