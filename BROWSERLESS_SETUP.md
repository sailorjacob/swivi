# Browserless.io Integration Setup

## ✅ Your API Key
`2T7ydB39jhCIrIc454d1e84e99ee3e6f857509200dc7b8452`

## 🔧 Setup Steps

### 1. Add Environment Variable to Vercel
Go to your Vercel project settings and add:

```bash
BROWSERLESS_API_KEY=2T7ydB39jhCIrIc454d1e84e99ee3e6f857509200dc7b8452
```

### 2. Browserless.io Features Used
- **Stealth Mode**: `&stealth` - Bypasses bot detection
- **Ad Blocking**: `&blockAds` - Faster page loads
- **WebSocket Connection**: Real-time browser control
- **Managed Chrome**: Always up-to-date browser

## 🚀 How It Works

### Connection Process:
1. **Browser Request** → Connect to `wss://chrome.browserless.io`
2. **Authentication** → Your API key validates the request
3. **Stealth Chrome** → Gets a real Chrome instance with anti-detection
4. **Session Management** → Our cookie persistence still works
5. **Verification** → Extract bio content and verify codes

### Benefits:
- ✅ **No Chrome Installation**: Browserless.io provides managed Chrome
- ✅ **Anti-Bot Protection**: Stealth mode bypasses detection
- ✅ **Always Updated**: Latest Chrome version automatically
- ✅ **Scalable**: Handles multiple concurrent sessions
- ✅ **Reliable**: 99.9% uptime professional service

## 🧪 Testing

After deploying with the API key:

```bash
# Test Twitter verification with Browserless.io
curl -X POST https://www.swivimedia.com/api/social-verification/test-agent \
  -H "Content-Type: application/json" \
  -d '{"platform": "twitter", "username": "elonmusk", "code": "TEST123"}'
```

Expected logs:
```
🌐 Connecting to Browserless.io cloud browser...
✅ Connected to Browserless.io cloud browser
🔄 Checking for existing Twitter session...
🔐 No valid session found, logging into Twitter...
✅ Successfully logged into Twitter and saved session
📍 Navigating to @elonmusk profile...
📄 Bio extracted: "..."
🔍 Code search: "TEST123" ❌ NOT FOUND
```

## 💰 Pricing
- **Free Tier**: 1,000 requests/month
- **Paid Plans**: $15-30/month for production use
- **Perfect for social verification**: Low volume, high reliability

## 🔒 Security Notes
- API key is secured in Vercel environment variables
- Browserless.io is SOC2 compliant
- Sessions are isolated and secure
- No data persistence on their servers

## 📊 Monitoring

### Check Browser Status:
```bash
curl "https://chrome.browserless.io/pressure?token=YOUR_TOKEN"
```

### Session Statistics:
```bash
curl "https://www.swivimedia.com/api/debug/sessions"
```

This setup gives you professional-grade browser automation with zero infrastructure management! 🎯
