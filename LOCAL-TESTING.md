# 🧪 Local Testing Guide

## ✅ Quick Start (No Setup Required!)

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Start development server - NO configuration needed!
npm run dev
```

**That's it!** The app will start at `http://localhost:5000` with:
- ✅ In-memory storage (no database needed)
- ✅ Authentication disabled for development
- ✅ All mapping features working
- ✅ Live data from OpenStreetMap

## Full Local Setup (With Database)

### Option 1: Use Neon (Free Postgres)
1. Go to https://neon.tech and create free account
2. Create new database
3. Copy connection string
4. Create `.env`:
```env
DATABASE_URL=your_neon_connection_string
NODE_ENV=development
SESSION_SECRET=local-test-key
```

### Option 2: Local PostgreSQL
```bash
# Install PostgreSQL locally
# Ubuntu/WSL:
sudo apt install postgresql postgresql-contrib

# macOS:
brew install postgresql

# Start PostgreSQL and create database
createdb wannawee

# Add to .env:
DATABASE_URL=postgresql://username:password@localhost/wannawee
NODE_ENV=development
SESSION_SECRET=local-test-key
```

### Option 3: Docker PostgreSQL (Easiest)
```bash
# Start PostgreSQL in Docker
docker run --name wannawee-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=wannawee -p 5432:5432 -d postgres:15

# Add to .env:
DATABASE_URL=postgresql://postgres:password@localhost:5432/wannawee
NODE_ENV=development
SESSION_SECRET=local-test-key
```

## Run the App

```bash
# Initialize database schema (if using database)
npm run db:push

# Start development server
npm run dev
```

## Testing Features

### 1. Basic Functionality
- Visit `http://localhost:5000`
- Select any app (WannaWee, WannaPray, etc.)
- Search for locations worldwide
- Toggle languages
- Test mobile responsive design

### 2. Admin Dashboard
- Go to `http://localhost:5000/admin`
- Requires authentication (Replit Auth)

### 3. API Endpoints
```bash
# Test API directly
curl http://localhost:5000/api/amenities/bathrooms
curl http://localhost:5000/api/search/locations?q=Tokyo
```

## 🐛 Troubleshooting

### "DATABASE_URL must be set" Error
- Either set DATABASE_URL in .env, or
- Run without database using in-memory storage (development mode)

### Port 5000 Already in Use
```bash
# Kill any process on port 5000
pkill -f "port 5000"
# or
lsof -ti:5000 | xargs kill
```

### Build Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Quick Demo Script

```bash
# 1. Start the app
npm run dev

# 2. Open browser to http://localhost:5000
# 3. Click "WannaWee" 
# 4. Search for "Tokyo" - should show bathrooms in Tokyo
# 5. Click language toggle (ES ⇄ EN)
# 6. Try "WannaPray" - search for "London" mosques
# 7. Test mobile view (resize browser)
```

That's it! The app should work perfectly for local testing. 🎉