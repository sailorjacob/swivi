-- Debug budget exhausted issue
-- Check campaigns with their budget and spent values

SELECT 
  id,
  title,
  budget,
  spent,
  budget::numeric as budget_numeric,
  spent::numeric as spent_numeric,
  CASE WHEN spent >= budget THEN 'EXHAUSTED' ELSE 'HAS_BUDGET' END as budget_status,
  (budget - COALESCE(spent, 0)) as remaining,
  status
FROM campaigns
WHERE status = 'ACTIVE'
  AND "deletedAt" IS NULL
ORDER BY title;

-- Check if any campaigns have spent >= budget but are still ACTIVE
SELECT 
  id,
  title,
  budget,
  spent,
  status
FROM campaigns
WHERE status = 'ACTIVE'
  AND spent >= budget
  AND "deletedAt" IS NULL;

-- Check campaigns that should be accepting submissions (spent < budget, status ACTIVE)
SELECT 
  id,
  title,
  budget,
  spent,
  (budget - COALESCE(spent, 0)) as remaining,
  status
FROM campaigns
WHERE status = 'ACTIVE'
  AND spent < budget
  AND "deletedAt" IS NULL;
















