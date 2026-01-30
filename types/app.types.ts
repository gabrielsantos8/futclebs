import { Match } from '../services/supabase';

export enum Step {
  PHONE_CHECK,
  LOGIN,
  REGISTER
}

export type MatchCategory = 'open' | 'pending' | 'finished' | 'ranking';

export interface MatchWithExtras extends Match {
  playerCount: number;
  isUserRegistered: boolean;
  hasPendingVotes?: boolean;
}

export interface PlayerData {
  name: string;
  is_goalkeeper: boolean;
  stats: any | null;
  avatar?: string | null;
}

