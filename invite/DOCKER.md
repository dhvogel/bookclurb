# Docker Build and Run Guide

This Dockerfile is designed to work both locally and on Cloud Run.

## Local Development

### Build the image

```bash
cd invite
docker build -t bookclurb-invite:local .
```

### Run locally

```bash
docker run -p 8080:8080 \
  -e EMAIL_USER=your-email@gmail.com \
  -e EMAIL_PASSWORD=your-app-password \
  -e BASE_URL=http://localhost:3000 \
  -e FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com \
  -e GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase_sa_key.json \
  -v /path/to/firebase_sa_key.json:/path/to/firebase_sa_key.json:ro \
  bookclurb-invite:local
```