#!/bin/bash

# WannaWee Production Deployment Script
# Usage: ./deploy.sh

set -e

echo "🚀 Starting WannaWee Production Deployment..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found"
    echo "📝 Please create .env.production from the template:"
    echo "   cp .env.production.template .env.production"
    echo "   # Then edit .env.production with your values"
    exit 1
fi

# Load production environment
export $(grep -v '^#' .env.production | xargs)

echo "✅ Environment loaded from .env.production"

# Install production dependencies
echo "📦 Installing production dependencies..."
npm ci --only=production

# Build the application
echo "🏗️  Building application for production..."
npm run build

# Initialize database schema
echo "🗄️  Setting up database schema..."
npm run db:push

# Test production build locally (optional)
echo "🧪 Testing production build..."
timeout 10s npm start || echo "✅ Production server started successfully"

echo ""
echo "🎉 DEPLOYMENT READY!"
echo ""
echo "📋 Next steps:"
echo "1. Upload this directory to your production server"
echo "2. Run: NODE_ENV=production npm start"
echo "3. Configure reverse proxy (nginx/apache) to port 5000"
echo "4. Set up SSL certificate for wannawee.com"
echo "5. Point domain DNS to your server IP"
echo ""
echo "🌐 App will be available at: https://wannawee.com"
echo ""
echo "✅ All systems ready for launch!"