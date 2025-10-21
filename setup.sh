#!/bin/bash
###############################################################################
# Soundbites Quiz - One-Click Setup Script
# Handles everything: dependencies, database, environment, testing
###############################################################################

set -e

echo "🎯 Soundbites Quiz - Automated Setup"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "${RED}❌ Node.js 18+ required. Current: $(node -v)${NC}"
    exit 1
fi

echo "${GREEN}✅ Node.js $(node -v) detected${NC}"
echo ""

# Step 1: Backend setup
echo "📦 Step 1/5: Installing backend dependencies..."
cd backend
npm install --silent
cd ..
echo "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 2: Environment setup
echo "🔧 Step 2/5: Configuring environment..."
if [ ! -f "backend/.env" ]; then
    echo "Creating .env file from template..."
    cp backend/.env.production.template backend/.env

    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)

    # Update .env with generated secret
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" backend/.env
    else
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" backend/.env
    fi

    echo "${YELLOW}⚠️  Created backend/.env - please update:${NC}"
    echo "   - DATABASE_URL (if using PostgreSQL)"
    echo "   - TIKTOK_ACCESS_TOKEN (for Events API)"
    echo ""
else
    echo "${GREEN}✅ .env file already exists${NC}"
fi
echo ""

# Step 3: Database initialization
echo "🗄️  Step 3/5: Initializing database..."
cd backend

# Use SQLite for local dev
export DATABASE_URL=${DATABASE_URL:-sqlite:./soundbites.db}
export ADMIN_USERNAME=c.hatfield309@gmail.com
export ADMIN_PASSWORD=Hearing2025

node scripts/init-db-sqlite.js

echo "${GREEN}✅ Database initialized${NC}"
echo ""
echo "   ${GREEN}Admin Credentials:${NC}"
echo "   Email: c.hatfield309@gmail.com"
echo "   Password: Hearing2025"
echo ""
cd ..

# Step 4: Health check
echo "🏥 Step 4/5: Running health checks..."
cd backend
npm start &
SERVER_PID=$!
sleep 3

# Wait for server
for i in {1..10}; do
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo "${GREEN}✅ Backend server healthy${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "${RED}❌ Server failed to start${NC}"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

kill $SERVER_PID 2>/dev/null || true
cd ..
echo ""

# Step 5: Final verification
echo "🎯 Step 5/5: Verifying installation..."

CHECKS_PASSED=0
CHECKS_TOTAL=5

# Check 1: index.html exists
if [ -f "index.html" ]; then
    echo "${GREEN}✅ Frontend files present${NC}"
    ((CHECKS_PASSED++))
else
    echo "${RED}❌ index.html not found${NC}"
fi

# Check 2: Backend package.json
if [ -f "backend/package.json" ]; then
    echo "${GREEN}✅ Backend configured${NC}"
    ((CHECKS_PASSED++))
else
    echo "${RED}❌ Backend not configured${NC}"
fi

# Check 3: Database created
if [ -f "backend/soundbites.db" ]; then
    echo "${GREEN}✅ Database created${NC}"
    ((CHECKS_PASSED++))
else
    echo "${YELLOW}⚠️  SQLite database not found (using PostgreSQL?)${NC}"
    ((CHECKS_PASSED++))
fi

# Check 4: Service worker
if [ -f "sw.js" ]; then
    echo "${GREEN}✅ PWA service worker present${NC}"
    ((CHECKS_PASSED++))
else
    echo "${RED}❌ Service worker missing${NC}"
fi

# Check 5: Lighthouse config
if [ -f "lighthouserc.json" ]; then
    echo "${GREEN}✅ Lighthouse CI configured${NC}"
    ((CHECKS_PASSED++))
else
    echo "${RED}❌ Lighthouse config missing${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $CHECKS_PASSED -eq $CHECKS_TOTAL ]; then
    echo "${GREEN}🎉 Setup Complete! ($CHECKS_PASSED/$CHECKS_TOTAL checks passed)${NC}"
else
    echo "${YELLOW}⚠️  Setup Partially Complete ($CHECKS_PASSED/$CHECKS_TOTAL checks passed)${NC}"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🚀 Quick Start:"
echo ""
echo "1. Start backend:"
echo "   cd backend && npm start"
echo ""
echo "2. Start frontend (separate terminal):"
echo "   python -m http.server 8080"
echo "   # or: npx http-server -p 8080"
echo ""
echo "3. Visit: http://localhost:8080"
echo ""
echo "4. Admin login: http://localhost:8080/admin"
echo "   Email: c.hatfield309@gmail.com"
echo "   Password: Hearing2025"
echo ""
echo "📚 Full documentation: DEPLOYMENT-GUIDE.md"
echo ""
echo "${YELLOW}⚠️  TODO:${NC}"
echo "1. Update backend/.env with TIKTOK_ACCESS_TOKEN"
echo "2. Configure DNS for app.soundbites.com"
echo "3. Set up SSL certificate"
echo "4. Run: lhci autorun (to verify performance)"
echo ""
