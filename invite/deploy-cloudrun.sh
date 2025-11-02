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
    echo "   Set it via: export BASE_URL=https://your-web-service-url"
    echo "   Or create $CONFIG_FILE with: BASE_URL=https://your-web-service-url"
    exit 1
  fi
elif [ "$ENV" = "--dev" ]; then
  ENV="dev"
  if [ -z "$BASE_URL" ]; then
    echo "⚠️  Warning: BASE_URL not set"
    echo "   Set it via: export BASE_URL=https://your-web-service-url"
    echo "   Or create $CONFIG_FILE with: BASE_URL=https://your-web-service-url"
    echo "   Example: BASE_URL=https://bookclurb-web-xxxxx.run.app"
    read -p "   Enter web service URL (or press Enter to use localhost:3000): " BASE_URL_INPUT
    if [ -n "$BASE_URL_INPUT" ]; then
      BASE_URL="$BASE_URL_INPUT"
    else
      BASE_URL="http://localhost:3000"
      echo "   Using default: $BASE_URL"
    fi
  fi
else
  echo "Usage: $0 [--prod|--dev]"
  exit 1
fi

# Validate BASE_URL is set
if [ -z "$BASE_URL" ]; then
  echo "❌ Error: BASE_URL is required"
  exit 1
fi

echo "🚀 Deploying $SERVICE_NAME to Cloud Run (Environment: $ENV)"
echo "📍 Project: $PROJECT_ID"
echo "🌍 Region: $REGION"
echo "🌐 Base URL: $BASE_URL"
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
echo "🔨 Building Docker image for linux/amd64..."
cd "$(dirname "$0")"

FULL_IMAGE_NAME="$IMAGE_NAME:$IMAGE_TAG"

# Build for linux/amd64 platform (required for Cloud Run, even on M1 Macs)
if ! docker build --platform linux/amd64 -t "$FULL_IMAGE_NAME" .; then
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

# Get Firebase project ID (extract from database URL if not set)
if [ -z "$FIREBASE_PROJECT_ID" ]; then
  # Try to extract from FIREBASE_DATABASE_URL (format: https://PROJECT_ID-default-rtdb.firebaseio.com)
  FIREBASE_PROJECT_ID=$(echo "$FIREBASE_DATABASE_URL" | sed -n 's|https://\([^-]*\)-.*\.firebaseio\.com|\1|p')
  if [ -z "$FIREBASE_PROJECT_ID" ]; then
    echo "⚠️  Warning: Could not extract FIREBASE_PROJECT_ID from FIREBASE_DATABASE_URL"
    echo "   Please set FIREBASE_PROJECT_ID in .deploy-config (e.g., FIREBASE_PROJECT_ID=sombk-firebase-free)"
    read -p "   Enter Firebase project ID: " FIREBASE_PROJECT_ID
  else
    echo "✅ Auto-detected Firebase project ID: $FIREBASE_PROJECT_ID"
  fi
fi

if [ -z "$FIREBASE_PROJECT_ID" ]; then
  echo "❌ Error: FIREBASE_PROJECT_ID is required"
  exit 1
fi

ENV_VARS="EMAIL_USER=$EMAIL_USER,EMAIL_PASSWORD=$EMAIL_PASSWORD,BASE_URL=$BASE_URL,FIREBASE_DATABASE_URL=$FIREBASE_DATABASE_URL,FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID"

echo "🌐 Allowing unauthenticated access (Firebase token verification required)"

# Check if service account is set and provide guidance
if [ -n "$SERVICE_ACCOUNT" ]; then
  echo ""
  echo "📋 Using service account: $SERVICE_ACCOUNT"
  echo "⚠️  Ensure this service account has Firebase Realtime Database Admin role"
  echo "   Grant permissions with:"
  echo "   gcloud projects add-iam-policy-binding sombk-firebase-free \\"
  echo "     --member=\"serviceAccount:$SERVICE_ACCOUNT\" \\"
  echo "     --role=\"roles/firebase.admin\""
  echo ""
fi

gcloud run deploy "$SERVICE_NAME" \
  --image "$FULL_IMAGE_NAME" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
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
echo "📝 Update your frontend:"
echo "   export REACT_APP_INVITE_SERVICE_URL=$SERVICE_URL"
echo ""
echo "💡 Security: Service requires Firebase ID token in Authorization header"
echo ""

