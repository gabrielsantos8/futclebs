# Database Scripts - RLS Policies for Super Admins

Este diretório contém scripts SQL para gerenciar políticas RLS (Row Level Security) no Supabase, especialmente para super administradores.

## 📋 Scripts Disponíveis

### 1. FIX-FINAL.sql
**Propósito**: Cria políticas ALL (SELECT, INSERT, UPDATE, DELETE) para super admins em todas as tabelas principais.

**Tabelas cobertas**:
- matches
- match_results
- match_players
- player_votes
- match_comments
- players
- organization
- organization_players
- player_stats

**Como usar**:
1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Copie e cole o conteúdo de `FIX-FINAL.sql`
4. Execute o script

### 2. ALL-TABLES-POLICY.sql
**Propósito**: Script dinâmico que cria políticas ALL para super admins em TODAS as tabelas do schema público automaticamente.

**Vantagens**:
- Não requer atualização manual quando novas tabelas são criadas
- Garante que super admins sempre tenham acesso completo
- Inclui logging de sucesso/erro para cada tabela

**Como usar**:
1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Copie e cole o conteúdo de `ALL-TABLES-POLICY.sql`
4. Execute o script
5. Revise a saída para verificar quais políticas foram criadas

### 3. CLEANUP-DUPLICATE-POLICIES.sql
**Propósito**: Remove políticas duplicadas e redundantes identificadas no sistema.

**⚠️ IMPORTANTE**: Execute este script APÓS garantir que as políticas de super admin foram criadas corretamente usando um dos scripts acima.

**Políticas removidas**:
- ~25 políticas duplicadas em várias tabelas
- Políticas de SELECT redundantes
- Políticas de INSERT/DELETE/UPDATE duplicadas

**Como usar**:
1. **Primeiro**, execute `FIX-FINAL.sql` ou `ALL-TABLES-POLICY.sql`
2. Verifique que as políticas de super admin funcionam
3. Então execute `CLEANUP-DUPLICATE-POLICIES.sql`
4. Revise a saída para ver quantas políticas restam por tabela

## 🔐 IDs dos Super Admins

Os scripts utilizam os seguintes IDs de super admin:
- `5e05a3d9-3a9a-4ad0-99f7-72315bbf5990`
- `64043e4d-79e3-4875-974d-4eafa3a23823`

## 🚀 Ordem Recomendada de Execução

1. **Primeiro**: `FIX-FINAL.sql` ou `ALL-TABLES-POLICY.sql`
   - Escolha `FIX-FINAL.sql` se você quer controle explícito sobre quais tabelas
   - Escolha `ALL-TABLES-POLICY.sql` se você quer cobertura automática de todas as tabelas

2. **Segundo**: Teste as funcionalidades (especialmente exclusão de partidas)

3. **Terceiro**: `CLEANUP-DUPLICATE-POLICIES.sql`
   - Execute somente após confirmar que tudo funciona

## 🔍 Verificação

Após executar os scripts, você pode verificar as políticas criadas com:

```sql
-- Ver todas as políticas
SELECT 
  tablename,
  policyname,
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
```

## 🐛 Troubleshooting

### Erro: "Partida não encontrada" ou "400 Bad Request"
- Verifique se as políticas de super admin foram criadas corretamente
- Confirme que seu ID está na lista de super admins
- Verifique os logs do console do navegador para detalhes

### Erro ao executar scripts SQL
- Certifique-se de estar logado como proprietário do banco de dados no Supabase
- Verifique se RLS está habilitado nas tabelas
- Revise os nomes das tabelas no seu banco de dados

### Políticas não estão sendo aplicadas
- Force logout e login novamente no aplicativo
- Limpe o cache do navegador
- Verifique se o token JWT foi renovado
