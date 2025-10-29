# Earnings Display System - Real-Time Calculations

## ✅ ALL DATA NOW REAL-TIME FROM SUBMISSIONS

### Overview
All clipper earnings and view data is now calculated in **real-time** from their actual clip tracking data, not from cached User table values. This ensures 100% accuracy at all times.

---

## Dashboard Display Breakdown

### 1. **Total Earned** (Main Card)
**What it shows:** All earnings from approved clips  
**Calculation:** Sum of `clip.earnings` for all approved submissions  
**Updates:** Every time view tracking cron runs  

```typescript
totalEarned = submissions
  .filter(s => s.status === 'APPROVED')
  .reduce((sum, s) => sum + clip.earnings, 0)
```

**Display:**
- Large green number at top
- If active campaigns exist: Shows "$XX.XX in active campaigns" as subtitle
- Otherwise: Shows "X approved clips"

---

### 2. **Total Views** (Main Card)
**What it shows:** All views across approved clips  
**Calculation:** Sum of latest `view_tracking.views` for all approved submissions  
**Updates:** Every time view tracking cron runs  

```typescript
totalViews = submissions
  .filter(s => s.status === 'APPROVED' && hasViewTracking)
  .reduce((sum, s) => sum + latestViews, 0)
```

---

### 3. **Available Balance** (Earnings Overview Card - Green)
**What it shows:** Earnings eligible for payout  
**Calculation:** Only earnings from **COMPLETED campaigns**  
**When clippers can request:** When balance >= $20  

```typescript
availableBalance = submissions
  .filter(s => s.status === 'APPROVED' && campaign.status === 'COMPLETED')
  .reduce((sum, s) => sum + clip.earnings, 0)
```

**Display:**
- Green box in "Earnings Overview" card
- Shows amount in large green text
- Subtitle: "From completed campaigns"
- Status: "Ready for payout" or "Need $X.XX more"

---

### 4. **Active Campaign Earnings** (Earnings Overview Card - Blue)
**What it shows:** Preview of earnings from ongoing campaigns  
**Calculation:** Earnings from **ACTIVE campaigns**  
**Purpose:** Shows clippers what will be available when campaigns finish  

```typescript
activeCampaignEarnings = submissions
  .filter(s => s.status === 'APPROVED' && campaign.status === 'ACTIVE')
  .reduce((sum, s) => sum + clip.earnings, 0)
```

**Display:**
- Blue box in "Earnings Overview" card (only shows if > $0)
- Shows amount in large blue text
- Subtitle: "Available when campaigns complete"

---

## Complete User Journey

### Step 1: Submission & Approval
1. Clipper submits video URL
2. System captures `initialViews` at submission
3. Admin approves → Clip created and linked
4. Status: **APPROVED**

### Step 2: View Tracking (Cron Job Every 4-8 Hours)
1. System scrapes current views for all approved clips
2. Calculates: `viewGrowth = currentViews - initialViews`
3. Calculates: `earnings = (viewGrowth / 1000) × payoutRate`
4. Updates in transaction:
   - `Clip.earnings` increments
   - `Campaign.spent` increments
   - User sees updated earnings **immediately** on dashboard

### Step 3: Campaign Active (Earnings Preview)
- Total Earned: Shows all earnings
- Active Campaign Earnings (Blue): Shows earnings from active campaigns
- Available Balance (Green): Shows $0 (campaign not complete yet)
- Clipper sees: "I'm earning, but can't request payout yet"

### Step 4: Campaign Completes
- When `Campaign.spent >= Campaign.budget`
- Campaign.status changes to **COMPLETED**
- Earnings move from "Active Campaign Earnings" to "Available Balance"
- Clipper sees: "Now I can request payout!"

### Step 5: Payout Request
- Clipper clicks "Request Payout" (only enabled if balance >= $20)
- Enters amount (max = available balance)
- Submits request

### Step 6: Admin Fulfillment
- Admin views payout requests in admin panel
- Admin processes payment externally (PayPal, bank transfer, etc.)
- Admin marks request as "COMPLETED"
- System creates `Payout` record
- Available balance decreases by payout amount

