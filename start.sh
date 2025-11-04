#!/bin/bash

# Smart LMS Quick Start Script

echo "🚀 Starting Smart LMS..."
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the Smart_LMS root directory"
    exit 1
fi

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Starting Backend Server...${NC}"
cd backend
gnome-terminal --title="Smart LMS - Backend" -- bash -c "npm start; exec bash" 2>/dev/null || \
xterm -T "Smart LMS - Backend" -e "npm start; bash" 2>/dev/null || \
start "Smart LMS - Backend" cmd /k "npm start" 2>/dev/null || \
echo -e "${YELLOW}⚠️  Could not open new terminal. Please run 'cd backend && npm start' manually in a new terminal.${NC}"

cd ..

echo -e "${BLUE}Step 2: Starting Frontend Server...${NC}"
cd frontend
gnome-terminal --title="Smart LMS - Frontend" -- bash -c "npm start; exec bash" 2>/dev/null || \
xterm -T "Smart LMS - Frontend" -e "npm start; bash" 2>/dev/null || \
start "Smart LMS - Frontend" cmd /k "npm start" 2>/dev/null || \
echo -e "${YELLOW}⚠️  Could not open new terminal. Please run 'cd frontend && npm start' manually in a new terminal.${NC}"

cd ..

echo ""
echo -e "${GREEN}✅ Smart LMS is starting!${NC}"
echo ""
echo -e "Backend:  ${BLUE}http://localhost:3000${NC}"
echo -e "Frontend: ${BLUE}http://localhost:4200${NC}"
echo ""
echo "Press Ctrl+C in each terminal window to stop the servers."
