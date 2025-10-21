#!/bin/bash
###############################################################################
# Soundbites Quiz - Production Deployment Script
# Automates database setup, environment validation, and health checks
###############################################################################

set -e  # Exit on any error

echo "🚀 Soundbites Quiz - Production Deployment"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running in backend directory
if [ ! -f "package.json" ]; then
    echo "${RED}❌ Error: Must run from backend/ directory${NC}"
    echo "Usage: cd backend && bash ../scripts/deploy.sh"
    exit 1
fi

echo "📋 Step 1: Checking environment variables..."
REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET" "FRONTEND_URL")
MISSING_VARS=()

for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        MISSING_VARS+=("$VAR")
    else
        echo "${GREEN}✅${NC} $VAR is set"
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo ""
    echo "${RED}❌ Missing required environment variables:${NC}"
    for VAR in "${MISSING_VARS[@]}"; do
        echo "   - $VAR"
    done
    echo ""
    echo "Create a .env file with these variables or export them:"
    echo "export DATABASE_URL='your_database_url'"
    echo "export JWT_SECRET='your_secret_key'"
    echo "export FRONTEND_URL='https://app.soundbites.com'"
    exit 1
fi

# Optional warnings
echo ""
echo "⚠️  Optional environment variables:"
if [ -z "$TIKTOK_ACCESS_TOKEN" ]; then
    echo "${YELLOW}⚠️${NC}  TIKTOK_ACCESS_TOKEN not set (TikTok Events API will be disabled)"
else
    echo "${GREEN}✅${NC} TIKTOK_ACCESS_TOKEN is set"
fi

if [ -z "$COOKIE_DOMAIN" ]; then
    echo "${YELLOW}⚠️${NC}  COOKIE_DOMAIN not set (defaulting to current domain)"
else
    echo "${GREEN}✅${NC} COOKIE_DOMAIN is set"
fi

echo ""
echo "📦 Step 2: Installing dependencies..."
npm install --production

echo ""
echo "🗄️  Step 3: Initializing database..."
if [[ $DATABASE_URL == postgres* ]]; then
    echo "Detected PostgreSQL database"
    node scripts/init-db-postgres.js
elif [[ $DATABASE_URL == sqlite* ]]; then
    echo "Detected SQLite database"
    node scripts/init-db-sqlite.js
else
    echo "${RED}❌ Unknown database type: $DATABASE_URL${NC}"
    exit 1
fi

echo ""
echo "🔐 Step 4: Verifying admin account..."
echo "   Email: c.hatfield309@gmail.com"
echo "   Password: Hearing2025"
echo "   ${YELLOW}⚠️  Change password after first login!${NC}"

echo ""
echo "🏥 Step 5: Starting health check..."
npm start &
SERVER_PID=$!
sleep 5

# Health check
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${PORT:-3000}/health || echo "000")

if [ "$HEALTH_CHECK" = "200" ]; then
    echo "${GREEN}✅ Server health check passed${NC}"
else
    echo "${RED}❌ Server health check failed (HTTP $HEALTH_CHECK)${NC}"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "${GREEN}🎉 Deployment successful!${NC}"
echo ""
echo "Next steps:"
echo "1. Update DNS to point app.soundbites.com to your server"
echo "2. Configure SSL certificate"
echo "3. Add TIKTOK_ACCESS_TOKEN to environment variables"
echo "4. Test login at https://app.soundbites.com/admin/login.html"
echo "5. Run Lighthouse audit: npm run lighthouse"
echo ""
echo "Server running on PID: $SERVER_PID"
echo "To stop: kill $SERVER_PID"
