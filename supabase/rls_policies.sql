-- ============================================
-- Row Level Security Policies for FutClebs
-- ============================================
-- These policies must be applied to the Supabase database
-- via the Supabase Dashboard (SQL Editor) or Supabase CLI

-- Super Admin User IDs
-- These are the two users with super admin privileges
-- - 64043e4d-79e3-4875-974d-4eafa3a23823
-- - 5e05a3d9-3a9a-4ad0-99f7-72315bbf5990

-- ============================================
-- PLAYER_VOTES TABLE POLICIES
-- ============================================

-- Policy: Allow super admins to insert votes for "Finalizar Votação" feature
-- This policy enables super admins to force-complete voting by creating votes
-- on behalf of players who haven't completed their voting obligations
CREATE POLICY "Super admins can insert votes to finalize voting"
ON player_votes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    '64043e4d-79e3-4875-974d-4eafa3a23823'::uuid,
    '5e05a3d9-3a9a-4ad0-99f7-72315bbf5990'::uuid
  )
);

-- Policy: Allow super admins to delete votes (for user deletion feature)
CREATE POLICY "Super admins can delete player_votes"
ON player_votes
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    '64043e4d-79e3-4875-974d-4eafa3a23823'::uuid,
    '5e05a3d9-3a9a-4ad0-99f7-72315bbf5990'::uuid
  )
);

-- ============================================
-- PLAYERS TABLE POLICIES
-- ============================================

-- Policy: Allow super admins to delete users (except super admins themselves)
CREATE POLICY "Super admins can delete players"
ON players
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    '64043e4d-79e3-4875-974d-4eafa3a23823'::uuid,
    '5e05a3d9-3a9a-4ad0-99f7-72315bbf5990'::uuid
  )
  AND id NOT IN (
    '64043e4d-79e3-4875-974d-4eafa3a23823'::uuid,
    '5e05a3d9-3a9a-4ad0-99f7-72315bbf5990'::uuid
  )
);

-- ============================================
-- PLAYER_STATS TABLE POLICIES
-- ============================================

-- Policy: Allow super admins to delete player stats
CREATE POLICY "Super admins can delete player_stats"
ON player_stats
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    '64043e4d-79e3-4875-974d-4eafa3a23823'::uuid,
    '5e05a3d9-3a9a-4ad0-99f7-72315bbf5990'::uuid
  )
);

-- ============================================
-- MATCH_PLAYERS TABLE POLICIES
-- ============================================

-- Policy: Allow super admins to delete match player records
CREATE POLICY "Super admins can delete match_players"
ON match_players
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    '64043e4d-79e3-4875-974d-4eafa3a23823'::uuid,
    '5e05a3d9-3a9a-4ad0-99f7-72315bbf5990'::uuid
  )
);

-- ============================================
-- MATCH_COMMENTS TABLE POLICIES
-- ============================================

-- Policy: Allow super admins to delete match comments
CREATE POLICY "Super admins can delete match_comments"
ON match_comments
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    '64043e4d-79e3-4875-974d-4eafa3a23823'::uuid,
    '5e05a3d9-3a9a-4ad0-99f7-72315bbf5990'::uuid
  )
);
