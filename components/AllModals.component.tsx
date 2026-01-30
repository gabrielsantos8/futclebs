import React from 'react';
import { Player, PlayerStats } from '../services/supabase';
import { PlayerStatsModal } from './modals/player/PlayerStatsModal.tsx';
import { MatchPlayersModal } from './modals/match/MatchPlayersModal.tsx';
import { MiniStatsModal } from './modals/player/MiniStatsModal.tsx';
import { AdminMatchManagementModal } from './modals/admin/AdminMatchManagementModal.tsx';
import { TeamSortingModal } from './modals/match/TeamSortingModal.tsx';
import { MatchFinishModal } from './modals/match/MatchFinishModal.tsx';
import { PlayerVoteModal } from './modals/player/PlayerVoteModal.tsx';
import { MatchSummaryModal } from './modals/match/MatchSummaryModal.tsx';
import { CreateMatchModal } from './modals/match/CreateMatchModal.tsx';
import { AdminUserManagementModal } from './modals/admin/AdminUserManagementModal.tsx';
import { ConfirmationModal } from './modals/shared/ConfirmationModal.tsx';
import { MatchCommentsModal } from './modals/match/MatchCommentsModal.tsx';
import { VotingStatusModal } from './modals/match/VotingStatusModal.tsx';
import { PlayerPositionSelectorModal } from './modals/player/PlayerPositionSelectorModal.tsx';
import { AvatarModal } from './modals/player/AvatarModal.component.tsx';

interface AllModalsProps {
  modals: any;
  userProfile: Player;
  userStats: PlayerStats | null;
  avatar: any;
  isSuperAdmin: boolean;
  loading: boolean;
  onFetchMatches: (userId: string) => void;
  onFetchUserProfile: (userId: string) => void;
  onDeleteMatch: () => void;
  onAvatarSave: () => void;
  onAvatarRemove: () => void;
}

