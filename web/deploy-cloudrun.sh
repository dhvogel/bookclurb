#!/bin/bash

# Deploy script for Book Clurb Web App to Google Cloud Run
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
SERVICE_NAME="bookclurb-web"
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

IMAGE_NAME="$ARTIFACT_REGISTRY/web"

# Determine environment
ENV="${1:-dev}"
if [ "$ENV" = "--prod" ]; then
  ENV="prod"
  if [ -z "$REACT_APP_INVITE_SERVICE_URL" ]; then
    echo "❌ Error: REACT_APP_INVITE_SERVICE_URL environment variable is required for production"
    echo "   Set it via: export REACT_APP_INVITE_SERVICE_URL=https://your-invite-service-url"
    echo "   Or create $CONFIG_FILE with: REACT_APP_INVITE_SERVICE_URL=https://your-invite-service-url"
    exit 1
  fi
elif [ "$ENV" = "--dev" ]; then
  ENV="dev"
  REACT_APP_INVITE_SERVICE_URL="${REACT_APP_INVITE_SERVICE_URL:-http://localhost:8080}"
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
  echo "   Install it from: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

# Set the project
gcloud config set project "$PROJECT_ID"

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
  echo "💡 Ensure Docker is authenticated: gcloud auth configure-docker ${REGION}-docker.pkg.dev"
  echo "💡 Make sure Artifact Registry is enabled and repository exists"
  exit 1
fi

# Deploy to Cloud Run
echo ""
echo "📦 Deploying to Cloud Run..."
echo "   Using image: $FULL_IMAGE_NAME"

ENV_VARS="REACT_APP_INVITE_SERVICE_URL=$REACT_APP_INVITE_SERVICE_URL"

gcloud run deploy "$SERVICE_NAME" \
  --image "$FULL_IMAGE_NAME" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --memory 512Mi \
  --timeout 60 \
  --max-instances 10 \
  --port 8080 \
  --set-env-vars="$ENV_VARS" \
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
echo "🔗 Service URL: $SERVICE_URL"
echo ""
echo "📝 Update your invite service BASE_URL if needed:"
echo "   export BASE_URL=$SERVICE_URL"
echo ""
echo "💡 The web app is publicly accessible at: $SERVICE_URL"
echo ""

