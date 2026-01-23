
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
 
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Player = {
  id: string;
  name: string;
  phone: string;
  is_admin: boolean;
  is_goalkeeper: boolean;
  avatar: string | null;
  created_at: string;
};

export type PlayerStats = {
  player_id: string;
  velocidade: number;
  finalizacao: number;
  passe: number;
  drible: number;
  defesa: number;
  fisico: number;
  overall: number;
};

export type Match = {
  id: string;
  match_date: string;
  status: 'open' | 'in_progress' | 'finished';
  created_by?: string;
  created_at: string;
};

export type MatchResult = {
  match_id: string;
  goals_team_a: number;
  goals_team_b: number;
  winner: 'A' | 'B' | 'draw' | null;
  players_team_a: string[];
  players_team_b: string[];
};

export type MatchRegistration = {
  id: string;
  match_id: string;
  player_id: string;
  created_at: string;
  status: 'confirmed' | 'waiting';
};

export type PlayerVote = {
  id: string;
  match_id: string;
  voter_id: string;
  target_player_id: string;
  velocidade: number;
  finalizacao: number;
  passe: number;
  drible: number;
  defesa: number;
  fisico: number;
  created_at: string;
};

export type MatchComment = {
  id: string;
  match_id: string;
  player_id: string;
  content: string;
  created_at: string;
  player_name?: string;
};