-- ====================================================================
-- LIMPEZA DE POLÍTICAS DUPLICADAS E REDUNDANTES
-- ====================================================================
-- Este script remove políticas RLS duplicadas e redundantes que foram
-- identificadas no sistema. Políticas duplicadas podem causar confusão
-- e problemas de desempenho.
-- 
-- ATENÇÃO: Execute este script somente após garantir que as políticas
-- de super admin estão criadas corretamente.
-- ====================================================================

-- MATCH_COMMENTS - Remover duplicados de leitura
DROP POLICY IF EXISTS "Permitir leitura de comentários para usuários autenticados" ON match_comments;

-- MATCH_PLAYERS - Remover duplicados de SELECT e DELETE
DROP POLICY IF EXISTS "Permitir leitura de participações para autenticados" ON match_players;
DROP POLICY IF EXISTS "Permitir leitura de participações em partidas" ON match_players;
DROP POLICY IF EXISTS "Permitir que jogadores removam sua própria participação" ON match_players;

-- MATCH_RESULTS - Remover duplicados de SELECT e ALL
DROP POLICY IF EXISTS "Permitir leitura de resultados para usuários autenticados" ON match_results;
DROP POLICY IF EXISTS "Permitir leitura de resultados de partidas" ON match_results;
DROP POLICY IF EXISTS "Permitir visualização de resultados" ON match_results;
DROP POLICY IF EXISTS "Super admins têm acesso total aos resultados" ON match_results;

-- MATCHES - Remover duplicados de SELECT
DROP POLICY IF EXISTS "Permitir leitura de partidas para usuários autenticados" ON matches;
DROP POLICY IF EXISTS "Permitir leitura de todas as partidas" ON matches;
DROP POLICY IF EXISTS "Permitir visualização de partidas" ON matches;

-- PLAYER_STATS - Remover duplicados de SELECT
DROP POLICY IF EXISTS "Permitir leitura de estatísticas para autenticados" ON player_stats;
DROP POLICY IF EXISTS "Permitir leitura de estatísticas de jogadores" ON player_stats;
DROP POLICY IF EXISTS "Permitir visualização de estatísticas" ON player_stats;

-- PLAYER_VOTES - Remover duplicados de INSERT
DROP POLICY IF EXISTS "Permitir que jogadores votem em companheiros" ON player_votes;
DROP POLICY IF EXISTS "Jogadores podem votar em seus companheiros" ON player_votes;
DROP POLICY IF EXISTS "Permitir votos de jogadores autenticados" ON player_votes;
DROP POLICY IF EXISTS "Permitir inserção de votos para autenticados" ON player_votes;

-- PLAYERS - Remover duplicados de SELECT e UPDATE
DROP POLICY IF EXISTS "Permitir leitura de jogadores para usuários autenticados" ON players;
DROP POLICY IF EXISTS "Permitir leitura de todos os jogadores" ON players;
DROP POLICY IF EXISTS "Permitir leitura de perfis de jogadores" ON players;
DROP POLICY IF EXISTS "Permitir visualização de jogadores" ON players;
DROP POLICY IF EXISTS "Permitir atualização do próprio perfil" ON players;

-- Verificar políticas restantes após limpeza
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Contar políticas por tabela
SELECT 
  tablename,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY total_policies DESC;
