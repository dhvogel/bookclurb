# SOM Book Club

Hello recruiter or other interested party. This is a website I developed for my book club, that serves the dual purposes of managing book club meetings and to help me get back to writing code. It is a two-tier web application, with a React frontend directly interfacing with a Firebase backend, which manages user authentication for the twelve book club members, and some other small data storage, such as a weekly reading reflection per user. The front-end is deployed on GCP Cloud Run, and is available [here](https://sombk-web-618324779515.us-central1.run.app). Having worked on Cloud Run in a prior life, this is a platform that I know inside and out. In addition, feel free to take a look at other open source contributions I've made, such as to the canonical/lxd system container manager ([PR](https://github.com/canonical/lxd/pull/16639)), which is also related to my prior experience working on Cloud Run. Thank you for your time.

### Future ideas

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

### Build

```
docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/moonlit-vine-119321/sombk/web:dev .
```

### Push

```
docker push us-central1-docker.pkg.dev/moonlit-vine-119321/sombk/web:dev
```

### Deploy

```
 gcloud run deploy sombk-web   --image us-central1-docker.pkg.dev/moonlit-vine-119321/sombk/web:dev   --region us-central1   --platform managed   --allow-unauthenticated
```
