# Contributing to SOM Book Club

Thank you for your interest in contributing to SOM Book Club! We welcome contributions from the community and appreciate your help in making this project better.

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git
- A Firebase account (for local development)

### Development Setup

1. **Fork the repository**
   ```bash
   # Fork the repo on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/sombookclub.git
   cd sombookclub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   
   # Edit .env.local with your Firebase credentials
   # Get these from your Firebase project settings
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📝 How to Contribute

### Reporting Issues

- Use the GitHub issue tracker
- Search existing issues before creating new ones
- Use clear, descriptive titles
- Include steps to reproduce bugs
- Specify your environment (OS, Node.js version, etc.)

### Suggesting Features

- Open a discussion or issue with the "enhancement" label
- Describe the feature and its benefits
- Consider the impact on existing functionality
- Be open to feedback and iteration

### Code Contributions

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**
   - Follow the existing code style
   - Write meaningful commit messages
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm test
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add: brief description of your changes"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Use a clear, descriptive title
   - Reference any related issues
   - Provide a detailed description of changes
   - Include screenshots for UI changes

## 🎯 Development Guidelines

### Code Style

- Follow React best practices
- Use TypeScript for type safety
- Write clean, readable code
- Use meaningful variable and function names
- Add comments for complex logic

### Commit Messages

Use conventional commit format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

Examples:
```
feat: add user profile editing functionality
fix: resolve authentication redirect loop
docs: update README with new setup instructions
```

### Testing

- Write tests for new features
- Ensure existing tests pass
- Test edge cases and error conditions
- Use React Testing Library for component tests

### Pull Request Process

1. **Keep PRs focused** - One feature or fix per PR
2. **Write clear descriptions** - Explain what and why
3. **Include tests** - For new functionality
4. **Update documentation** - If needed
5. **Request reviews** - From maintainers or contributors

## 🏗️ Project Structure

```
src/
├── components/          # React components
├── config/             # Configuration files
├── types/              # TypeScript type definitions
├── firebaseConfig.ts   # Firebase configuration
└── ...
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment details**
   - OS and version
   - Node.js version
   - Browser and version

2. **Steps to reproduce**
   - Clear, numbered steps
   - Expected vs actual behavior

3. **Additional context**
   - Screenshots or videos
   - Console errors
   - Network requests (if relevant)

## 💡 Feature Requests

When suggesting features:

1. **Check existing issues** - Avoid duplicates
2. **Describe the problem** - What need does this address?
3. **Propose a solution** - How should it work?
4. **Consider alternatives** - Other ways to solve this?

## 📚 Resources

- [React Documentation](https://reactjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)

## 🤝 Community Guidelines

- Be respectful and inclusive
- Help others learn and grow
- Provide constructive feedback
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md)

## 📞 Getting Help

- **GitHub Discussions** - For questions and general discussion
- **GitHub Issues** - For bug reports and feature requests
- **Email** - For security issues (see SECURITY.md)

## 🎉 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributor graphs

Thank you for contributing to SOM Book Club! 🚀
