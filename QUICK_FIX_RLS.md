# Quick Fix Guide: RLS Policy Error

## The Error
```
new row violates row-level security policy for table "player_votes"
code: "42501"
```

## The Cause
Super admins trying to insert votes on behalf of other players are blocked by Supabase RLS policies.

## The Fix (3 Steps)

### Step 1: Open Supabase SQL Editor
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the sidebar

### Step 2: Run the SQL Policy
Copy and paste this SQL, then click **Run**:

```sql
-- Critical Policy: Allow super admins to insert votes
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
```

### Step 3: Test the Feature
1. Log in as a super admin
2. Go to a finished match
3. Click "Status Votação"
4. Click "Finalizar" on a player with pending votes
5. Verify success ✅

## Additional Policies (Optional)

If you also need the user deletion feature, run these:

```sql
-- Allow deleting votes
CREATE POLICY "Super admins can delete player_votes"
ON player_votes FOR DELETE TO authenticated
USING (auth.uid() IN (
  '64043e4d-79e3-4875-974d-4eafa3a23823'::uuid,
  '5e05a3d9-3a9a-4ad0-99f7-72315bbf5990'::uuid
));

-- Allow deleting users (except super admins themselves)
CREATE POLICY "Super admins can delete players"
ON players FOR DELETE TO authenticated
USING (auth.uid() IN (
  '64043e4d-79e3-4875-974d-4eafa3a23823'::uuid,
  '5e05a3d9-3a9a-4ad0-99f7-72315bbf5990'::uuid
) AND id NOT IN (
  '64043e4d-79e3-4875-974d-4eafa3a23823'::uuid,
  '5e05a3d9-3a9a-4ad0-99f7-72315bbf5990'::uuid
));

-- Allow deleting player stats
CREATE POLICY "Super admins can delete player_stats"
ON player_stats FOR DELETE TO authenticated
USING (auth.uid() IN (
  '64043e4d-79e3-4875-974d-4eafa3a23823'::uuid,
  '5e05a3d9-3a9a-4ad0-99f7-72315bbf5990'::uuid
));

-- Allow deleting match players
CREATE POLICY "Super admins can delete match_players"
ON match_players FOR DELETE TO authenticated
USING (auth.uid() IN (
  '64043e4d-79e3-4875-974d-4eafa3a23823'::uuid,
  '5e05a3d9-3a9a-4ad0-99f7-72315bbf5990'::uuid
));

-- Allow deleting match comments
CREATE POLICY "Super admins can delete match_comments"
ON match_comments FOR DELETE TO authenticated
USING (auth.uid() IN (
  '64043e4d-79e3-4875-974d-4eafa3a23823'::uuid,
  '5e05a3d9-3a9a-4ad0-99f7-72315bbf5990'::uuid
));
```

## Troubleshooting

**"Policy already exists"**
- Good! It means the policy is already applied
- Skip to Step 3 to test

**"Permission denied"**
- Ensure you're logged in as the project owner
- Check you're in the correct Supabase project

**Still getting RLS errors?**
- Verify policies are **enabled** in Database → Policies
- Confirm user IDs match those in `App.tsx` (in the `SUPER_ADMIN_IDS` constant)
- Clear browser cache and retry

## Done! 🎉
The "Finalizar Votação" feature should now work for super admins.

For more details, see `/supabase/README.md`
