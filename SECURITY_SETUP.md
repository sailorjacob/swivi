# 🔒 Supabase Database Security Guide

## TL;DR

Your database is currently **publicly accessible** via the Supabase REST API. Anyone with your anon key (which is in your frontend code) can read all your data.

**Fix it in 60 seconds:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → SQL Editor
2. Copy the contents of `scripts/enable-rls-security.sql`
3. Paste and click "Run"
4. Done! ✅

---

## Understanding Your Setup

You have a **hybrid architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                     YOUR NEXT.JS APP                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Browser (Client)              Server (API Routes)         │
│   ┌──────────────┐              ┌──────────────────┐       │
│   │ Supabase Auth│              │ Prisma           │       │
│   │ (anon key)   │              │ (DATABASE_URL)   │       │
│   └──────┬───────┘              └────────┬─────────┘       │
│          │                               │                  │
│          │ OAuth login only              │ All data access  │
└──────────┼───────────────────────────────┼──────────────────┘
           │                               │
           ▼                               ▼
┌──────────────────────────────────────────────────────────────┐
│                      SUPABASE                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   Supabase Auth              PostgreSQL Database             │
│   ┌────────────┐             ┌─────────────────────┐        │
│   │ auth.users │             │ public.users        │        │
│   │ (internal) │             │ public.campaigns    │        │
│   └────────────┘             │ public.payouts      │        │
│                              │ ...etc              │        │
│                              └─────────────────────┘        │
│                                                              │
│   REST API ← This is the risk! Anyone with anon key can     │
│              query your public tables if RLS is disabled    │
└──────────────────────────────────────────────────────────────┘
```

## Why Your Code Won't Break

1. **Supabase Auth** (login/logout) - Works independently of RLS
2. **Prisma** (your data access) - Connects directly to PostgreSQL and **bypasses RLS entirely**
3. **RLS** only affects the Supabase REST API and client libraries

When you enable RLS with no policies:
- ❌ Supabase REST API → No access (blocked)
- ✅ Supabase Auth → Still works (different system)
- ✅ Prisma queries → Still work (bypasses RLS)

---

## What is RLS?

**Row Level Security (RLS)** is a PostgreSQL feature that controls who can access which rows in your tables.

| RLS State | Policies | Result |
|-----------|----------|--------|
| Disabled | N/A | Everyone can access everything |
| Enabled | None | Nobody can access anything* |
| Enabled | Custom | Access based on policy rules |

*Except superusers (like Prisma using DATABASE_URL)

---

## Step-by-Step Instructions

### Option 1: Run the SQL Script (Recommended)

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor** in the sidebar
4. Create a "New query"
5. Copy/paste the contents of `scripts/enable-rls-security.sql`
6. Click **Run**
7. Verify the output shows "✅ SECURED" for all tables

### Option 2: Enable via Dashboard UI

1. Go to **Table Editor** in Supabase Dashboard
2. Click on each table
3. Click the **RLS** button (shield icon)
4. Toggle "Enable RLS" ON
5. Check "Force RLS for table owner" if available
6. Repeat for all tables

---

## Verify It Worked

After running the script, you can test that your data is protected:

### Test 1: Supabase REST API (should be blocked)

Try this in your browser console or with curl:

```javascript
// This should return an empty array or error
const { data, error } = await supabase.from('users').select('*')
console.log(data) // Should be [] or null
console.log(error) // Might show RLS error
```

### Test 2: Your App (should still work)

1. Log into your app normally
2. Check the dashboard loads your data
3. Try submitting a clip
4. All should work because Prisma bypasses RLS

---

## FAQ

### Q: Will this break my app?
**No.** Your app uses Prisma which connects directly to PostgreSQL and bypasses RLS. Only the Supabase client API is affected.

### Q: What about Supabase Auth?
**Still works.** Auth uses Supabase's internal `auth` schema, which is separate from your `public` schema tables.

### Q: What if I want to use Supabase client for some things later?
Add specific RLS policies. For example, to let users read their own data:

```sql
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
USING (supabase_auth_id = auth.uid());
```

### Q: What's the `FORCE ROW LEVEL SECURITY` for?
By default, table owners bypass RLS. `FORCE` makes RLS apply to the table owner too (extra safety).

### Q: Is this enough security?
This blocks the main attack vector (public API access). For production, also:
- Use environment variables properly (service role key should never be in client code)
- Set up proper CORS
- Rate limit your API routes
- Keep dependencies updated

---

## Your Tables That Get Protected

| Table | Sensitive Data |
|-------|---------------|
| `users` | Email, wallet addresses, PayPal, earnings |
| `campaigns` | Budget info, campaign details |
| `payouts` | Payment history, transaction IDs |
| `payout_requests` | Pending payment requests |
| `clips` | User submitted content |
| `clip_submissions` | Submission data |
| `view_tracking` | Analytics data |
| `social_accounts` | Connected social media, tokens |
| `social_verifications` | Verification codes |
| `notifications` | User notifications |
| `support_tickets` | Support conversations |
| `referrals` | Referral bonuses |
| `bounty_applications` | Application data |
| `cron_job_logs` | System logs |

---

## Need Help?

If something doesn't work after enabling RLS:

1. Check the Supabase logs (Dashboard → Logs → Postgres)
2. Make sure all tables show RLS enabled in Table Editor
3. Verify your Prisma queries still work (they should!)

If you need to temporarily disable RLS for debugging:

```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

Remember to re-enable it after debugging!






