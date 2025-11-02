# Automatic Campaign Spend Sync System

## ✅ What Changed

Campaign.spent now **automatically syncs** from actual clip earnings instead of relying on incremental updates.

## 🎯 How It Works

### **Before (Incremental)**
```typescript
// Old way: Add to spent each time
campaign.spent = campaign.spent + earningsToAdd
// Problem: If update fails, spent drifts out of sync
```

### **After (Recalculated)**
```typescript
// New way: Recalculate from actual clips every time
actualSpent = SUM(approved_clip_earnings)
campaign.spent = actualSpent
// Always accurate! ✅
```

## 📁 Files Created

### 1. **`lib/campaign-spend-sync.ts`**
Utility class with sync functions:
- `syncCampaign(id)` - Sync one campaign
- `syncAllCampaigns()` - Sync all campaigns
- `getSyncStatus()` - Preview what needs syncing

### 2. **`app/api/admin/campaigns/sync-spend/route.ts`**
API endpoint for manual syncing:
- `GET` - Preview sync status
- `POST` - Execute sync

### 3. **Updated `lib/view-tracking-service.ts`**
Now recalculates campaign.spent from actual clips on EVERY view tracking update.

## 🚀 How to Use

### **Automatic (Recommended)**
Campaign.spent now syncs automatically during view tracking. No action needed!

### **Manual Sync via API**

#### Preview what needs syncing:
```bash
curl -X GET https://your-domain.com/api/admin/campaigns/sync-spend
```

Response:
```json
{
  "campaigns": [
    {
      "title": "Ultimate Test Campaign",
      "recordedSpent": 3075.93,
      "actualSpent": 4546.32,
      "difference": 1470.39,
      "needsSync": true
    }
  ],
  "summary": {
    "total": 1,
    "needsSync": 1,
    "totalDifference": 1470.39
  }
}
```

#### Sync all campaigns:
```bash
curl -X POST https://your-domain.com/api/admin/campaigns/sync-spend
```

#### Sync specific campaign:
```bash
curl -X POST https://your-domain.com/api/admin/campaigns/sync-spend \
  -H "Content-Type: application/json" \
  -d '{"campaignId": "YOUR_CAMPAIGN_ID"}'
```

### **Manual Sync via Admin UI**
I can add a "Sync Spent" button to the admin campaigns page if you want!

## 🔒 Benefits

1. **Always Accurate** - campaign.spent matches actual clip earnings
2. **Self-Healing** - Fixes drift automatically on every view tracking run
3. **No More Orphans** - Only counts clips with approved submissions
4. **Transaction Safe** - Recalculates within database transaction

## 🧪 Testing

After deploying, check your campaign:
```
Campaign Spent: $4546.32 ✅ (now matches total earnings)
Total Earned: $4546.32 ✅
```

Both should match now!

## ⚡ Performance Note

This adds a small query overhead (summing clip earnings) but happens in a transaction and only runs during view tracking (every 4 hours), so impact is minimal.

## 🎨 Optional: Add Sync Button to Admin UI

Want me to add a "Sync Campaign Spend" button to the admin campaigns page? 
It would let you manually trigger a sync with one click.

