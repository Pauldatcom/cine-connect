#!/bin/bash

# ============================================
# CinéConnect - Environment Setup Script
# ============================================
# This script helps you set up your local environment
# Run from project root: ./scripts/setup-env.sh
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════╗"
echo "║     CinéConnect - Environment Setup       ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# Function to create .env from .env.example
setup_env_file() {
    local dir=$1
    local name=$2
    
    if [ -f "$dir/.env" ]; then
        echo -e "${YELLOW}⚠️  $name/.env already exists. Skipping...${NC}"
        return
    fi
    
    if [ -f "$dir/.env.example" ]; then
        cp "$dir/.env.example" "$dir/.env"
        echo -e "${GREEN}✅ Created $name/.env from .env.example${NC}"
    else
        echo -e "${RED}❌ $name/.env.example not found!${NC}"
        return 1
    fi
}

# Setup Frontend
echo -e "\n${BLUE}📦 Setting up Frontend...${NC}"
setup_env_file "frontend" "frontend"

# Setup Backend
echo -e "\n${BLUE}📦 Setting up Backend...${NC}"
setup_env_file "backend" "backend"

# Reminder about API keys
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}⚠️  IMPORTANT: Update these values in your .env files:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "   ${BLUE}frontend/.env:${NC}"
echo "   └── VITE_TMDB_API_KEY  → Get free at https://themoviedb.org/settings/api"
echo ""
echo -e "   ${BLUE}backend/.env:${NC}"
echo "   └── DATABASE_URL      → Your PostgreSQL connection string"
echo "   └── JWT_SECRET        → Generate: openssl rand -base64 32"
echo "   └── TMDB_API_KEY      → Same as frontend (optional)"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Generate JWT secret helper
echo -e "\n${BLUE}🔐 Need a JWT secret? Here's one:${NC}"
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "please-generate-a-secure-random-string-here")
echo -e "   ${GREEN}$JWT_SECRET${NC}"

echo -e "\n${GREEN}✨ Setup complete! Now update your .env files with real values.${NC}"
echo -e "${BLUE}Then run: pnpm install && pnpm dev${NC}\n"

