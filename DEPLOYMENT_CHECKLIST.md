# Deployment Checklist: RLS Policy Fix

## ✅ Pre-Deployment Verification

- [x] SQL policies created in `supabase/rls_policies.sql`
- [x] Documentation created:
  - [x] `supabase/README.md` - Comprehensive guide
  - [x] `QUICK_FIX_RLS.md` - Quick reference
  - [x] `SOLUTION_SUMMARY.md` - Technical details
  - [x] `README.md` - Updated with database setup
- [x] Code compiles successfully (TypeScript + Vite)
- [x] Security enhancements applied (database-level protection)
- [x] All changes committed and pushed to GitHub

## 🚀 Deployment Steps

### 1. Apply RLS Policies to Supabase

**Option A: Via Dashboard (Recommended)**
1. Go to https://supabase.com/dashboard
2. Select the FutClebs project
3. Navigate to **SQL Editor**
4. Copy contents of `supabase/rls_policies.sql`
5. Paste and click **Run**

**Option B: Via CLI**
```bash
supabase db execute --file supabase/rls_policies.sql
```

### 2. Verify Policies

1. Go to **Database** → **Policies** in Supabase Dashboard
2. Verify these policies exist and are enabled:
   - ✅ `Super admins can insert votes to finalize voting` on `player_votes`
   - ✅ `Super admins can delete player_votes` on `player_votes`
   - ✅ `Super admins can delete players` on `players`
   - ✅ `Super admins can delete player_stats` on `player_stats`
   - ✅ `Super admins can delete match_players` on `match_players`
   - ✅ `Super admins can delete match_comments` on `match_comments`

### 3. Test the Fix

**Test Case 1: Force Complete Vote**
1. Log in as super admin (one of the two hardcoded UUIDs)
2. Navigate to a finished match with incomplete votes
3. Click "Status Votação" button
4. Find a player with pending votes
5. Click "Finalizar" button
6. **Expected:** Success message, no RLS error ✅

**Test Case 2: Access Control**
1. Log in as regular admin or player
2. Navigate to match list
3. **Expected:** "Status Votação" button is NOT visible ✅

**Test Case 3: User Deletion**
1. Log in as super admin
2. Click "Gerenciar Usuários"
3. Try to delete a non-super-admin user
4. **Expected:** User and related data deleted successfully ✅
5. Try to delete a super admin user
6. **Expected:** Button is disabled OR operation fails ✅

## 🔍 Troubleshooting

### Policy Already Exists Error
- **Solution:** Drop existing policy first, then re-run:
  ```sql
  DROP POLICY IF EXISTS "Super admins can insert votes to finalize voting" ON player_votes;
  ```

### Still Getting RLS Errors
1. Verify policies are **enabled** (not just created)
2. Check super admin UUIDs match in:
   - SQL policies: `supabase/rls_policies.sql`
   - Frontend code: `App.tsx` (SUPER_ADMIN_IDS)
3. Clear browser cache and refresh app
4. Check Supabase Auth logs to verify authenticated user UUID

### Permission Denied
- Ensure you're executing SQL as project owner or database admin
- Verify you're in the correct Supabase project

## 📊 Post-Deployment Validation

- [ ] No RLS errors in browser console when forcing vote completion
- [ ] Super admins can successfully force-complete votes
- [ ] Regular users cannot see "Status Votação" button
- [ ] Super admins can delete regular users
- [ ] Super admin deletion is blocked (button disabled or operation fails)
- [ ] Application builds and runs without errors

## 🎯 Success Criteria

All of the following must be true:
1. ✅ RLS error `42501` is resolved
2. ✅ "Finalizar Votação" feature works for super admins
3. ✅ Non-super-admins cannot access voting status
4. ✅ Super admins cannot be deleted via UI or database
5. ✅ All policies are active in Supabase Dashboard

## 📚 Reference Documentation

- **Quick Fix:** See `QUICK_FIX_RLS.md`
- **Detailed Guide:** See `supabase/README.md`
- **Technical Details:** See `SOLUTION_SUMMARY.md`

## ⚠️ Important Notes

- This fix requires **manual deployment** to Supabase
- The application code does not automatically create these policies
- Both SQL policies and frontend code must have matching super admin UUIDs
- If super admin users change, update both locations

---

**Status:** Ready for deployment ✅
**Last Updated:** 2026-01-30
