# Book Clurb Invite Service

Go HTTP service for sending club invite emails via Gmail SMTP. Secured with Firebase authentication and Cloud Run IAM.

## Docker Build & Push

```bash
# Authenticate Docker with Artifact Registry
gcloud auth configure-docker REGION-docker.pkg.dev

# Build and push image (set ARTIFACT_REGISTRY env var)
docker build -t $ARTIFACT_REGISTRY/email:dev .
docker push $ARTIFACT_REGISTRY/email:dev
```

## Deploy

```bash
./deploy-cloudrun.sh --dev
```

Deploys with environment variables from `.deploy-config` (Gmail credentials, base URL).

## IAM Setup

Apply IAM policy to restrict access:

```bash
./apply-iam.sh
```



## Configuration

Set required environment variables:
```bash
export GOOGLE_CLOUD_PROJECT=your-project-id
export ARTIFACT_REGISTRY=us-central1-docker.pkg.dev/PROJECT_ID/REPO_NAME
export FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
export BASE_URL=https://your-app-url.com
```

Or create `.deploy-config` with:
```
EMAIL_USER=email@gmail.com
EMAIL_PASSWORD=app-password
BASE_URL=https://app-url.com
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
```

## Testing

Get your Firebase ID token and call the service:

```bash
curl -X POST https://SERVICE_URL/SendClubInvite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{"email":"test@example.com","clubId":"club-id","clubName":"Club Name","inviterName":"Admin"}'
```

## Future Improvements

- **TODO**: Move Hardcover integration (`/TestHardcoverToken`, `/SyncRatingToHardcover`, `/SyncReviewToHardcover`) to its own dedicated service with API gateway. This will:
  - Improve separation of concerns (invite service vs. integration service)
  - Allow independent scaling of Hardcover API calls
  - Enable better rate limiting and monitoring
  - Provide centralized API gateway for all external integrations
