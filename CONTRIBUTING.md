# Contributing to Tafy Studio

Thank you for your interest in contributing to Tafy Studio! We welcome contributions from the community and are grateful for any help you can provide.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Issues

1. Check if the issue already exists in our [issue tracker](https://github.com/tafystudio/tafystudio/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce (if applicable)
   - Expected vs actual behavior
   - System information (OS, versions, etc.)

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting:

   ```bash
   make pre-push
   ```

5. Commit your changes with a descriptive message
6. Push to your fork
7. Open a Pull Request

### Development Setup

See [DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md) for detailed instructions.

### Coding Standards

- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation as needed
- Keep commits atomic and well-described

### Documentation

- Update relevant documentation in `/docs`
- Add JSDoc/docstrings for public APIs
- Include examples where helpful

## Development Workflow

1. **Check existing work**: Search issues and PRs before starting
2. **Discuss major changes**: Open an issue for discussion first
3. **Keep it focused**: One feature/fix per PR
4. **Test thoroughly**: All tests must pass
5. **Document changes**: Update docs and changelog

## Testing

Run the full test suite:

```bash
make test
```

Run specific tests:

```bash
# Unit tests only
make test-unit

# Integration tests
make test-integration
```

## Questions?

- Check our [documentation](https://docs.tafy.studio)
- Join our community discussions
- Reach out to maintainers

Thank you for contributing to Tafy Studio! 🤖
