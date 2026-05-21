#!/bin/bash
# Local iOS build → TestFlight (bypasses EAS cloud build quota)
# EAS production secrets (SENTRY_AUTH_TOKEN 등) 은 eas env:exec 으로 주입
# Usage: npm run deploy:ios
set -e

IPA_PATH="./build/app.ipa"

echo "🔨 Step 1/2: Building iOS locally..."
npx eas-cli env:exec production "npx eas-cli build --platform ios --profile production --local --output $IPA_PATH"

echo "🚀 Step 2/2: Submitting to TestFlight..."
npx eas-cli submit --platform ios --path "$IPA_PATH" --profile production
