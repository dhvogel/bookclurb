# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of SOM Book Club seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **Email**: Send details to [security@sombookclub.com](mailto:security@sombookclub.com)
2. **GitHub Security Advisory**: Use GitHub's private vulnerability reporting feature
3. **Direct Message**: Contact the maintainer directly if you have their contact information

### What to Include

When reporting a vulnerability, please include:

- **Description**: A clear description of the vulnerability
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Impact**: Potential impact of the vulnerability
- **Environment**: Your environment details (OS, browser, etc.)
- **Proof of Concept**: If applicable, a minimal proof of concept
- **Suggested Fix**: If you have ideas for how to fix the issue

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Initial Assessment**: We will provide an initial assessment within 5 business days
- **Regular Updates**: We will keep you informed of our progress
- **Resolution**: We will work to resolve the issue as quickly as possible

### Responsible Disclosure

We follow responsible disclosure practices:

1. **Confidentiality**: We will keep your report confidential until we have resolved the issue
2. **Timeline**: We will work to resolve critical issues within 30 days
3. **Credit**: We will credit you in our security advisories (unless you prefer to remain anonymous)
4. **Coordination**: We will coordinate with you on the disclosure timeline

### Scope

This security policy applies to:

- The SOM Book Club application codebase
- Dependencies and third-party libraries
- Infrastructure and deployment configurations
- Documentation and examples

### Out of Scope

The following are considered out of scope:

- Social engineering attacks
- Physical attacks
- Denial of service attacks that don't result in data exposure
- Issues in third-party services we don't control
- Issues that require physical access to the user's device

### Security Best Practices

To help keep SOM Book Club secure, please:

- Keep your dependencies up to date
- Use strong, unique passwords
- Enable two-factor authentication where possible
- Report suspicious activity immediately
- Follow secure coding practices when contributing

### Security Features

SOM Book Club includes several security features:

- **Authentication**: Secure user authentication via Firebase
- **Authorization**: Role-based access control
- **Data Encryption**: All data is encrypted in transit and at rest
- **Input Validation**: Comprehensive input validation and sanitization
- **HTTPS**: All communications are encrypted
- **CORS**: Proper cross-origin resource sharing configuration

### Known Issues

We maintain a list of known security issues and their status:

- No known critical vulnerabilities at this time
- Regular security audits are performed
- Dependencies are monitored for security updates

### Security Updates

Security updates are released as needed:

- **Critical**: Released immediately
- **High**: Released within 7 days
- **Medium**: Released within 30 days
- **Low**: Released with regular updates

### Contact Information

For security-related questions or concerns:

- **Email**: [security@sombookclub.com](mailto:security@sombookclub.com)
- **GitHub**: Use the private vulnerability reporting feature
- **Maintainer**: [Dan Vogel](https://github.com/dhvogel)

### Acknowledgments

We thank the security researchers and community members who help keep SOM Book Club secure through responsible disclosure and security best practices.

---

**Last Updated**: December 2024
**Version**: 1.0