export const AllModals: React.FC<AllModalsProps> = ({
  modals,
  userProfile,
  userStats,
  avatar,
  isSuperAdmin,
  loading,
  onFetchMatches,
  onFetchUserProfile,
  onDeleteMatch,
  onAvatarSave,
  onAvatarRemove
}) => {
  return (
    <>
      {/* Avatar Modal */}
      {modals.isAvatarModalOpen && (
        <AvatarModal
          avatar={avatar}
          userProfile={userProfile}
          onClose={() => {
            avatar.resetAvatarState();
            modals.closeModal('isAvatarModalOpen');
          }}
          onSave={onAvatarSave}
          onRemove={onAvatarRemove}
        />
      )}

      {/* Player Stats Modal */}
      <PlayerStatsModal
        isOpen={modals.isStatsModalOpen}
        onClose={() => modals.closeModal('isStatsModalOpen')}
        stats={userStats}
        playerName={userProfile.name}
        playerId={userProfile.id}
        isGoalkeeper={userProfile.is_goalkeeper}
        onViewMatchSummary={(mid) => {
          modals.setSelectedMatchId(mid);
          modals.openModal('isMatchSummaryOpen');
        }}
      />

      {/* Match Players Modal */}
      <MatchPlayersModal
        isOpen={modals.isMatchPlayersModalOpen}
        onClose={() => modals.closeModal('isMatchPlayersModalOpen')}
        matchId={modals.selectedMatchId || ''}
        currentUserId={userProfile.id}
        currentUserIsGoalkeeper={userProfile.is_goalkeeper}
        onPlayerClick={(p) => {
          modals.setSelectedPlayerData({
            name: p.name,
            is_goalkeeper: p.is_goalkeeper,
            stats: p.stats,
            avatar: p.avatar
          });
          modals.openModal('isMiniStatsOpen');
        }}
        onRefreshMatchList={() => onFetchMatches(userProfile.id)}
      />

      {/* Admin Management Modal */}
      <AdminMatchManagementModal
        isOpen={modals.isAdminManagementOpen}
        onClose={() => modals.closeModal('isAdminManagementOpen')}
        matchId={modals.selectedMatchId || ''}
        onRefresh={() => onFetchMatches(userProfile.id)}
      />

      {/* Team Sorting Modal */}
      <TeamSortingModal
        isOpen={modals.isTeamSortingOpen}
        onClose={() => modals.closeModal('isTeamSortingOpen')}
        matchId={modals.selectedMatchId || ''}
        isAdmin={userProfile.is_admin}
      />

      {/* Match Finish Modal */}
      <MatchFinishModal
        isOpen={modals.isMatchFinishOpen}
        onClose={() => modals.closeModal('isMatchFinishOpen')}
        matchId={modals.selectedMatchId || ''}
        onRefresh={() => onFetchMatches(userProfile.id)}
        onOpenVotingStatus={
          isSuperAdmin
            ? () => {
                modals.closeModal('isMatchFinishOpen');
                modals.openModal('isVotingStatusOpen');
              }
            : undefined
        }
      />

      {/* Player Vote Modal */}
      <PlayerVoteModal
        isOpen={modals.isPlayerVoteOpen}
        onClose={() => modals.closeModal('isPlayerVoteOpen')}
        matchId={modals.selectedMatchId || ''}
        currentUserId={userProfile.id}
        onRefresh={() => onFetchMatches(userProfile.id)}
      />

      {/* Match Summary Modal */}
      <MatchSummaryModal
        isOpen={modals.isMatchSummaryOpen}
        onClose={() => modals.closeModal('isMatchSummaryOpen')}
        matchId={modals.selectedMatchId || ''}
        currentUserId={userProfile.id}
        isAdmin={userProfile.is_admin}
      />

      {/* Create Match Modal */}
      <CreateMatchModal
        isOpen={modals.isCreateMatchOpen}
        onClose={() => modals.closeModal('isCreateMatchOpen')}
        onRefresh={() => onFetchMatches(userProfile.id)}
      />

      {/* Admin User Management Modal */}
      <AdminUserManagementModal
        isOpen={modals.isAdminUserManagementOpen}
        onClose={() => modals.closeModal('isAdminUserManagementOpen')}
        currentUserId={userProfile.id}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={modals.isDeleteConfirmOpen}
        onClose={() => {
          modals.closeModal('isDeleteConfirmOpen');
          modals.setSelectedMatchId(null);
        }}
        onConfirm={onDeleteMatch}
        isLoading={loading}
        title="Excluir Partida?"
        description="Esta ação é irreversível. Todos os dados da partida, incluindo inscritos e resultados, serão removidos permanentemente."
        confirmLabel="Sim, Excluir"
        cancelLabel="Cancelar"
      />

      {/* Mini Stats Modal */}
      <MiniStatsModal
        isOpen={modals.isMiniStatsOpen}
        onClose={() => modals.closeModal('isMiniStatsOpen')}
        name={modals.selectedPlayerData?.name || ''}
        isGoalkeeper={modals.selectedPlayerData?.is_goalkeeper || false}
        stats={modals.selectedPlayerData?.stats || null}
        avatar={modals.selectedPlayerData?.avatar || null}
      />

      {/* Match Comments Modal */}
      <MatchCommentsModal
        isOpen={modals.isMatchCommentsOpen}
        onClose={() => modals.closeModal('isMatchCommentsOpen')}
        matchId={modals.selectedMatchId || ''}
        currentUserId={userProfile.id}
        isAdmin={userProfile.is_admin}
      />

      {/* Voting Status Modal */}
      <VotingStatusModal
        isOpen={modals.isVotingStatusOpen}
        onClose={() => modals.closeModal('isVotingStatusOpen')}
        matchId={modals.selectedMatchId || ''}
        isAdmin={isSuperAdmin}
      />

      {/* Player Position Selector */}
      <PlayerPositionSelectorModal
        isOpen={modals.isPositionSelectorOpen}
        onClose={() => modals.closeModal('isPositionSelectorOpen')}
        playerId={userProfile.id}
        playerName={userProfile.name}
        isGoalkeeper={userProfile.is_goalkeeper}
        currentPositions={userProfile.positions}
        onSave={() => onFetchUserProfile(userProfile.id)}
      />
    </>
  );
};

