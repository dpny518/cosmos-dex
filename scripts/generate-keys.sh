#!/bin/bash

set -e

echo "🔐 Generating new deployer keys..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

# Generate keys
node generate-keys.js

echo ""
echo "✅ Keys generated successfully!"
echo "📂 Keys saved in /keys/ directory"
echo ""
echo "💡 Next steps:"
echo "1. Fund the generated address with ATOM"
echo "2. Run 'make deploy-contracts' to deploy"