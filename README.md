# 📚 Book Clurb

[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.2.1-orange.svg)](https://firebase.google.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg)](https://www.docker.com/)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Cloud%20Run-green.svg)](https://cloud.google.com/run)

> Book Clurb is an open-source management platform for modern book clubs

## 🌟 Features

- **Club Management**: Create, view, and manage multiple book clubs with customizable settings
- **Meeting Organization & Reflections**: Track scheduled meetings with reading assignments and submit weekly reflections
- **Book Selection & Voting**: Submit book suggestions, vote using instant-runoff voting, and view live leaderboards with reading progress tracking
- **Member Invitations**: Email-based invitations to join clubs, member role management (admin/member), and member profiles
- **User Profiles**: Secure authentication, personal profiles, and management of all your club memberships

## 🚀 Live Demo

**Production Environment**: [Live Demo URL](https://bookclurb-web-z726b2uvfa-uc.a.run.app)

## 🛠️ Tech Stack

- **Frontend**: React 19.1.1 with React Router DOM
- **Backend**: Firebase (Authentication & Database)
- **Styling**: CSS3 with Framer Motion animations
- **Testing**: Jest & React Testing Library

## 📁 Project Structure

```
bookclurb/
├── web/              # React frontend application
│
├── invite/           # Go microservice for sending club invites
│
└── scripts/          # Utility scripts for data management
```

## 📋 Prerequisites

- Node.js (v16 or higher)
- Docker
- Google Cloud SDK (for deployment)
- Firebase project setup

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/sombookclub.git
   cd sombookclub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project
   - Update `src/firebaseConfig.js` with your Firebase credentials

4. **Start the development server**
   ```bash
   npm start
   ```
   
   **Or use Docker Compose:**
   ```bash
   docker-compose -f docker-compose.local.yml up --build
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

### Production Deployment

#### Build Docker Image
```bash
docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/PROJECT_ID/IMAGE_NAME:tag .
```

#### Push to Container Registry
```bash
docker push us-central1-docker.pkg.dev/PROJECT_ID/IMAGE_NAME:tag
```

#### Deploy to Google Cloud Run
```bash
gcloud run deploy SERVICE_NAME \
  --image us-central1-docker.pkg.dev/PROJECT_ID/IMAGE_NAME:tag \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated
```

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow React best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Lead Developer**: [Dan Vogel](https://github.com/dhvogel)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/dhvogel/sombookclub/issues)
- **Discussions**: [GitHub Discussions](https://github.com/dhvogel/sombookclub/discussions)

---

<div align="center">
  <strong>Built with ❤️ for the book club community</strong>
</div>
