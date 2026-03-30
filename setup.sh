#!/bin/bash

# GastroLog Backend Setup Script
# This script automates the setup process for the backend

set -e

echo "?? GastroLog Backend Setup"
echo "=========================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "? Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

echo "? Node.js $(node --version) found"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "? npm is not installed"
    exit 1
fi

echo "? npm $(npm --version) found"
echo ""

# Check if Docker is available
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "? Docker $(docker --version | awk '{print $3}' | tr -d ',') found"
    echo ""
    read -p "Do you want to use Docker for PostgreSQL and Redis? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "?? Starting Docker containers..."
        docker-compose up -d
        echo "? Docker containers started"
        echo "   Waiting for services to be ready..."
        sleep 5
        echo ""
    fi
else
    echo "??  Docker not found. You'll need to set up PostgreSQL and Redis manually."
    echo "   See BACKEND_SETUP.md for instructions."
    echo ""
fi

# Install dependencies
echo "?? Installing Node dependencies..."
npm install
echo "? Dependencies installed"
echo ""

# Generate Prisma client
echo "?? Generating Prisma client..."
npm run prisma:generate
echo "? Prisma client generated"
echo ""

# Run migrations
echo "???  Running database migrations..."
npm run prisma:migrate
echo "? Database migrations completed"
echo ""

echo "?? Setup complete!"
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "Backend will be available at: http://localhost:3001"
echo ""
echo "Documentation:"
echo "  - API endpoints: see API_EXAMPLES.md"
echo "  - Database setup: see BACKEND_SETUP.md"
echo "  - Troubleshooting: see DATABASE_SETUP.md"
echo ""
