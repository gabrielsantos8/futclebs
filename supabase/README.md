# Supabase Row-Level Security (RLS) Policies Setup

## Problem Overview

The application was experiencing an RLS policy violation error when super admins tried to use the "Finalizar Votação" (Force Complete Vote) feature:

```
Error: new row violates row-level security policy for table "player_votes"
Code: 42501
```

This error occurred because the Supabase RLS policies did not allow super admins to insert votes on behalf of other players.

## Solution

The solution is to create RLS policies that explicitly allow the two super admin users to:
1. **INSERT** votes into `player_votes` table (to enable "Finalizar Votação" feature)
2. **DELETE** records from various tables (to enable user deletion feature)

## Super Admin User IDs

The following user IDs have super admin privileges:
- `64043e4d-79e3-4875-974d-4eafa3a23823`
- `5e05a3d9-3a9a-4ad0-99f7-72315bbf5990`

## How to Apply the RLS Policies

### Option 1: Via Supabase Dashboard (Recommended)

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Create a new query
5. Copy the contents of `supabase/rls_policies.sql`
6. Paste into the SQL Editor
7. Click **Run** to execute the policies

### Option 2: Via Supabase CLI

If you have the Supabase CLI installed and configured:

```bash
# Navigate to your project directory
cd /path/to/futclebs

# Apply the migration
supabase db push

# Or execute the SQL file directly
supabase db execute --file supabase/rls_policies.sql
```

## What the Policies Do

### 1. Player Votes Insert Policy
**Purpose:** Allows super admins to force-complete voting by creating votes on behalf of players

```sql
CREATE POLICY "Super admins can insert votes to finalize voting"
ON player_votes FOR INSERT TO authenticated
WITH CHECK (auth.uid() IN ('64043e4d-...'::uuid, '5e05a3d9-...'::uuid));
```

### 2. Player Votes Delete Policy
**Purpose:** Allows super admins to delete votes when deleting users

```sql
CREATE POLICY "Super admins can delete player_votes"
ON player_votes FOR DELETE TO authenticated
USING (auth.uid() IN ('64043e4d-...'::uuid, '5e05a3d9-...'::uuid));
```

### 3. Additional Delete Policies
Similar policies for:
- `players` table - Delete users (except super admins themselves)
- `player_stats` table - Delete user statistics
- `match_players` table - Delete match participation records
- `match_comments` table - Delete user comments

## Verifying the Policies

After applying the policies, verify they were created:

1. Go to **Database** → **Policies** in Supabase Dashboard
2. Select each table (`player_votes`, `players`, etc.)
3. Confirm the policies are listed and enabled

## Testing the Fix

### Test 1: Force Complete Vote
1. Log in as a super admin user
2. Navigate to a finished match with incomplete votes
3. Click "Status Votação" button
4. Click "Finalizar" button for a player with pending votes
5. Verify the vote is created without RLS errors

### Test 2: Delete User
1. Log in as a super admin user
2. Navigate to "Gerenciar Usuários" 
3. Click "Deletar" on a non-super-admin user
4. Verify all related data is deleted without RLS errors

## Troubleshooting

### Error: Policy already exists
If you see "policy already exists" errors when running the SQL:
1. Check existing policies in the Supabase Dashboard
2. Drop the existing policy if needed: `DROP POLICY IF EXISTS "policy_name" ON table_name;`
3. Re-run the CREATE POLICY statement

### Error: Permission denied
Ensure you're running the SQL as a user with sufficient privileges (typically the project owner or database admin).

### Still Getting RLS Errors After Applying Policies
1. Verify the policies are **enabled** (not just created)
2. Confirm the user IDs in the policies match the super admin IDs in `App.tsx`
3. Clear browser cache and refresh the application
4. Check the Supabase Auth logs to confirm the authenticated user's UUID

## Important Notes

⚠️ **Security Considerations:**
- These policies grant powerful permissions to specific user IDs
- Only the two hardcoded super admin users can perform these operations
- Regular admin users (with `is_admin = true`) do NOT get these permissions
- Super admins cannot delete themselves or other super admins (enforced at database level)

⚠️ **Hardcoded User IDs:**
- The super admin user IDs are hardcoded in both:
  - Backend: `supabase/rls_policies.sql`
  - Frontend: `App.tsx` (lines 47-50)
- If super admin users change, update BOTH locations

⚠️ **Database State:**
- These policies are additive - they don't affect existing policies
- Existing INSERT/DELETE policies for regular users remain unchanged
- Super admins get additional permissions on top of regular user policies

## Related Files

- `/supabase/rls_policies.sql` - SQL file with all RLS policies
- `/App.tsx` - Contains super admin IDs and permission checks
- `/components/VotingStatusModal.tsx` - Force complete vote feature (line 41-78)
- `/components/AdminUserManagementModal.tsx` - User deletion feature

## Support

If you continue experiencing RLS errors after applying these policies:
1. Check Supabase logs: Dashboard → Logs → Database
2. Review existing policies: Dashboard → Database → Policies
3. Verify authentication: Dashboard → Auth → Users
4. Ensure RLS is enabled on all tables

## References

- [Supabase Row Level Security Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Policy Documentation](https://www.postgresql.org/docs/current/sql-createpolicy.html)
