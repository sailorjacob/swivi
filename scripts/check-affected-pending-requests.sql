-- Check if any of the affected users have pending payout requests
SELECT 
  u.name,
  u.email,
  u."totalEarnings"::numeric as current_balance,
  COALESCE(calc.correct_balance, 0) as should_be,
  pr.amount::numeric as requested_amount,
  pr.status as request_status,
  pr."requestedAt",
  CASE 
    WHEN pr.id IS NULL THEN 'No request - will get full new balance'
    WHEN pr.status = 'PENDING' THEN 'Has pending request - after payout they''ll have ' || 
      (COALESCE(calc.correct_balance, 0) - pr.amount::numeric)::text || ' remaining'
    WHEN pr.status = 'COMPLETED' THEN 'Already paid - new balance is bonus!'
    ELSE 'Request status: ' || pr.status
  END as impact
FROM users u
LEFT JOIN (
  SELECT cs."userId", SUM(cl.earnings::numeric) as correct_balance
  FROM clip_submissions cs
  JOIN clips cl ON cl.id = cs."clipId"
  WHERE cs.status = 'APPROVED'
  GROUP BY cs."userId"
) calc ON calc."userId" = u.id
LEFT JOIN payout_requests pr ON pr."userId" = u.id 
  AND pr.status IN ('PENDING', 'APPROVED', 'PROCESSING')
WHERE (u."totalEarnings" > 0 OR COALESCE(calc.correct_balance, 0) > 0)
  AND ABS(COALESCE(calc.correct_balance, 0) - u."totalEarnings"::numeric) > 0.01
ORDER BY (COALESCE(calc.correct_balance, 0) - u."totalEarnings"::numeric) DESC;

