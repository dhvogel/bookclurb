#!/bin/bash

# Simple script to apply iam-policy.yaml to the invite service

set -e

PROJECT_ID="${GOOGLE_CLOUD_PROJECT}"
if [ -z "$PROJECT_ID" ]; then
  echo "❌ Error: GOOGLE_CLOUD_PROJECT environment variable is required"
  exit 1
fi
REGION="${REGION:-us-central1}"
SERVICE_NAME="bookclurb-invite"
POLICY_FILE="$(dirname "$0")/iam-policy.yaml"

echo "🔒 Applying IAM policy from $POLICY_FILE"
echo "📍 Service: $SERVICE_NAME"
echo "📍 Project: $PROJECT_ID"
echo "🌍 Region: $REGION"
echo ""

if [ ! -f "$POLICY_FILE" ]; then
  echo "❌ Error: Policy file not found: $POLICY_FILE"
  exit 1
fi

# Apply the IAM policy
# Note: If the service currently allows unauthenticated access, you may need to
# redeploy with --no-allow-unauthenticated flag, or the policy will work alongside it
echo ""
echo "📋 Applying IAM policy..."
gcloud run services set-iam-policy "$SERVICE_NAME" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  "$POLICY_FILE"

echo ""
echo "✅ IAM policy applied successfully!"
echo ""
echo "📊 Current IAM policy:"
gcloud run services get-iam-policy "$SERVICE_NAME" \
  --region="$REGION" \
  --project="$PROJECT_ID"