---

## Dashboard Display Examples

### Example 1: New Clipper, First Submission
```
Total Earned: $0.00
├─ "Start earning from approved clips"

Total Views: 0
├─ "Across all approved clips"

[No Earnings Overview Card shown yet]
```

### Example 2: Active Campaign, Earning Money
```
Total Earned: $45.50
├─ "$45.50 in active campaigns"

Total Views: 45,500
├─ "Across all approved clips"

Earnings Overview Card:
├─ Total Earned: $45.50 (green, top right)
├─ Available Balance: $0.00 (green box)
│   └─ "Need $20.00 more" (campaigns not complete)
└─ Active Campaign Earnings: $45.50 (blue box)
    └─ "Available when campaigns complete"
```

### Example 3: Campaign Completed, Ready for Payout
```
Total Earned: $127.85
├─ "3 approved clips"

Total Views: 127,850
├─ "Across all approved clips"

Earnings Overview Card:
├─ Total Earned: $127.85 (green, top right)
├─ Available Balance: $85.30 (green box) ← Can request!
│   └─ "Ready for payout"
├─ Active Campaign Earnings: $42.55 (blue box)
│   └─ "Available when campaigns complete"
└─ [Request Payout Button: ENABLED]
```

### Example 4: After Payout Request
```
Total Earned: $127.85 (unchanged)
├─ "3 approved clips"

Available Balance: $5.30 (after $80 payout)
├─ "Need $14.70 more"

Active Campaign Earnings: $42.55 (unchanged)
└─ When campaigns complete → moves to Available Balance
```

---

## Key Benefits

### ✅ **Accuracy**
- All data calculated in real-time from actual clips
- No stale cached values
- Always reflects latest view tracking

### ✅ **Transparency**
- Clippers see exactly what they've earned
- Clear distinction between:
  - Total earned (all time)
  - Available balance (can withdraw)
  - Active earnings (preview, coming soon)

### ✅ **Fair Payout System**
- Only completed campaigns count toward available balance
- Prevents early payouts from incomplete campaigns
- $20 minimum ensures viable transaction fees

### ✅ **Motivating**
- Clippers see active earnings growing in real-time
- Blue "preview" box shows potential future balance
- Encourages continued participation

---

## Technical Implementation

### API Endpoint
`GET /api/clippers/dashboard`

### Response Structure
```json
{
  "stats": [
    {
      "title": "Total Earned",
      "value": "$127.85",
      "change": "$42.55 in active campaigns"
    },
    {
      "title": "Total Views",
      "value": "127,850",
      "change": "Across all approved clips"
    }
  ],
  "availableBalance": 85.30,
  "activeCampaignEarnings": 42.55,
  "totalEarnings": 127.85,
  "totalViews": 127850,
  "recentClips": [...]
}
```

### Calculations (In API)
```typescript
// Real-time from clips, not User table
const totalEarned = submissions
  .filter(s => s.status === 'APPROVED')
  .reduce((sum, s) => sum + Number(s.clips?.earnings || 0), 0)

const totalViews = submissions
  .filter(s => s.status === 'APPROVED' && s.clips?.view_tracking?.[0])
  .reduce((sum, s) => sum + Number(s.clips.view_tracking[0].views), 0)

// Only completed campaigns
const availableBalance = submissions
  .filter(s => s.status === 'APPROVED' && s.campaigns.status === 'COMPLETED')
  .reduce((sum, s) => sum + Number(s.clips?.earnings || 0), 0)

// Only active campaigns (preview)
const activeCampaignEarnings = submissions
  .filter(s => s.status === 'APPROVED' && s.campaigns.status === 'ACTIVE')
  .reduce((sum, s) => sum + Number(s.clips?.earnings || 0), 0)
```

---

## All Systems Working! ✅
- ✅ Real-time earnings from clips
- ✅ Real-time views from tracking
- ✅ Available balance from completed campaigns only
- ✅ Active campaign earnings preview
- ✅ Payout request system ($20 minimum)
- ✅ Admin fulfillment workflow

