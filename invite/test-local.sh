#!/bin/bash

# Test script for local invite service
# Usage: ./test-local.sh YOUR_FIREBASE_TOKEN test@example.com

TOKEN="$1"
EMAIL="${2:-test@example.com}"
CLUB_ID="${3:-test-club-id}"
CLUB_NAME="${4:-Test Club}"

if [ -z "$TOKEN" ]; then
  echo "Usage: $0 <firebase-token> [email] [club-id] [club-name]"
  echo ""
  echo "To get a token, open your React app browser console and run:"
  echo "  const auth = getAuth(); const user = auth.currentUser; const token = await user.getIdToken(); console.log(token);"
  exit 1
fi

# Create JSON payload using printf to avoid encoding issues
JSON_PAYLOAD=$(printf '{"email":"%s","clubId":"%s","clubName":"%s","inviterName":"Test User"}' "$EMAIL" "$CLUB_ID" "$CLUB_NAME")

curl -X POST http://localhost:8080/SendClubInvite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$JSON_PAYLOAD" | jq .

