#!/bin/bash
set -e

echo "🚀 EduAI Platform Setup"
echo "======================"

echo "📦 Installing dependencies..."
npm install

echo "🗄️  Setting up database..."
npm run db:migrate

echo "🌱 Seeding database with test data..."
node scripts/seed.js

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Start the server: npm start"
echo "  2. Open http://localhost:3000 in your browser"
echo "  3. Login with test credentials:"
echo "     Teacher: teacher1@school.test / TestPass123!"
echo "     Student: student1@school.test / TestPass123!"
echo ""
echo "🧪 Run tests:"
echo "  npm test"
echo "  npm run test:e2e"
