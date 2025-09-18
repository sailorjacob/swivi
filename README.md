# 🚀 Swivi - Premium Content Creator Platform

A comprehensive platform connecting content creators (clippers) with brands for viral marketing campaigns across TikTok, YouTube, Instagram, and more.

## ✨ Key Features

### For Clippers
- 🎯 **Campaign Browser** - Discover and join active campaigns
- 💰 **Earnings Dashboard** - Track your performance and payments
- 📊 **Analytics** - Detailed insights on views, engagement, and earnings
- 🔗 **Social Integration** - Connect multiple platform accounts
- 💸 **Instant Payouts** - PayPal and bank transfer support
- 📱 **Clip Submission** - Easy submission with drag-and-drop uploads

### For Creators & Brands
- 🎪 **Campaign Management** - Create and manage viral marketing campaigns
- 👥 **Clipper Network** - Access to verified content creators
- 📈 **Performance Tracking** - ROI analytics and campaign insights
- 🎨 **Brand Assets** - Content guidelines and creative resources

### Technical Features
- 🔐 **OAuth Authentication** - Discord & Google login
- 🗄️ **Robust Database** - PostgreSQL with Prisma ORM
- ☁️ **Cloud Storage** - Cloudinary integration for media files
- 🎨 **Modern UI** - Clean design with no outlines, theme-aware
- 📱 **Mobile Responsive** - Works perfectly on all devices
- 🔧 **API-First** - RESTful APIs for all features

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI, Framer Motion
- **Authentication**: NextAuth.js with Discord & Google OAuth
- **Database**: Prisma ORM + PostgreSQL
- **File Storage**: Cloudinary
- **State Management**: React Hook Form, TanStack Query
- **Charts**: Chart.js with React wrapper
- **Notifications**: React Hot Toast

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL database
- Discord & Google OAuth apps
- Cloudinary account

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/swivi.git
cd swivi

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your values (see SETUP.md for detailed instructions)

# Set up database and seed data
npm run setup

# Start development server
npm run dev
```

### 3. Open in browser
Navigate to `http://localhost:3000` and explore the platform!

## 📚 Complete Setup Guide

For detailed setup instructions including OAuth configuration, database setup, and deployment, see [SETUP.md](SETUP.md).

## 🎯 What's Built & Ready

### ✅ Authentication System
- Discord & Google OAuth working
- User roles (CLIPPER, CREATOR, ADMIN)
- Protected routes with middleware
- Session management

### ✅ Database Schema
- Complete data model for all features
- User profiles with earnings tracking
- Campaign management system
- Clip submissions with approval workflow
- Payout system with multiple methods
- Analytics and view tracking
- Social account linking
- Referral system

### ✅ API Routes
- `/api/clippers/clips` - Clip management
- `/api/clippers/submissions` - Campaign submissions
- `/api/clippers/payouts` - Payout requests
- `/api/campaigns` - Active campaigns

### ✅ Frontend Features
- Complete clipper dashboard
- Campaign browser with filtering
- Clip submission modal with file upload
- Analytics with charts
- Profile management
- Social account linking UI
- Payout request interface
- Mobile-responsive design

### ✅ File Storage
- Cloudinary integration ready
- File upload with drag-and-drop
- Image and video support

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run database migrations
npm run prisma:studio   # Open Prisma Studio GUI
npm run prisma:seed     # Seed database with sample data
npm run setup           # Run migrations + seeding

# Code Quality
npm run lint            # ESLint
npm run type-check      # TypeScript checking
```

## 📁 Project Structure

```
swivi/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── clippers/      # Clipper APIs
│   │   └── campaigns/     # Campaign APIs
│   ├── clippers/          # Clipper platform pages
│   │   ├── dashboard/     # Protected dashboard pages
│   │   └── login/         # Authentication pages
│   └── clippers-demo/     # Demo mode (development)
├── components/            # React components
│   ├── ui/               # Reusable UI primitives
│   ├── clippers/         # Clipper-specific components
│   └── layout/           # Layout components
├── lib/                  # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Database client
│   └── utils.ts          # Helper functions
├── prisma/               # Database schema and migrations
├── scripts/              # Setup and utility scripts
└── types/                # TypeScript type definitions
```

## 🌟 Key Components

- **Clip Submission Modal** - Complete submission flow with validation
- **Campaign Browser** - Filter and browse active campaigns
- **Analytics Dashboard** - Charts and performance metrics
- **Payout System** - Request and track payments
- **Social Account Manager** - Connect multiple platforms
- **Profile Management** - Complete user profile system

## 🚀 Deployment

### Environment Variables for Production
Set these in your hosting platform:

```env
NEXTAUTH_URL=https://yourdomain.com
DATABASE_URL=your_production_database_url
# ... (see env.example for complete list)
```

### Recommended Hosting
- **Frontend**: Vercel (optimized for Next.js)
- **Database**: Railway, Supabase, or PlanetScale
- **File Storage**: Cloudinary

## 🔗 API Documentation

### Authentication Required Routes
All `/api/clippers/*` routes require authentication. Include session cookie or authorization header.

### Response Format
```json
{
  "data": {},
  "error": "Error message if any",
  "status": "success|error"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Check [SETUP.md](SETUP.md) for detailed setup instructions
- Open an issue for bugs or feature requests
- Join our Discord community for help and discussions

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.