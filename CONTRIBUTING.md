# 🤝 Contributing to PDF Summarizer

Thank you for your interest in contributing to PDF Summarizer! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## 📜 Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**
- **OpenAI API Key** (for testing AI features)

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/pdf-summarizer.git
   cd pdf-summarizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Add your OpenAI API key and other configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Run tests**
   ```bash
   npm run test
   ```

## 🔄 Development Workflow

### Branch Naming Convention

- **Feature branches**: `feature/description-of-feature`
- **Bug fixes**: `fix/description-of-bug`
- **Documentation**: `docs/description-of-change`
- **Refactoring**: `refactor/description-of-refactor`
- **Performance**: `perf/description-of-optimization`

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(pdf-upload): add drag and drop functionality
fix(security): resolve XSS vulnerability in file validation
docs(readme): update installation instructions
test(pdf-processor): add unit tests for text extraction
```

### Development Process

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow coding standards
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**

## 📏 Coding Standards

### JavaScript/React Guidelines

- Use **functional components** with hooks
- Implement **proper error boundaries**
- Follow **React best practices**
- Use **meaningful variable names**
- Write **self-documenting code**

### Code Style

We use **ESLint** and **Prettier** for code formatting:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### File Organization

```
src/
├── components/          # React components
│   └── ComponentName/
│       ├── ComponentName.jsx
│       ├── ComponentName.test.jsx
│       └── index.js
├── hooks/              # Custom hooks
├── services/           # API services
├── utils/              # Utility functions
├── test/               # Test utilities
└── assets/             # Static assets
```

### Component Guidelines

**Component Structure:**
```jsx
import { memo, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'

const ComponentName = memo(({
  prop1,
  prop2,
  onAction,
}) => {
  // Hooks
  const memoizedValue = useMemo(() => {
    // Expensive calculation
  }, [dependency])

  const handleAction = useCallback(() => {
    onAction?.()
  }, [onAction])

  // Render
  return (
    <div>
      {/* Component content */}
    </div>
  )
})

ComponentName.displayName = 'ComponentName'

ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
  onAction: PropTypes.func,
}

export default ComponentName
```

### Performance Guidelines

- Use **React.memo** for expensive components
- Implement **useMemo** and **useCallback** appropriately
- Avoid **unnecessary re-renders**
- Optimize **bundle size**
- Implement **lazy loading** where appropriate

## 🧪 Testing Guidelines

### Testing Strategy

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **Accessibility Tests**: Ensure WCAG compliance
- **Performance Tests**: Monitor performance metrics

### Writing Tests

**Component Testing:**
```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ComponentName from './ComponentName'

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('handles user interaction', async () => {
    const user = userEvent.setup()
    const mockHandler = vi.fn()
    
    render(<ComponentName onAction={mockHandler} />)
    
    await user.click(screen.getByRole('button'))
    
    expect(mockHandler).toHaveBeenCalled()
  })
})
```

**Utility Testing:**
```jsx
import { validatePDFFile } from './pdfUtils'

describe('validatePDFFile', () => {
  it('validates PDF files correctly', () => {
    const validFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    expect(validatePDFFile(validFile)).toBe(true)
  })

  it('rejects invalid files', () => {
    const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' })
    expect(validatePDFFile(invalidFile)).toBe(false)
  })
})
```

### Test Coverage

Maintain minimum test coverage:
- **Functions**: 80%
- **Lines**: 80%
- **Branches**: 80%
- **Statements**: 80%

```bash
npm run test:coverage
```

## 🔍 Pull Request Process

### Before Submitting

1. **Ensure all tests pass**
   ```bash
   npm run test
   ```

2. **Check code quality**
   ```bash
   npm run lint
   npm run type-check
   ```

3. **Update documentation**
   - Update README if needed
   - Add JSDoc comments
   - Update CHANGELOG

4. **Test manually**
   - Test your changes in the browser
   - Verify accessibility
   - Check responsive design

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Accessibility tested

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass
```

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Manual testing** if needed
4. **Approval** from at least one maintainer
5. **Merge** to main branch

## 🐛 Issue Reporting

### Bug Reports

Use the bug report template:

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce the behavior

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable, add screenshots

**Environment:**
- OS: [e.g. iOS]
- Browser: [e.g. chrome, safari]
- Version: [e.g. 22]
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
Description of the problem

**Describe the solution you'd like**
Clear description of desired solution

**Describe alternatives you've considered**
Alternative solutions considered

**Additional context**
Any other context or screenshots
```

## 🏷️ Labels and Milestones

### Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements or additions to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `priority:high`: High priority issue
- `priority:medium`: Medium priority issue
- `priority:low`: Low priority issue

### Milestones

- `v1.0.0`: Initial release
- `v1.1.0`: Feature updates
- `v1.0.1`: Bug fixes

## 🎯 Areas for Contribution

### High Priority
- **Accessibility improvements**
- **Performance optimizations**
- **Security enhancements**
- **Test coverage improvements**

### Medium Priority
- **UI/UX enhancements**
- **Documentation updates**
- **Code refactoring**
- **New features**

### Good First Issues
- **Documentation fixes**
- **Simple bug fixes**
- **Code formatting**
- **Test additions**

## 📞 Getting Help

- **GitHub Discussions**: For questions and discussions
- **GitHub Issues**: For bug reports and feature requests
- **Email**: maintainers@pdf-summarizer.app

## 🙏 Recognition

Contributors will be recognized in:
- **README.md** contributors section
- **CHANGELOG.md** for significant contributions
- **GitHub releases** notes

Thank you for contributing to PDF Summarizer! 🎉
