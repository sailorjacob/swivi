# View Tracking Test System

A comprehensive testing system for verifying the view tracking functionality without needing active campaigns.

## Overview

The test system allows you to:
- Submit URLs from any supported platform (TikTok, YouTube, Instagram, Twitter)
- Create test clips for tracking
- Monitor view counts over time
- Test cron job functionality
- Calculate earnings based on view growth
- View detailed analytics and tracking history

## Access Points

### 1. Admin Dashboard
- Navigate to `/admin` (admin users only)
- Click "View Tracking Test" in the sidebar

### 2. Clipper Dashboard
- Navigate to `/clippers/dashboard` (all authenticated users)
- Click "🧪 Test View Tracking" button in the top right

### 3. Direct Access
- Go to `/test/view-tracking` (admin and clipper users)

## Features

### URL Submission
- Submit video URLs from supported platforms
- Automatically creates test clips in the database
- Separate from campaign submissions

### View Tracking
- Manual view tracking with real-time scraping
- Historical view data tracking
- Platform-specific scraping (TikTok, YouTube, Instagram, Twitter)

### Analytics
- Daily, weekly, and total view statistics
- Average daily view calculations
- Tracking history visualization
- Days tracked counter

### Earnings Calculator
- Calculate potential earnings based on view growth
- Configurable rates (currently $0.01 per 1000 views)
- Detailed calculation breakdown

### Cron Job Testing
- Manually trigger automated view tracking
- Test campaign completion processes
- Verify scraping and calculation systems
- Monitor system performance

## Supported Platforms

- **TikTok** 🎵 - Video URLs
- **YouTube** 📺 - Video URLs
- **Instagram** 📸 - Video/Reel URLs
- **Twitter** 🐦 - Video URLs

## API Endpoints

### `/api/test/view-tracking`

All actions are handled through POST requests with the following structure:

```json
{
  "action": "action_name",
  "url": "optional_url",
  "platform": "optional_platform",
  "clipId": "optional_clip_id"
}
```

#### Available Actions

1. **submit_url** - Create a test clip
   ```json
   {
     "action": "submit_url",
     "url": "https://www.tiktok.com/@user/video/...",
     "platform": "TIKTOK"
   }
   ```

2. **track_views** - Track views for a specific clip
   ```json
   {
     "action": "track_views",
     "clipId": "clip_id_here"
   }
   ```

3. **get_tracking_history** - Get detailed stats and history
   ```json
   {
     "action": "get_tracking_history",
     "clipId": "clip_id_here"
   }
   ```

4. **list_test_clips** - List all test clips for the user
   ```json
   {
     "action": "list_test_clips"
   }
   ```

5. **delete_test_clip** - Delete a test clip
   ```json
   {
     "action": "delete_test_clip",
     "clipId": "clip_id_here"
   }
   ```

6. **test_cron_job** - Test automated systems
   ```json
   {
     "action": "test_cron_job"
   }
   ```

7. **calculate_earnings** - Calculate earnings for a clip
   ```json
   {
     "action": "calculate_earnings",
     "clipId": "clip_id_here"
   }
   ```

## Testing Workflow

### Step 1: Submit Test URLs
1. Go to the "Submit URLs" tab
2. Enter a video URL from any supported platform
3. Select the correct platform
4. Click "Create Test Clip"

### Step 2: Track Views Over Time
1. Go to the "Track Views" tab
2. Select a test clip from the dropdown
3. Click "Track Views Now" to scrape current view count
4. Wait a few hours/days and track again to see growth

### Step 3: Monitor Statistics
1. Go to the "View Stats" tab
2. Select a clip and click "Get Stats"
3. Click "Calculate Earnings" to test payment calculations
4. View tracking history to see growth over time

### Step 4: Test Cron Jobs
1. Go to the "Cron Testing" tab
2. Click "Test Cron Job System"
3. Check results to ensure systems are working

## Data Management

- **Test clips** are marked with "Test Clip" in the title for easy identification
- **Deletion** is restricted to test clips only (safety measure)
- **Data cleanup** - test clips and their tracking data are deleted together
- **User isolation** - users can only see their own test clips

## Cron Job Information

### Scheduled Jobs (run every 4 hours):
- **View Tracking**: Scrapes current view counts for all active clips
- **Payout Calculation**: Calculates earnings based on view growth
- **Campaign Completion**: Checks if campaigns have reached goals

### Manual Testing:
- Use the "Test Cron Job System" button to manually trigger these processes
- Real cron jobs run automatically on Vercel every 4 hours

## Success Indicators

✅ **Green checkmarks** in tracking results
✅ **Increasing view counts** over time
✅ **Successful scraping** without errors
✅ **Accurate earnings calculations**
✅ **Consistent results** over multiple days

## Troubleshooting

### Common Issues:

1. **Scraping Errors**: Check console for Apify API errors or rate limiting
2. **No View Growth**: Some videos may not be publicly accessible or have stable view counts
3. **Database Issues**: Verify data is being saved to `view_tracking` table
4. **Rate Limiting**: Apify has rate limits - test gradually

### Debug Information:
- Check browser console for detailed error messages
- Use the existing debug tools at `/debug/view-tracking-test`
- Monitor the cron job results for system-wide issues

## Security

- **Authentication required** for all endpoints
- **Role-based access** (admin and clipper users)
- **User data isolation** - users only see their own test clips
- **Safe deletion** - only test clips can be deleted
- **Rate limiting** protection through existing API patterns

## Integration

This test system integrates with:
- Existing view tracking services (`ViewTrackingService`)
- Database schema (clips, view_tracking tables)
- Authentication system (Supabase)
- UI components (shadcn/ui)
- Scraping services (Apify integration)

The system is designed to be non-disruptive and can be safely removed if needed.

