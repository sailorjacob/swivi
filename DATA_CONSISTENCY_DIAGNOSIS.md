# Data Consistency Issues - Diagnosis & Solution

## 🔍 Problem Summary

The profile page at `/clippers/dashboard/profile` shows incorrect data:
- **Total Views**: 6,153,896 (incorrect - cached value)
- **Total Earnings**: $2,960.79 (correct)
- **Member Since**: Invalid Date (null/invalid createdAt)
- **Dashboard views don't match profile views**

## 🐛 Root Causes

### 1. **Cached vs Real-Time Data Mismatch**

#### Profile Page (CACHED - WRONG)
- **Location**: `app/clippers/dashboard/profile/page.tsx` lines 547, 551
- **Data Source**: User table fields `totalViews` and `totalEarnings`
- **Problem**: These are accumulated fields that were incremented by old tracking systems

```typescript
// Profile shows cached values from User table
<span>{user?.totalViews?.toLocaleString() || "0"}</span>
<span>${user?.totalEarnings?.toFixed(2)}</span>
```

#### Dashboard Page (REAL-TIME - CORRECT)
- **Location**: `app/api/clippers/dashboard/route.ts` lines 220-231
- **Data Source**: Calculated from actual clip submissions
- **Calculation**: Sums up earnings and latest view_tracking from approved clips

```typescript
// Dashboard calculates real-time from clips
const totalEarned = userData.clipSubmissions
  .filter(s => s.status === 'APPROVED')
  .reduce((sum, submission) => sum + Number(submission.clips?.earnings || 0), 0)

const totalViews = userData.clipSubmissions
  .filter(s => s.status === 'APPROVED' && s.clips?.view_tracking?.[0])
  .reduce((sum, submission) => {
    const latestViews = Number(submission.clips.view_tracking[0].views || 0)
    return sum + latestViews
  }, 0)
```

### 2. **Old Data Accumulation**

Multiple view tracking systems have been updating `User.totalViews`:

#### Old System 1: `lib/x-view-tracking.ts` (lines 274-282, 308-315)
```typescript
// Increments User.totalViews with view differences
await prisma.user.update({
  where: { id: submission.userId },
  data: {
    totalViews: {
      increment: viewDifference  // or currentViews
    }
  }
})
```

#### Old System 2: `lib/database-utils.ts` (lines 86-94)
```typescript
// Also increments User.totalViews
await tx.user.update({
  where: { id: data.userId },
  data: {
    totalViews: {
      increment: BigInt(data.views)
    }
  }
})
```

#### Current System: `lib/view-tracking-service.ts` (lines 103-136)
```typescript
// DOES NOT update User table - only Clip and ViewTracking tables
await prisma.clip.update({
  where: { id: clipId },
  data: { views: BigInt(currentViews) }
})

await prisma.viewTracking.upsert({
  // ... only updates view_tracking table
})
```

**Result**: User.totalViews contains old accumulated data that doesn't match current clip view_tracking records.

### 3. **Invalid Date Issue**

Line 556 in profile page:
```typescript
{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
```

The `createdAt` field is either null, undefined, or in an invalid format.

### 4. **Campaign Spend Accuracy**

Campaign spend is updated correctly in `lib/view-tracking-service.ts` (lines 187-195), but we need to verify it's calculating correctly across all campaigns.

## ✅ Solutions

### Solution 1: Recalculate User Totals from Actual Clip Data (SQL)

This will reset all User.totalViews and totalEarnings to match actual clip data.

### Solution 2: Update Profile to Use Real-Time Data

Make profile page use the same calculation as dashboard.

### Solution 3: Fix Invalid Date

Ensure createdAt is properly formatted as ISO string.

## 📊 Data Flow (Current State)

```
View Tracking Cron
    ↓
Scrape Views → Update Clip.views
    ↓
Update ViewTracking table (latest views)
    ↓
Calculate Earnings → Update Clip.earnings
    ↓
Update Campaign.spent
    ↓
[NO LONGER UPDATES User.totalViews/totalEarnings] ← OLD DATA REMAINS
```

## 📋 Recommendations

1. **Run recalculation script** to fix User table cached values
2. **Update profile API** to calculate from clips (like dashboard does)
3. **Remove old view tracking code** that increments User totals
4. **Verify campaign spend** calculations are accurate
5. **Add data validation** to ensure createdAt is always set

