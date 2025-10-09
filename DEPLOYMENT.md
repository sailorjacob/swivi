# Deployment Guide

## Vercel Deployment

### Prerequisites
1. **Supabase Database Setup**
   - Create Supabase project at [supabase.com](https://supabase.com)
   - Copy `DATABASE_URL` from Settings → Database
   - Copy API keys from Settings → API
   - Run database migrations: `npm run prisma:migrate:deploy`

2. **OAuth Applications**
   - **Discord**: Create app at [discord.com/developers](https://discord.com/developers/applications)
     - Add redirect: `https://your-app.vercel.app/auth/callback`
   - **Google**: Create project at [console.cloud.google.com](https://console.cloud.google.com)
     - Add redirect: `https://your-app.vercel.app/auth/callback`

### Deploy to Vercel
1. Push code to GitHub
2. Import project in Vercel dashboard
3. Add environment variables:

```env
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: File Storage
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Post-Deployment
1. Test authentication flow
2. Verify database connectivity
3. Check API endpoints
4. Test file uploads (if using Cloudinary)

## Production Checklist
- [ ] Environment variables configured
- [ ] Database migrated
- [ ] OAuth redirects updated
- [ ] Authentication working
- [ ] API endpoints responding
- [ ] File uploads working
