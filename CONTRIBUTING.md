# Contributing to FortifyJS 🤝

Thank you for your interest in contributing to FortifyJS! We welcome contributions from developers of all skill levels who are passionate about security and cryptography.

## 🎯 Ways to Contribute

### 🐛 Bug Reports
- Use the [GitHub Issues](https://github.com/NEHONIX/FortifyJS/issues) page
- Search existing issues before creating a new one
- Include detailed reproduction steps
- Provide system information (Node.js version, OS, etc.)

### 💡 Feature Requests
- Open an issue with the "enhancement" label
- Describe the use case and expected behavior
- Consider security implications
- Discuss implementation approaches

### 🔧 Code Contributions
- Fork the repository
- Create a feature branch (`git checkout -b feature/amazing-feature`)
- Make your changes
- Add tests for new functionality
- Ensure all tests pass
- Submit a pull request

### 📚 Documentation
- Improve existing documentation
- Add code examples
- Fix typos and grammar
- Translate documentation

## 🚀 Development Setup

### Prerequisites
- Node.js 22.12.0 or higher
- npm or yarn
- Git

### Setup Steps
```bash
# Clone the repository
git clone https://github.com/NEHONIX/FortifyJS.git
cd FortifyJS

# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build

# Run development server
npm run dev
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testNamePattern="PasswordManager"
```

### Writing Tests
- Write tests for all new functionality
- Follow existing test patterns
- Use descriptive test names
- Test both success and error cases
- Include security-focused tests

### Test Structure
```typescript
describe('PasswordManager', () => {
    describe('hash method', () => {
        it('should hash password with Argon2ID', async () => {
            // Test implementation
        });
        
        it('should reject weak passwords', async () => {
            // Test implementation
        });
    });
});
```

## 🔒 Security Guidelines

### Security-First Development
- **Never commit secrets** or sensitive data
- **Validate all inputs** thoroughly
- **Use timing-safe operations** for comparisons
- **Follow cryptographic best practices**
- **Document security assumptions**

### Cryptographic Standards
- Use established algorithms (Argon2, AES, etc.)
- Implement constant-time operations
- Secure memory management
- Proper random number generation
- Side-channel attack resistance

### Code Review Focus
- Security implications of changes
- Performance impact on cryptographic operations
- Backward compatibility
- API design consistency

## 📝 Code Style

### TypeScript Guidelines
- Use strict TypeScript configuration
- Provide comprehensive type definitions
- Document complex types with JSDoc
- Prefer interfaces over type aliases for objects

### Naming Conventions
- Use descriptive variable names
- Follow camelCase for variables and functions
- Use PascalCase for classes and interfaces
- Use UPPER_CASE for constants

### Code Formatting
```bash
# Format code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🏗️ Architecture Guidelines

### Modular Design
- Keep modules focused and cohesive
- Minimize dependencies between modules
- Use dependency injection where appropriate
- Follow SOLID principles

### Error Handling
- Use custom error types
- Provide meaningful error messages
- Include context in error objects
- Handle errors gracefully

### Performance Considerations
- Profile cryptographic operations
- Optimize hot paths
- Consider memory usage
- Document performance characteristics

## 📋 Pull Request Process

### Before Submitting
1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Run the full test suite**
4. **Check code formatting**
5. **Update CHANGELOG.md** if applicable

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] New tests added
- [ ] Manual testing completed

## Security Impact
- [ ] No security implications
- [ ] Security review required
- [ ] Cryptographic changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

### Review Process
1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Security review** for crypto changes
4. **Testing** in multiple environments
5. **Approval** and merge

## 🌟 Recognition

### Contributors
All contributors are recognized in:
- README.md contributors section
- CHANGELOG.md for significant contributions
- GitHub contributors page

### Maintainer Path
Active contributors may be invited to become maintainers based on:
- Quality of contributions
- Understanding of security principles
- Community involvement
- Commitment to the project

## 📞 Getting Help

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Email**: security@nehonix.space (security issues only)

### Documentation
- **README.md**: Project overview and quick start
- **API Documentation**: Detailed API reference
- **Examples**: Real-world usage examples

## 🎉 Thank You!

Your contributions help make the web more secure. Every bug fix, feature addition, and documentation improvement makes a difference.

**Happy coding!** 🚀🔐

---

*For security vulnerabilities, please see our [Security Policy](SECURITY.md)*
