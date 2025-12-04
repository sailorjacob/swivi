# 🎬 Owning Manhattan Season 2 — Campaign Setup Guide

This document covers everything you need to launch the Owning Manhattan Season 2 clipping campaign, including the bonus system and special UI features.

---

## 📋 Quick Start

### Option 1: Create via Admin Dashboard

1. Go to **Admin Dashboard** → **Campaigns**
2. Click **"New Campaign"**
3. Fill in these details:

| Field | Value |
|-------|-------|
| Title | `Owning Manhattan Season 2 — Official Clipping Campaign` |
| Creator | `Netflix × SERHANT` |
| Description | `Season 2 is LIVE on Netflix! This is our biggest clipping campaign ever with a $20,000 total budget. Post clips, drive views, and earn $1 per 1,000 views automatically. Plus $2,000 in bounties for performance-based bonuses. Move fast and start earning!` |
| Budget | `20000` |
| Payout Rate | `1` ($1 per 1K views) |
| Status | `ACTIVE` |
| Platforms | ✅ TikTok, ✅ YouTube, ✅ Instagram |
| Featured Image | (Upload your campaign image) |

**Requirements (paste these, one per line):**
```
Must tag @owningmanhattan in the post caption
Must tag @serhant in the post caption
Must tag @ryanserhant in the post caption
Must use approved content from the shared Google Drive folders
If recording your own clips from Season 2, clips must be clear, relevant, and tied to Season 2 promotion
Caption must include: "Season 2 now on Netflix"
Recommended: Post 3-7 clips per day
Best clips are 6-15 seconds with fast hooks
Add subtitles and on-screen context for best results
```

### Option 2: Create via SQL

Run the SQL query in `/scripts/create-owning-manhattan-s2.sql` in your Supabase SQL Editor.

**Before running:**
1. Update the `featured_image` URL to your actual image URL
2. Verify the campaign details are correct

---

## 🎯 New UI Features Implemented

### 1. Campaign Bonus Modal
A stunning, animated modal that displays all bonus/bounty information:
- **Overview Tab**: Key stats, payout info, quick view
- **Bonus Tiers Tab**: Detailed tier 1 & tier 2 bounty info with requirements
- **Rules & Tips Tab**: Content rules and earning tips

**Location**: `components/campaigns/campaign-bonus-modal.tsx`

### 2. Featured Campaign Banner
Automatically appears on the campaigns page when there's an active featured campaign (budget ≥ $10K + has bonuses).

Shows:
- Campaign title with "LIVE NOW" badge
- Total budget and bonus amount
- Payout rate
- Quick action buttons

### 3. Bonus Badges on Campaign Cards
Campaign cards now show a golden "BONUSES" badge for campaigns with bonus rewards.

### 4. Bonus Button on Cards
A dedicated "View Bonuses" button (trophy icon) appears on eligible campaign cards.

---

## 💰 Bonus Structure (As Implemented)

### Tier 1 — High-Follower Volume Bounty
- **Reward**: $150 per creator
- **Total**: $1,200 (8 spots)
- **Requirements**:
  - 10,000+ followers on TikTok, IG, or YouTube
  - Screenshot + profile link verification
  - Post 14 clips within 7 days
- **Note**: First come, first served

### Tier 2 — Quality Bounty
- **Reward**: $40 per winning clip
- **Total**: $800 (20 winners)
- **Selection**:
  - Week 1: Top 10 clips
  - Week 2: Top 10 clips
- **Criteria**: Best editing and viewer retention

---

## 🔧 How the Bonus Detection Works

The system automatically detects bonus-eligible campaigns using these criteria:

```typescript
// Campaign has bonuses if title includes "owning manhattan" and "season 2"
const hasBonuses = (campaign) => {
  return campaign.title.toLowerCase().includes('owning manhattan') && 
         campaign.title.toLowerCase().includes('season 2')
}

// Campaign is featured if budget >= $10K and has bonuses
const isFeaturedCampaign = (campaign) => {
  return campaign.budget >= 10000 && hasBonuses(campaign)
}
```

To make a campaign show bonuses, ensure the title contains both "owning manhattan" and "season 2".

---

## 📁 Files Modified/Created

### New Files
- `components/campaigns/campaign-bonus-modal.tsx` - The bonus modal component
- `scripts/create-owning-manhattan-s2.sql` - SQL script to create the campaign
- `OWNING_MANHATTAN_S2_SETUP.md` - This setup guide

### Modified Files
- `app/clippers/dashboard/campaigns/page.tsx` - Added bonus modal, featured banner, bonus buttons
- `components/campaigns/live-campaigns.tsx` - Added bonus modal, featured hero section, bonus badges

---

## 🚀 Deployment Checklist

- [ ] Upload campaign featured image to Supabase storage or use existing URL
- [ ] Create campaign via Admin Dashboard or SQL
- [ ] Verify campaign appears on Activations page with bonuses badge
- [ ] Test bonus modal opens correctly
- [ ] Verify featured banner shows on campaigns page
- [ ] Test mobile responsiveness
- [ ] Share Google Drive folder links with clippers
- [ ] Announce campaign in Discord

---

## 📝 Notes for Manual Bonus Tracking

Since bonuses are handled offline, keep track of:

1. **Tier 1 Spots**: Track which 8 creators qualify and complete the requirements
2. **Tier 2 Winners**: Keep a spreadsheet of weekly top 10 clip selections
3. **Bonus Payouts**: Process separately from regular view-based payouts

**Suggested tracking spreadsheet columns:**
- Creator name/email
- Social profile link
- Follower count
- Tier applied for
- Clips submitted (for Tier 1 count)
- Bonus status (Pending/Qualified/Paid)
- Amount owed

---

## 🎨 Customizing the Bonus Modal

To update bonus tiers or content, edit `components/campaigns/campaign-bonus-modal.tsx`:

```typescript
const bonusTiers: BonusTier[] = [
  {
    name: "TIER 1 — High-Follower Volume Bounty",
    icon: <Crown className="w-5 h-5" />,
    reward: "$150 per creator",
    totalPayout: "$1,200",
    spots: 8,
    spotsRemaining: 8, // Update this as spots fill!
    requirements: [
      // Update requirements here
    ],
    description: "Your description",
    deadline: "Closes once 8 spots filled",
    highlight: true // Shows "LIMITED SPOTS" banner
  },
  // Add more tiers...
]
```

---

## 📞 Support

For any issues with the campaign setup:
1. Check the browser console for errors
2. Verify the campaign exists in the database
3. Ensure campaign status is "ACTIVE"
4. Check that title matches the pattern for bonus detection

Good luck with the launch! 🚀

