# 📚 Book Clurb

[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.2.1-orange.svg)](https://firebase.google.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg)](https://www.docker.com/)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Cloud%20Run-green.svg)](https://cloud.google.com/run)

> Book Clurb is an open-source management platform for modern book clubs

## 🌟 Features

- **Member Management**: Secure authentication for book club members
- **Meeting Organization**: Streamlined meeting scheduling and management
- **Reading Reflections**: Weekly reflection submissions and tracking
- **User Profiles**: Personalized member profiles and literary preferences
- **Real-time Updates**: Live notifications and updates
- **Responsive Design**: Mobile-friendly interface built with React

## 🚀 Live Demo

**Production Environment**: [https://sombk-web-618324779515.us-central1.run.app](https://sombk-web-618324779515.us-central1.run.app)

## 🛠️ Tech Stack

- **Frontend**: React 19.1.1 with React Router DOM
- **Backend**: Firebase (Authentication & Database)
- **Styling**: CSS3 with Framer Motion animations
- **Testing**: Jest & React Testing Library

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

5. **Open your browser**
   Navigate to `http://localhost:3000`

### Production Deployment

#### Build Docker Image
```bash
docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/moonlit-vine-119321/sombk/web:dev .
```

#### Push to Container Registry
```bash
docker push us-central1-docker.pkg.dev/moonlit-vine-119321/sombk/web:dev
```

#### Deploy to Google Cloud Run
```bash
gcloud run deploy sombk-web \
  --image us-central1-docker.pkg.dev/moonlit-vine-119321/sombk/web:dev \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated
```

<!-- ## 🎯 Roadmap

### Phase 1: Enhanced Engagement
- [ ] Push notifications for new reflections
- [ ] Member participation tracking
- [ ] Book rating and review system

### Phase 2: Community Features
- [ ] User profiles with literary preferences
- [ ] Book club quiz and participation scoring
- [ ] Lucky number submission system

### Phase 3: AI Integration
- [ ] AI-powered book recommendations
- [ ] Reading pattern analysis
- [ ] Personalized reading suggestions -->

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

- **Issues**: [GitHub Issues](https://github.com/yourusername/sombookclub/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/sombookclub/discussions)

---

<div align="center">
  <strong>Built with ❤️ for the book club community</strong>
</div>
