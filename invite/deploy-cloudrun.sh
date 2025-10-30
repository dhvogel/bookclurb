#!/bin/bash

# Deploy script for Book Clurb Invite Function to Google Cloud Run
# Usage: ./deploy-cloudrun.sh [--prod|--dev]

set -e

# Load config file if it exists (early, so we can use values from it)
CONFIG_FILE="$(dirname "$0")/.deploy-config"
if [ -f "$CONFIG_FILE" ]; then
  echo "📄 Loading configuration from $CONFIG_FILE..."
  # Source the config file (supports KEY=VALUE format)
  set -a
  source "$CONFIG_FILE"
  set +a
fi

# Configuration
# Allow PROJECT_ID from config file, environment variable, or GOOGLE_CLOUD_PROJECT
PROJECT_ID="${PROJECT_ID:-${GOOGLE_CLOUD_PROJECT}}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="bookclurb-invite"
# Allow ARTIFACT_REGISTRY from config file or environment variable
ARTIFACT_REGISTRY="${ARTIFACT_REGISTRY}"  # e.g., us-central1-docker.pkg.dev/PROJECT_ID/REPO_NAME
IMAGE_TAG="${IMAGE_TAG:-dev}"

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Error: PROJECT_ID is required"
  echo "   Set it via: export PROJECT_ID=your-project-id"
  echo "   Or create $CONFIG_FILE with: PROJECT_ID=your-project-id"
  echo "   Or set: export GOOGLE_CLOUD_PROJECT=your-project-id"
  exit 1
fi

if [ -z "$ARTIFACT_REGISTRY" ]; then
  echo "❌ Error: ARTIFACT_REGISTRY is required"
  echo "   Example: us-central1-docker.pkg.dev/PROJECT_ID/REPO_NAME"
  echo "   Set it via: export ARTIFACT_REGISTRY=your-registry"
  echo "   Or create $CONFIG_FILE with: ARTIFACT_REGISTRY=your-registry"
  exit 1
fi

IMAGE_NAME="$ARTIFACT_REGISTRY/email"

# Determine environment
ENV="${1:-dev}"
if [ "$ENV" = "--prod" ]; then
  ENV="prod"
  if [ -z "$BASE_URL" ]; then
    echo "❌ Error: BASE_URL environment variable is required for production"
    exit 1
  fi
elif [ "$ENV" = "--dev" ]; then
  ENV="dev"
  BASE_URL="${BASE_URL:-http://localhost:3000}"
else
  echo "Usage: $0 [--prod|--dev]"
  exit 1
fi

echo "🚀 Deploying $SERVICE_NAME to Cloud Run (Environment: $ENV)"
echo "📍 Project: $PROJECT_ID"
echo "🌍 Region: $REGION"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
  echo "❌ Error: gcloud CLI is not installed"
  exit 1
fi

# Set the project
gcloud config set project "$PROJECT_ID"

# Check for required email credentials (from env, config file, or prompt)
if [ -z "$EMAIL_USER" ]; then
  echo "⚠️  Warning: EMAIL_USER not set"
  echo "   Set it via: export EMAIL_USER=your-email@gmail.com"
  echo "   Or create $CONFIG_FILE with: EMAIL_USER=your-email@gmail.com"
  read -p "   Enter email address: " EMAIL_USER
fi

if [ -z "$EMAIL_PASSWORD" ]; then
  echo "⚠️  Warning: EMAIL_PASSWORD not set"
  echo "   Set it via: export EMAIL_PASSWORD=your-app-password"
  echo "   Or create $CONFIG_FILE with: EMAIL_PASSWORD=your-app-password"
  read -p "   Enter email password: " -s EMAIL_PASSWORD
  echo ""
fi

if [ -z "$EMAIL_USER" ] || [ -z "$EMAIL_PASSWORD" ]; then
  echo "❌ Error: Email credentials are required"
  echo ""
  echo "💡 Create $CONFIG_FILE with:"
  echo "   EMAIL_USER=your-email@gmail.com"
  echo "   EMAIL_PASSWORD=your-gmail-app-password"
  echo ""
  echo "   Note: Gmail requires an App Password (not your regular password)"
  echo "   See: https://support.google.com/accounts/answer/185833"
  exit 1
fi

# Build and push Docker image
echo ""
echo "🔨 Building Docker image..."
cd "$(dirname "$0")"

FULL_IMAGE_NAME="$IMAGE_NAME:$IMAGE_TAG"

if ! docker build -t "$FULL_IMAGE_NAME" .; then
  echo "❌ Docker build failed"
  exit 1
fi

echo "📤 Pushing image to Artifact Registry..."
echo "   Image: $FULL_IMAGE_NAME"
if ! docker push "$FULL_IMAGE_NAME"; then
  echo "❌ Docker push failed"
  echo "💡 Ensure Docker is authenticated: gcloud auth configure-docker"
  echo "💡 Make sure Artifact Registry is enabled and repository exists"
  exit 1
