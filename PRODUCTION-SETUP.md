# 🚀 PRODUCTION DEPLOYMENT - wannawee.com

## Step 1: Create Production Database

### Option A: Neon (Recommended - Free Tier)
1. Go to https://neon.tech
2. Sign up with GitHub/Google
3. Create new project: "wannawee-prod"
4. Copy connection string (looks like):
   ```
   postgresql://username:password@ep-example.us-east-1.aws.neon.tech/wannawee?sslmode=require
   ```

### Option B: Supabase (Alternative)
1. Go to https://supabase.com  
2. Create new project: "wannawee"
3. Go to Settings > Database
4. Copy connection string

## Step 2: Set Up AWS S3 (Photo Uploads)

1. Go to AWS Console > S3
2. Create bucket: `wannawee-photos-prod`
3. Set public read access for uploaded photos
4. Go to IAM > Users > Create user: `wannawee-s3-user`
5. Attach policy: `AmazonS3FullAccess` (or custom policy)
6. Generate Access Keys

## Step 3: Configure Production Environment

Create `.env.production`:

```env
# Database
DATABASE_URL=postgresql://your_neon_connection_string_here

# Environment
NODE_ENV=production

# Session Security
SESSION_SECRET=super-secure-random-string-change-this-immediately

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_here
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=wannawee-photos-prod

# Replit Auth (if using)
REPLIT_DOMAINS=wannawee.com
REPL_ID=your_repl_id_if_needed
```

## Step 4: Deploy Commands

```bash
# Install dependencies
npm install --production

# Build for production
npm run build

# Initialize database schema
npm run db:push

# Start production server
npm start
```

## Step 5: Server Configuration

The app runs on **port 5000**. Configure your server to:
- Proxy traffic from port 80/443 to port 5000
- Set up SSL certificate for wannawee.com
- Configure domain DNS to point to your server

## Step 6: Health Check

After deployment, verify:
- ✅ `https://wannawee.com` loads the app selector
- ✅ All 6 mapping apps work (WannaWee, WannaPray, etc.)
- ✅ Global search works (try "Tokyo", "London")
- ✅ Language switching works
- ✅ Photo upload works (creates S3 URLs)
- ✅ Mobile responsive design
- ✅ SSL certificate valid

## 🎯 READY FOR LAUNCH!

The codebase is **production-ready** with all features implemented:
- ✅ Modern MERN stack architecture
- ✅ Global mapping with OpenStreetMap integration  
- ✅ 13-language multilingual support
- ✅ Photo upload system with AWS S3
- ✅ User authentication and admin system
- ✅ Mobile-optimized responsive design
- ✅ All 6 specialized mapping applications

**Kate can launch immediately after database + hosting setup!**