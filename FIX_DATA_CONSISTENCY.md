# Fix Data Consistency Issues - Complete Guide

## 🎯 Overview

This guide provides step-by-step instructions to fix data consistency issues in the Swivi platform, specifically:

1. ✅ **Profile view count mismatch** - Profile shows 6,153,896 views but dashboard shows different number
2. ✅ **Invalid Date display** - Member Since showing "Invalid Date"
3. ✅ **Campaign spend accuracy** - Ensuring campaign progress reflects accurate amounts
4. ✅ **Earnings display** - Making sure all earnings are calculated from real-time data

---

## 🔍 What Was Wrong

### Problem 1: Cached vs Real-Time Data

**Profile Page** was showing cached values from the `User` table:
- `User.totalViews` = 6,153,896 (old accumulated data)
- `User.totalEarnings` = $2,960.79

**Dashboard** was calculating real-time from actual clip data:
- Sums up latest `view_tracking.views` for each approved clip
- More accurate, but different from profile

### Problem 2: Multiple View Tracking Systems

Over time, different parts of the codebase updated `User.totalViews`:

1. `lib/x-view-tracking.ts` - Old X/Twitter tracking (incremented User totals)
2. `lib/database-utils.ts` - Database utility functions (incremented User totals)
3. `lib/view-tracking-service.ts` - Current unified tracking (**does NOT update User totals**)

This caused **old data to accumulate** without being corrected.

### Problem 3: Invalid Date

The `User.createdAt` field was sometimes null or in an invalid format, causing "Invalid Date" to display.

---

## ✅ Solutions Implemented

### Solution 1: Profile API Now Uses Real-Time Calculations

**File**: `app/api/user/profile/route.ts`

**Change**: Instead of returning cached `User.totalViews` and `User.totalEarnings`, the API now:
1. Fetches all approved submissions with their clips
2. Calculates total earnings from `clip.earnings`
3. Calculates total views from latest `view_tracking.views`
4. Returns these calculated values

**Result**: Profile page now matches dashboard exactly.

### Solution 2: Fixed Invalid Date Display

**File**: `app/clippers/dashboard/profile/page.tsx`

**Change**: Added validation before displaying date:
```typescript
{user?.createdAt && !isNaN(new Date(user.createdAt).getTime()) 
  ? new Date(user.createdAt).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  : "N/A"}
```

**Result**: Shows formatted date like "October 15, 2024" or "N/A" if invalid.

### Solution 3: Created Recalculation Scripts

**Scripts Created**:
1. `scripts/recalculate-user-totals.sql` - SQL script to fix User table
2. `scripts/recalculate-user-totals.js` - Node.js script with progress reporting
3. `scripts/verify-campaign-spend.js` - Verify campaign spend accuracy

---

## 🚀 How to Fix Your Data

### Step 1: Backup Your Database

**CRITICAL**: Always backup before running updates!

```bash
# Create a backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Option A - Run Node.js Script (Recommended)

The Node.js script provides detailed progress and can be run in dry-run mode first.

```bash
# First, do a dry run to see what would change
node scripts/recalculate-user-totals.js --dry-run

# If it looks good, run it for real
node scripts/recalculate-user-totals.js

# Or fix just one user
node scripts/recalculate-user-totals.js --user-id=YOUR_USER_ID
```

**Output Example**:
```
📝 User: john@example.com
   Views:    6,153,896 → 4,892,450 (-1,261,446)
   Earnings: $2,960.79 → $2,960.79 (+$0.00)

📊 SUMMARY
Total Users Processed: 45
Users Needing Update: 12
Total Views Difference: -3,245,678
```

### Step 2: Option B - Run SQL Script

```bash
# Run the SQL script
psql $DATABASE_URL -f scripts/recalculate-user-totals.sql
```

This will show a summary before and after updating.

### Step 3: Verify Campaign Spend

```bash
# Check if campaign spend is accurate
node scripts/verify-campaign-spend.js

# Fix any discrepancies found
node scripts/verify-campaign-spend.js --fix
```

### Step 4: Verify the Fix

1. **Check Profile Page**: Go to `/clippers/dashboard/profile`
   - Total Views should now match dashboard
   - Member Since should show a proper date
   - Total Earnings should be accurate

2. **Check Dashboard**: Go to `/clippers/dashboard`
   - Total Earned should match profile
   - Total Views should match profile
   - Campaign progress bars should be accurate

3. **Check Database** (optional):
```sql
-- See top users by views
SELECT 
  email, 
  "totalViews", 
  "totalEarnings",
  (SELECT COUNT(*) FROM clip_submissions WHERE "userId" = users.id AND status = 'APPROVED') as approved_clips