fi

# Deploy to Cloud Run
echo ""
echo "📦 Deploying to Cloud Run..."
echo "   Using image: $FULL_IMAGE_NAME"

# Validate required environment variables
if [ -z "$FIREBASE_DATABASE_URL" ]; then
  echo "❌ Error: FIREBASE_DATABASE_URL environment variable is required"
  exit 1
fi

ENV_VARS="EMAIL_USER=$EMAIL_USER,EMAIL_PASSWORD=$EMAIL_PASSWORD,BASE_URL=$BASE_URL,FIREBASE_DATABASE_URL=$FIREBASE_DATABASE_URL"

# Determine authentication mode
# Set IAM_MODE=iam in .deploy-config or environment to enable IAM authentication
# When IAM_MODE=iam, the IAM policy from iam-policy.yaml will be applied automatically
IAM_MODE="${IAM_MODE:-unauthenticated}"
if [ "$IAM_MODE" = "iam" ]; then
  AUTH_FLAG="--no-allow-unauthenticated"
  echo "🔒 Using IAM authentication (restricted access)"
  echo "📝 IAM policy from iam-policy.yaml will be applied automatically after deployment"
else
  AUTH_FLAG="--allow-unauthenticated"
  echo "🌐 Allowing unauthenticated access (Firebase token verification required)"
fi

gcloud run deploy "$SERVICE_NAME" \
  --image "$FULL_IMAGE_NAME" \
  --platform managed \
  --region "$REGION" \
  $AUTH_FLAG \
  --memory 256Mi \
  --timeout 60 \
  --max-instances 10 \
  --set-env-vars="$ENV_VARS" \
  ${SERVICE_ACCOUNT:+--service-account="$SERVICE_ACCOUNT"} \
  || {
    echo ""
    echo "❌ Deployment failed"
    exit 1
  }

# Get the service URL
echo ""
echo "✅ Deployment successful!"
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region="$REGION" \
  --format="value(status.url)")

echo ""
echo "🔗 Service URL: $SERVICE_URL/SendClubInvite"
echo ""

# Apply IAM policy automatically on every deploy
POLICY_FILE="$(dirname "$0")/iam-policy.yaml"
if [ -f "$POLICY_FILE" ]; then
  echo "📋 Applying IAM policy from $POLICY_FILE..."
  echo "📍 Service: $SERVICE_NAME"
  echo "📍 Project: $PROJECT_ID"
  echo "🌍 Region: $REGION"
  echo ""
  # Temporarily disable set -e to handle errors gracefully
  set +e
  
  # Get current etag to avoid concurrent modification warnings
  TEMP_POLICY=$(mktemp)
  gcloud run services get-iam-policy "$SERVICE_NAME" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format=yaml > "$TEMP_POLICY" 2>/dev/null
  
  # Extract etag if it exists
  if [ -f "$TEMP_POLICY" ] && grep -q "^etag:" "$TEMP_POLICY"; then
    ETAG=$(grep "^etag:" "$TEMP_POLICY" | sed 's/etag: *//' | tr -d '"' | tr -d "'")
    # Create temporary policy file with etag
    TEMP_WITH_ETAG=$(mktemp)
    {
      echo "etag: $ETAG"
      grep -v "^#" "$POLICY_FILE" | grep -v "^$"
    } > "$TEMP_WITH_ETAG"
    POLICY_TO_APPLY="$TEMP_WITH_ETAG"
  else
    POLICY_TO_APPLY="$POLICY_FILE"
  fi
  
  # Apply the policy
  gcloud run services set-iam-policy "$SERVICE_NAME" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    "$POLICY_TO_APPLY"
  IAM_EXIT_CODE=$?
  
  # Cleanup temp files
  rm -f "$TEMP_POLICY" "$TEMP_WITH_ETAG" 2>/dev/null
  
  set -e
  if [ $IAM_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ IAM policy applied successfully!"
    echo ""
  else
    echo ""
    echo "⚠️  Warning: Failed to apply IAM policy (exit code: $IAM_EXIT_CODE)"
    echo "   You may need to apply it manually: ./apply-iam.sh"
    echo ""
  fi
else
  echo "⚠️  Warning: IAM policy file not found: $POLICY_FILE"
  echo "   Skipping IAM policy application"
  echo ""
fi

if [ "$IAM_MODE" = "iam" ]; then
  echo "🔒 IAM Authentication Enabled"
else
  echo "📝 Update your frontend:"
  echo "   export REACT_APP_INVITE_SERVICE_URL=$SERVICE_URL"
  echo ""
  echo "💡 Security: Service requires Firebase ID token in Authorization header"
  echo "   Cloud Run IAM is not enabled - using Firebase auth only"
fi
echo ""

