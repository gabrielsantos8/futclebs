-- ====================================================================
-- POLÍTICAS RLS PARA SUPER ADMINS - TODAS AS TABELAS
-- ====================================================================
-- Este script cria políticas ALL (SELECT, INSERT, UPDATE, DELETE) para
-- super admins em todas as tabelas principais do sistema.
-- 
-- IDs dos Super Admins:
-- - 5e05a3d9-3a9a-4ad0-99f7-72315bbf5990
-- - 64043e4d-79e3-4875-974d-4eafa3a23823
-- ====================================================================

-- MATCHES
DROP POLICY IF EXISTS "Super admins podem gerenciar matches" ON matches;
CREATE POLICY "Super admins podem gerenciar matches"
ON matches FOR ALL
TO authenticated
USING (auth.uid() IN ('5e05a3d9-3a9a-4ad0-99f7-72315bbf5990', '64043e4d-79e3-4875-974d-4eafa3a23823'))
WITH CHECK (auth.uid() IN ('5e05a3d9-3a9a-4ad0-99f7-72315bbf5990', '64043e4d-79e3-4875-974d-4eafa3a23823'));

-- MATCH_RESULTS
DROP POLICY IF EXISTS "Super admins podem gerenciar match_results" ON match_results;
CREATE POLICY "Super admins podem gerenciar match_results"
ON match_results FOR ALL
TO authenticated
USING (auth.uid() IN ('5e05a3d9-3a9a-4ad0-99f7-72315bbf5990', '64043e4d-79e3-4875-974d-4eafa3a23823'))
WITH CHECK (auth.uid() IN ('5e05a3d9-3a9a-4ad0-99f7-72315bbf5990', '64043e4d-79e3-4875-974d-4eafa3a23823'));

-- MATCH_PLAYERS
DROP POLICY IF EXISTS "Super admins podem gerenciar match_players" ON match_players;
CREATE POLICY "Super admins podem gerenciar match_players"
ON match_players FOR ALL
TO authenticated
USING (auth.uid() IN ('5e05a3d9-3a9a-4ad0-99f7-72315bbf5990', '64043e4d-79e3-4875-974d-4eafa3a23823'))
WITH CHECK (auth.uid() IN ('5e05a3d9-3a9a-4ad0-99f7-72315bbf5990', '64043e4d-79e3-4875-974d-4eafa3a23823'));

-- PLAYER_VOTES
DROP POLICY IF EXISTS "Super admins podem gerenciar player_votes" ON player_votes;
CREATE POLICY "Super admins podem gerenciar player_votes"
ON player_votes FOR ALL
TO authenticated
USING (auth.uid() IN ('5e05a3d9-3a9a-4ad0-99f7-72315bbf5990', '64043e4d-79e3-4875-974d-4eafa3a23823'))
WITH CHECK (auth.uid() IN ('5e05a3d9-3a9a-4ad0-99f7-72315bbf5990', '64043e4d-79e3-4875-974d-4eafa3a23823'));

-- MATCH_COMMENTS
DROP POLICY IF EXISTS "Super admins podem gerenciar match_comments" ON match_comments;
CREATE POLICY "Super admins podem gerenciar match_comments"
ON match_comments FOR ALL
TO authenticated
USING (auth.uid() IN ('5e05a3d9-3a9a-4ad0-99f7-72315bbf5990', '64043e4d-79e3-4875-974d-4eafa3a23823'))
WITH CHECK (auth.uid() IN ('5e05a3d9-3a9a-4ad0-99f7-72315bbf5990', '64043e4d-79e3-4875-974d-4eafa3a23823'));

-- PLAYERS
DROP POLICY IF EXISTS "Super admins podem gerenciar players" ON players;
CREATE POLICY "Super admins podem gerenciar players"
ON players FOR ALL
TO authenticated
USING (auth.uid() IN ('5e05a3d9-3a9a-4ad0-99f7-72315bbf5990', '64043e4d-79e3-4875-974d-4eafa3a23823'))
WITH CHECK (auth.uid() IN ('5e05a3d9-3a9a-4ad0-99f7-72315bbf5990', '64043e4d-79e3-4875-974d-4eafa3a23823'));

-- ORGANIZATION
DROP POLICY IF EXISTS "Super admins podem gerenciar organization" ON organization;
CREATE POLICY "Super admins podem gerenciar organization"
ON organization FOR ALL
TO authenticated
USING (auth.uid() IN ('5e05a3d9-3a9a-4ad0-99f7-72315bbf5990', '64043e4d-79e3-4875-974d-4eafa3a23823'))
WITH CHECK (auth.uid() IN ('5e05a3d9-3a9a-4ad0-99f7-72315bbf5990', '64043e4d-79e3-4875-974d-4eafa3a23823'));

-- ORGANIZATION_PLAYERS
DROP POLICY IF EXISTS "Super admins podem gerenciar organization_players" ON organization_players;
CREATE POLICY "Super admins podem gerenciar organization_players"
ON organization_players FOR ALL
TO authenticated
USING (auth.uid() IN ('5e05a3d9-3a9a-4ad0-99f7-72315bbf5990', '64043e4d-79e3-4875-974d-4eafa3a23823'))
WITH CHECK (auth.uid() IN ('5e05a3d9-3a9a-4ad0-99f7-72315bbf5990', '64043e4d-79e3-4875-974d-4eafa3a23823'));

-- PLAYER_STATS
DROP POLICY IF EXISTS "Super admins podem gerenciar player_stats" ON player_stats;
CREATE POLICY "Super admins podem gerenciar player_stats"
ON player_stats FOR ALL
TO authenticated
USING (auth.uid() IN ('5e05a3d9-3a9a-4ad0-99f7-72315bbf5990', '64043e4d-79e3-4875-974d-4eafa3a23823'))
WITH CHECK (auth.uid() IN ('5e05a3d9-3a9a-4ad0-99f7-72315bbf5990', '64043e4d-79e3-4875-974d-4eafa3a23823'));
