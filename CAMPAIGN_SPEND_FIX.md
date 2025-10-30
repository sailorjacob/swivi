# Campaign Spend Synchronization Fix

## 🎯 Problem

Campaign.spent showing **$1,586** but user's pending earnings showing **$2,449** - a **$863 discrepancy**.

## 🔍 Root Cause

### How Campaign.spent Gets Updated

`Campaign.spent` is updated **incrementally** by the view tracking cron job:

```typescript
// lib/view-tracking-service.ts lines 187-195
await tx.campaign.update({
  where: { id: campaign.id },
  data: {
    spent: newSpent  // campaignSpent + earningsToAdd
  }
})
```

**The Problem**: Campaign.spent is only updated when:
1. The cron job runs (every 4 hours)
2. For each clip that gets tracked
3. When earningsToAdd > 0

If any of these fail or are missed, campaign.spent will be **less** than the actual sum of clip earnings.

### How Pending Earnings Are Calculated

Pending earnings are calculated from **actual clip data**:

```typescript
// app/api/clippers/dashboard/route.ts lines 253-257
const activeCampaignEarnings = userData.clipSubmissions
  .filter(s => s.status === 'APPROVED' && s.campaigns.status === 'ACTIVE')
  .reduce((sum, submission) => {
    return sum + Number(submission.clips?.earnings || 0)
  }, 0)
```

**This is always accurate** because it sums the actual `Clip.earnings` values.

## 💡 Why the Mismatch Happens

### Scenario 1: Missed Cron Updates
- Cron job processes clip A → updates clip.earnings = $500
- Cron should update campaign.spent += $500
- But if the transaction fails or is interrupted, campaign.spent doesn't get updated
- Result: clip.earnings = $500, but campaign.spent = $0

### Scenario 2: Clips Tracked at Different Times
- Day 1: Clip A tracked, earned $100, campaign.spent = $100
- Day 2: Clip B tracked, earned $200, campaign.spent should be $300
- Day 3: Clip C tracked, earned $150, campaign.spent should be $450
- If Day 2 update failed, campaign.spent = $250 instead of $450

### Scenario 3: Race Conditions
- Multiple clips being processed simultaneously
- One update might overwrite another
- Campaign.spent ends up lower than actual total

## ✅ Solution

Recalculate `campaign.spent` from the actual sum of all approved clip earnings.

### Script Created

`scripts/sync-campaign-spend.js` - Syncs campaign.spent with actual clip earnings

## 🚀 How to Fix

### Step 1: Preview What Will Change

```bash
# See what's out of sync without making changes
node scripts/sync-campaign-spend.js --dry-run
```

**Example Output**:
```
⚠️  Campaign: Owning Manhattan Campaign
    ID: cm123...
    Status: ACTIVE
    Budget: $3,000.00
    Recorded Spent: $1,586.00 (52.9%)
    Actual Spent: $2,449.00 (81.6%)
    Difference: +$863.00
    Approved Clips: 12
```

### Step 2: Apply the Fix

```bash
# Sync all campaigns
node scripts/sync-campaign-spend.js

# Or sync just your campaign
node scripts/sync-campaign-spend.js --campaign-id=YOUR_CAMPAIGN_ID
```

### Step 3: Verify

After running the script:
1. Check your campaign dashboard
2. Campaign.spent should now match your pending earnings
3. Progress bars should reflect accurate spend

## 📊 Technical Details

### Data Flow

```
Cron Job (Every 4 Hours)
    ↓
For Each Active Clip:
    ├─> Scrape current views
    ├─> Calculate earnings from view growth
    ├─> Update Clip.earnings (ACCURATE ✅)
    ├─> Update Campaign.spent (CAN FAIL ❌)
    └─> Update User.totalEarnings (optional)

Display Layer:
    ├─> Pending Earnings: Sum of Clip.earnings ✅ ACCURATE
    └─> Campaign Spent: Campaign.spent ❌ MAY BE STALE
```

### Why Clip.earnings is Always Right

Clip.earnings is updated in the same transaction as the view tracking:

```typescript
await prisma.$transaction(async (tx) => {
  // These happen together - if one fails, both rollback
  await tx.clip.update({ 
    data: { earnings: { increment: earningsToAdd } }
  })
  
  await tx.campaign.update({ 
    data: { spent: newSpent }
  })
})
```

But if the transaction **partially succeeds** or there are **race conditions** with multiple clips, campaign.spent can drift.

### The Correct Calculation

```typescript
// Always accurate - sums actual clip earnings
const actualCampaignSpend = await prisma.clipSubmission.findMany({
  where: {
    campaignId: campaignId,
    status: 'APPROVED'
  },
  include: {
    clips: { select: { earnings: true } }
  }
})

const totalSpent = actualCampaignSpend.reduce((sum, submission) => {
  return sum + Number(submission.clips?.earnings || 0)
}, 0)
```

This is what the sync script does - it recalculates from actual data.

## 🔄 Prevention

### Long-term Fix Options

#### Option 1: Make Campaign.spent a Computed Field (Recommended)

Instead of storing campaign.spent, calculate it on-demand:

```typescript
// In API responses
const campaign = await prisma.campaign.findUnique({
  where: { id },
  include: {
    clipSubmissions: {
      where: { status: 'APPROVED' },
      include: {
        clips: { select: { earnings: true } }
      }
    }
  }
})

// Calculate spent from actual earnings
const spent = campaign.clipSubmissions.reduce((sum, s) => 
  sum + Number(s.clips?.earnings || 0), 0
)

return {
  ...campaign,
  spent
}
```

**Pros**: Always accurate, no sync issues  
**Cons**: Slightly more complex queries

#### Option 2: Verify Campaign.spent in Cron

Add verification step to cron job:

```typescript
// After processing all clips
const actualSpent = calculateActualSpent(campaignId)
if (Math.abs(campaign.spent - actualSpent) > 0.01) {
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { spent: actualSpent }
  })
}
```

**Pros**: Self-correcting  
**Cons**: Still relies on cron running

#### Option 3: Run Sync Script Regularly

Add to cron jobs:

```bash
# In vercel.json or cron config
0 0 * * * node scripts/sync-campaign-spend.js
```

**Pros**: Simple, uses existing infrastructure  
**Cons**: Only fixes issues after they occur

## 📈 Expected Results

### Before Fix:
```
Your Profile:
├─ Pending Earnings: $2,449 ✅ (from actual clip.earnings)
└─ Campaign Dashboard:
    └─ Campaign Spent: $1,586 ❌ (stale cached value)
```

### After Fix:
```
Your Profile:
├─ Pending Earnings: $2,449 ✅ (from actual clip.earnings)
└─ Campaign Dashboard:
    └─ Campaign Spent: $2,449 ✅ (synced with actual earnings)
```

## 🎉 Summary

**Issue**: Campaign.spent ($1,586) doesn't match actual clip earnings ($2,449)  
**Cause**: Incremental updates can be missed or fail  
**Fix**: Run `node scripts/sync-campaign-spend.js`  
**Prevention**: Consider making campaign.spent a computed field  

After running the sync script, all campaign spend values will accurately reflect the sum of actual clip earnings.

