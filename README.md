# Policy Pulse

A modern React application built with Vite, featuring best practices for scalability, maintainability, and developer experience.

## 🚀 Features

- **React 19** with modern hooks and patterns
- **Vite** for lightning-fast development and optimized builds
- **Tailwind CSS v4** for utility-first styling
- **ESLint** with React-specific rules for code quality
- **Prettier** for consistent code formatting
- **Error Boundary** for graceful error handling
- **Custom Hooks** for reusable logic
- **Utility Functions** for common operations
- **Modular Architecture** for scalability

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ErrorBoundary/   # Error boundary component
│   └── index.js         # Component exports
├── hooks/               # Custom React hooks
│   ├── useLocalStorage.js
│   └── index.js
├── utils/               # Utility functions
│   ├── dateUtils.js     # Date formatting and manipulation
│   ├── validation.js    # Form validation helpers
│   └── index.js
├── constants/           # Application constants
│   └── index.js
├── assets/              # Static assets
├── App.jsx              # Main application component
├── main.jsx             # Application entry point
└── index.css            # Global styles
```

## 🛠️ Development

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run clean` - Clean build directory

## 🏗️ Build & Deployment

### Production Build

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Build Features

- **Code Splitting**: Automatic vendor chunk separation
- **Source Maps**: Generated for debugging
- **Asset Optimization**: Images and other assets are optimized
- **Tree Shaking**: Unused code is eliminated

## 🎨 Styling

This project uses **Tailwind CSS v4** with:

- CSS-first configuration
- Custom theme tokens
- Utility-first approach
- Responsive design utilities

### Custom Theme

The theme is configured in `src/index.css`:

```css
@theme {
  --color-brand: oklch(0.72 0.11 221.19);
  --font-display: "Inter", sans-serif;
}
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_NAME=Policy Pulse
```

### ESLint Configuration

ESLint is configured with:
- React-specific rules
- React Hooks rules
- React Refresh rules
- Modern JavaScript standards

### Prettier Configuration

Code formatting is standardized with:
- Single quotes
- No semicolons
- 2-space indentation
- Trailing commas

## 📦 Dependencies

### Core Dependencies
- `react` - UI library
- `react-dom` - DOM rendering

### Development Dependencies
- `@vitejs/plugin-react` - React support for Vite
- `@tailwindcss/vite` - Tailwind CSS integration
- `eslint` - Code linting
- `prettier` - Code formatting

## 🚀 Scaling Guidelines

### Adding Components

1. Create component in `src/components/ComponentName/`
2. Export from `src/components/index.js`
3. Follow naming conventions (PascalCase)

### Adding Hooks

1. Create hook in `src/hooks/useHookName.js`
2. Export from `src/hooks/index.js`
3. Follow naming conventions (camelCase with 'use' prefix)

### Adding Utilities

1. Create utility in appropriate `src/utils/` file
2. Export from `src/utils/index.js`
3. Keep functions pure and well-documented

## 🤝 Contributing

1. Follow the established code style
2. Run `npm run lint` and `npm run format` before committing
3. Write meaningful commit messages
4. Test your changes thoroughly

## 📄 License

This project is licensed under the MIT License.