FROM users 
WHERE "totalViews" > 0
ORDER BY "totalViews" DESC 
LIMIT 10;
```

---

## 🔧 Technical Details

### How Real-Time Calculations Work

#### Before (Cached - Wrong):
```typescript
// Profile showed cached User table values
return {
  totalViews: user.totalViews,      // Old accumulated data
  totalEarnings: user.totalEarnings // Old accumulated data
}
```

#### After (Real-Time - Correct):
```typescript
// Profile calculates from actual clip data
const totalViews = userData.clipSubmissions
  .filter(s => s.status === 'APPROVED')
  .reduce((sum, submission) => {
    const latestViews = Number(submission.clips.view_tracking[0].views || 0)
    return sum + latestViews
  }, 0)

const totalEarnings = userData.clipSubmissions
  .filter(s => s.status === 'APPROVED')
  .reduce((sum, submission) => {
    return sum + Number(submission.clips.earnings || 0)
  }, 0)
```

### View Tracking Flow

```
1. Cron Job Runs Every 4 Hours
   └─> /api/cron/view-tracking
       └─> ViewTrackingService.processViewTracking()

2. For Each Active Clip:
   └─> Scrape current views from platform
   └─> Update Clip.views (absolute number)
   └─> Upsert ViewTracking record (daily snapshot)
   └─> Calculate earnings from view growth
   └─> Update Clip.earnings
   └─> Update Campaign.spent
   └─> Check if campaign budget reached

3. Display on Frontend:
   └─> Dashboard: Sum of Clip.earnings and latest ViewTracking.views
   └─> Profile: Same calculation (now fixed!)
   └─> Campaigns: Show Campaign.spent / Campaign.budget
```

### Data Sources

| Display Location | Data Source | Update Frequency |
|-----------------|-------------|------------------|
| Profile Total Views | Calculated from ViewTracking | Real-time |
| Profile Total Earnings | Calculated from Clip.earnings | Real-time |
| Dashboard Total Views | Calculated from ViewTracking | Real-time |
| Dashboard Total Earnings | Calculated from Clip.earnings | Real-time |
| Campaign Spent | Campaign.spent | Updated every 4 hours |
| Campaign Progress | Campaign.spent / Campaign.budget | Real-time |

---

## 🎯 Expected Results

### Before Fix:
- **Profile**: 6,153,896 views, $2,960.79 earnings
- **Dashboard**: Different view count
- **Member Since**: Invalid Date

### After Fix:
- **Profile**: Accurate view count matching dashboard
- **Dashboard**: Same accurate count
- **Member Since**: Proper formatted date
- **All displays**: Show identical data from same source

---

## 🔄 Ongoing Maintenance

### The Fix is Permanent

After running the recalculation scripts and deploying the updated code:

1. ✅ Profile API now calculates from clips (not cached User fields)
2. ✅ Dashboard API already calculated from clips
3. ✅ Both use identical calculation logic
4. ✅ Data will stay consistent going forward

### User.totalViews and User.totalEarnings

These fields are still updated by the view tracking service for backwards compatibility, but:
- **Profile** no longer uses them (calculates from clips)
- **Dashboard** never used them (always calculated from clips)
- They're incrementally updated but not relied upon for display

### When to Re-run Scripts

You should re-run the recalculation scripts if:
- You notice discrepancies in the data again
- You've made manual database changes
- You've migrated or restored data

---

## 📊 Monitoring

### Check Data Consistency Regularly

```bash
# Quick check - compare cached vs calculated for all users
node scripts/recalculate-user-totals.js --dry-run

# Check campaign spend accuracy
node scripts/verify-campaign-spend.js
```

### SQL Queries for Manual Verification

```sql
-- Compare cached vs calculated views for a user
SELECT 
  u.email,
  u."totalViews" as cached_views,
  COALESCE(SUM(vt.views), 0) as calculated_views,
  u."totalEarnings" as cached_earnings,
  COALESCE(SUM(c.earnings), 0) as calculated_earnings
FROM users u
LEFT JOIN clip_submissions cs ON cs."userId" = u.id AND cs.status = 'APPROVED'
LEFT JOIN clips c ON c.id = cs."clipId"
LEFT JOIN LATERAL (
  SELECT views FROM view_tracking vt2 
  WHERE vt2."clipId" = c.id 
  ORDER BY vt2.date DESC 
  LIMIT 1
) vt ON true
WHERE u.email = 'your-email@example.com'
GROUP BY u.id, u.email, u."totalViews", u."totalEarnings";
```

---

## 🎉 Summary

✅ **Fixed**: Profile now shows real-time data from clips  
✅ **Fixed**: Invalid Date display issue  
✅ **Created**: Scripts to recalculate user totals  
✅ **Created**: Script to verify campaign spend  
✅ **Documented**: Complete data flow and architecture  

**Result**: All earnings and views are now calculated from real-time clip data, ensuring 100% accuracy and consistency across the platform.

