-- ====================================================================
-- SCRIPT DINÂMICO - POLÍTICAS RLS PARA SUPER ADMINS EM TODAS AS TABELAS
-- ====================================================================
-- Este script cria automaticamente políticas ALL para super admins em
-- TODAS as tabelas do schema público, garantindo acesso completo.
-- 
-- Útil para ambientes onde novas tabelas são criadas frequentemente.
-- ====================================================================

DO $$
DECLARE
  table_record RECORD;
  policy_name TEXT;
BEGIN
  -- Iterar sobre todas as tabelas no schema público
  FOR table_record IN
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
  LOOP
    -- Nome da política
    policy_name := 'Super admins podem gerenciar ' || table_record.tablename;
    
    -- Remover política existente se houver
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_record.tablename);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Não foi possível remover política % na tabela %', policy_name, table_record.tablename;
    END;
    
    -- Criar nova política ALL
    BEGIN
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR ALL TO authenticated
         USING (auth.uid() IN (%L, %L))
         WITH CHECK (auth.uid() IN (%L, %L))',
        policy_name, 
        table_record.tablename,
        '5e05a3d9-3a9a-4ad0-99f7-72315bbf5990',
        '64043e4d-79e3-4875-974d-4eafa3a23823',
        '5e05a3d9-3a9a-4ad0-99f7-72315bbf5990',
        '64043e4d-79e3-4875-974d-4eafa3a23823'
      );
      RAISE NOTICE 'Política % criada com sucesso na tabela %', policy_name, table_record.tablename;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Erro ao criar política % na tabela %: %', policy_name, table_record.tablename, SQLERRM;
    END;
  END LOOP;
END $$;

-- Listar todas as políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE policyname LIKE 'Super admins podem gerenciar%'
ORDER BY tablename, policyname;
