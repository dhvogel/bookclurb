# sombookclub

site for SOM Book Club

- Notifications for when someone posts a reflection

- Members
  - Books they've participated in
  - Book ratings
  - Book reviews
- Lucky Number submission
- User Profiles, blurb
- Book club quiz, participation grade
- AI recommendation for other books based on ones we've liked
- AI analysis of type of books we read

## Build

```
docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/moonlit-vine-119321/sombk/web:dev .
```

## Push

```
docker push us-central1-docker.pkg.dev/moonlit-vine-119321/sombk/web:dev
```

## Deploy

```
 gcloud run deploy sombk-web   --image us-central1-docker.pkg.dev/moonlit-vine-119321/sombk/web:dev   --region us-central1   --platform managed   --allow-unauthenticated
```
