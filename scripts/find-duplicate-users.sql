-- Find Duplicate Users Diagnostic Script
-- Run this in Supabase SQL Editor to identify duplicate user issues

-- 1. Find users with same email but different internal IDs (shouldn't exist due to unique constraint)
SELECT email, COUNT(*) as count, array_agg(id) as user_ids, array_agg("supabaseAuthId") as supabase_ids
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- 2. Find support tickets and their owners
SELECT 
  st.id as ticket_id,
  st.subject,
  st."userId" as ticket_user_id,
  u.email as ticket_owner_email,
  u."supabaseAuthId" as ticket_owner_supabase_id
FROM support_tickets st
JOIN users u ON st."userId" = u.id
ORDER BY st."createdAt" DESC
LIMIT 20;

-- 3. Check specific ticket ownership (replace the ticket ID)
-- SELECT 
--   st.id as ticket_id,
--   st.subject,
--   st."userId" as ticket_user_id,
--   u.email as ticket_owner_email,
--   u."supabaseAuthId" as owner_supabase_auth_id
-- FROM support_tickets st
-- JOIN users u ON st."userId" = u.id
-- WHERE st.id = 'cmis1are40006l904vycxcs6o';

-- 4. Find all users and their Supabase Auth IDs
SELECT 
  id,
  email,
  name,
  "supabaseAuthId",
  role,
  "createdAt"
FROM users
ORDER BY email, "createdAt" DESC;

-- 5. Check if a specific email has multiple auth providers
-- Look in Supabase Auth dashboard for multiple identities

