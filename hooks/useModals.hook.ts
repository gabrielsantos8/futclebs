import { useState } from 'react';

interface ModalState {
  isStatsModalOpen: boolean;
  isMatchPlayersModalOpen: boolean;
  isAdminManagementOpen: boolean;
  isTeamSortingOpen: boolean;
  isMatchFinishOpen: boolean;
  isPlayerVoteOpen: boolean;
  isMatchSummaryOpen: boolean;
  isCreateMatchOpen: boolean;
  isDeleteConfirmOpen: boolean;
  isMatchCommentsOpen: boolean;
  isVotingStatusOpen: boolean;
  isAdminUserManagementOpen: boolean;
  isMiniStatsOpen: boolean;
  isAvatarModalOpen: boolean;
  isPositionSelectorOpen: boolean;
}

export const useModals = () => {
  const [modals, setModals] = useState<ModalState>({
    isStatsModalOpen: false,
    isMatchPlayersModalOpen: false,
    isAdminManagementOpen: false,
    isTeamSortingOpen: false,
    isMatchFinishOpen: false,
    isPlayerVoteOpen: false,
    isMatchSummaryOpen: false,
    isCreateMatchOpen: false,
    isDeleteConfirmOpen: false,
    isMatchCommentsOpen: false,
    isVotingStatusOpen: false,
    isAdminUserManagementOpen: false,
    isMiniStatsOpen: false,
    isAvatarModalOpen: false,
    isPositionSelectorOpen: false,
  });

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedPlayerData, setSelectedPlayerData] = useState<any>(null);

  const openModal = (name: keyof ModalState, matchId?: string) => {
    if (matchId) setSelectedMatchId(matchId);
    setModals(prev => ({ ...prev, [name]: true }));
  };

  const closeModal = (name: keyof ModalState) => {
    setModals(prev => ({ ...prev, [name]: false }));
  };

  return {
    ...modals,
    selectedMatchId,
    selectedPlayerData,
    setSelectedMatchId,
    setSelectedPlayerData,
    openModal,
    closeModal
  };
};

