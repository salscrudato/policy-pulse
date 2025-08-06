# PDF Summarizer

**AI-Powered Document Summarization Platform**

## 🌐 **Live Demo**

**🎉 The application is now live at: [https://pdf-summarizer-web.web.app](https://pdf-summarizer-web.web.app)**

Try the demo mode without an API key or add your own OpenAI API key for full functionality!

---

PDF Summarizer is a comprehensive, professional-grade application designed to analyze and summarize any PDF document using advanced AI technology. Built with modern React architecture and powered by OpenAI's GPT models, it provides flexible summary lengths, intelligent document type detection, and professional-quality analysis.

## Key Features

### **AI-Powered Analysis**
- **Advanced Coverage Detection**: Identifies all types of P&C insurance coverages including liability, property, auto, workers' compensation, and specialty lines
- **Intelligent Document Processing**: Supports policy declarations, ACORD certificates, coverage forms, endorsements, binders, and quotes
- **Financial Data Extraction**: Automatically extracts limits, deductibles, premiums, and policy terms with high accuracy
- **Gap Analysis**: Identifies missing coverages and provides professional recommendations

### **Professional UI/UX**
- **Multi-View Analysis**: Overview, detailed coverage, financial summary, and gap analysis tabs
- **Enhanced Visual Hierarchy**: Designed specifically for insurance professionals
- **Analysis History**: Track and review previous analyses
- **Export Capabilities**: PDF, Excel, JSON, and CSV export formats

### **Technical Excellence**
- **React 19** with modern hooks and patterns
- **Vite** for lightning-fast development and optimized builds
- **Tailwind CSS v4** for utility-first styling
- **Advanced Error Handling** with circuit breaker patterns
- **Performance Optimization** for large document processing
- **Comprehensive Testing Suite** with Vitest

## Architecture Overview

Policy Pulse follows a modular, scalable architecture designed for enterprise-grade insurance applications:

```
src/
├── components/                    # React components
│   ├── PDFUpload/                # PDF upload and processing
│   ├── CoverageSummary/          # Basic coverage display
│   ├── EnhancedCoverageSummary/  # Advanced coverage analysis UI
│   └── ErrorBoundary/            # Error handling component
├── services/                     # Business logic and API services
│   ├── aiService.js              # Original OpenAI integration
│   └── enhancedAiService.js      # Advanced AI analysis service
├── utils/                        # Utility functions and helpers
│   ├── pdfUtils.js               # PDF processing utilities
│   ├── coverageExtraction.js     # P&C coverage identification
│   ├── advancedDataExtraction.js # Financial and policy data extraction
│   ├── exportUtils.js            # Multi-format export capabilities
│   ├── performance.js            # Performance optimization utilities
│   └── errorHandling.js          # Advanced error handling and recovery
├── hooks/                        # Custom React hooks
├── constants/                    # Application constants
├── test/                         # Comprehensive test suite
│   ├── enhancedAiService.test.js
│   ├── coverageExtraction.test.js
│   ├── mockData.js
│   └── testUtils.js
└── assets/                       # Static assets
```

## Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **OpenAI API Key** (for AI analysis functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/salscrudato/policy-pulse.git
   cd policy-pulse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Add your OpenAI API key to .env.local
   echo "VITE_OPENAI_API_KEY=your_openai_api_key_here" >> .env.local
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Development

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

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Testing
npm run test            # Run test suite
npm run test:ui         # Run tests with UI
npm run test:coverage   # Generate coverage report

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting

# Analysis
npm run analyze         # Bundle size analysis
```

## Usage Guide

### **1. Upload Insurance Document**
- Drag and drop or click to upload PDF files (up to 10MB)
- Supported formats: Policy declarations, ACORD certificates, coverage forms, endorsements, binders

### **2. AI Analysis Process**
- Document validation ensures insurance content
- Advanced text preprocessing optimizes for AI analysis
- OpenAI GPT models analyze coverage comprehensively
- Structured data extraction identifies all coverage elements

### **3. Review Analysis Results**
- **Overview Tab**: Coverage categories and summary statistics
- **Details Tab**: Comprehensive coverage breakdown with confidence scores
- **Financial Tab**: Limits, deductibles, premiums in organized tables
- **Gap Analysis Tab**: Missing coverages and professional recommendations

### **4. Export and Share**
- **Copy**: Copy analysis to clipboard
- **Print**: Print-friendly PDF generation
- **Export**: JSON, CSV, Excel formats available

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

Create a `.env.local` file with the following variables:

```env
# OpenAI Configuration (Required for AI analysis)
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Optional: API Base URL (defaults to OpenAI)
VITE_API_BASE_URL=https://api.openai.com/v1

# Optional: Application Settings
VITE_MAX_FILE_SIZE=10485760  # 10MB in bytes
VITE_SUPPORTED_FORMATS=application/pdf
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

## Dependencies

### Core Dependencies
- `react` (v19) - Modern UI library with latest features
- `react-dom` (v19) - DOM rendering for React
- `pdfjs-dist` (v5.4) - Client-side PDF processing

### Development Dependencies
- `@vitejs/plugin-react` - React support for Vite
- `@tailwindcss/vite` - Tailwind CSS v4 integration
- `vitest` - Fast unit testing framework
- `@testing-library/react` - React testing utilities
- `eslint` - Code linting with React rules
- `prettier` - Code formatting

## Testing

Policy Pulse includes a comprehensive testing suite:

### **Running Tests**
```bash
npm run test              # Run all tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Generate coverage report
```

### **Test Structure**
- **Unit Tests**: Individual component and utility testing
- **Integration Tests**: AI service and data extraction testing
- **Mock Data**: Realistic insurance document samples
- **Coverage Reports**: Detailed test coverage analysis

### **Key Test Files**
- `src/test/enhancedAiService.test.js` - AI service functionality
- `src/test/coverageExtraction.test.js` - Coverage identification
- `src/test/mockData.js` - Sample insurance documents
- `src/test/testUtils.js` - Testing utilities

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
