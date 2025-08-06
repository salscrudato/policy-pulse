# 🚀 Deployment Guide

This guide covers deployment strategies, configuration, and best practices for the PDF Summarizer application.

## 📋 Pre-Deployment Checklist

### ✅ Code Quality
- [ ] All tests passing (`npm run test`)
- [ ] Code linting clean (`npm run lint`)
- [ ] Security audit clean (`npm audit`)
- [ ] Performance optimized (`npm run analyze`)
- [ ] Accessibility compliant (`npm run test:a11y`)

### ✅ Configuration
- [ ] Environment variables configured
- [ ] API keys secured
- [ ] Build optimization enabled
- [ ] Error tracking configured
- [ ] Analytics setup (if applicable)

### ✅ Security
- [ ] Content Security Policy configured
- [ ] HTTPS enabled
- [ ] API rate limiting configured
- [ ] Input validation implemented
- [ ] Error messages sanitized

## 🏗️ Build Process

### Production Build
```bash
# Install dependencies
npm ci --only=production

# Run tests
npm run test

# Build for production
npm run build

# Preview build locally
npm run preview
```

### Build Optimization
The build process includes:
- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Unused code elimination
- **Minification**: JavaScript and CSS compression
- **Asset Optimization**: Image and font optimization
- **Bundle Analysis**: Size optimization

## 🌐 Deployment Platforms

### Vercel (Recommended)

**Automatic Deployment:**
1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

**Manual Deployment:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

**Vercel Configuration (`vercel.json`):**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_OPENAI_API_KEY": "@openai_api_key"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Netlify

**Automatic Deployment:**
1. Connect GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Configure environment variables

**Manual Deployment:**
```bash
# Build the project
npm run build

# Install Netlify CLI
npm i -g netlify-cli

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

**Netlify Configuration (`netlify.toml`):**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### AWS S3 + CloudFront

**Setup Process:**
1. Create S3 bucket for static hosting
2. Configure CloudFront distribution
3. Set up Route 53 for custom domain
4. Configure SSL certificate

**Deployment Script:**
```bash
#!/bin/bash
# Build the project
npm run build

# Sync to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### Docker Deployment

**Dockerfile:**
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Docker Compose:**
```yaml
version: '3.8'
services:
  pdf-summarizer:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

## ⚙️ Environment Configuration

### Environment Variables

**Development (`.env.local`):**
```env
VITE_OPENAI_API_KEY=sk-your-dev-api-key
VITE_ENVIRONMENT=development
VITE_DEBUG=true
VITE_API_BASE_URL=http://localhost:3000
```

**Production (`.env.production`):**
```env
VITE_OPENAI_API_KEY=sk-your-prod-api-key
VITE_ENVIRONMENT=production
VITE_DEBUG=false
VITE_API_BASE_URL=https://api.your-domain.com
VITE_SENTRY_DSN=your-sentry-dsn
VITE_ANALYTICS_ID=your-analytics-id
```

### Security Configuration

**Content Security Policy:**
```javascript
const csp = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", "data:", "blob:"],
  'connect-src': ["'self'", "https://api.openai.com"],
  'worker-src': ["'self'", "blob:"],
}
```

## 📊 Monitoring & Analytics

### Performance Monitoring
- **Core Web Vitals**: Monitor LCP, FID, CLS
- **Bundle Size**: Track bundle size changes
- **Load Times**: Monitor page load performance
- **Error Rates**: Track JavaScript errors

### Error Tracking
```javascript
// Sentry configuration
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_ENVIRONMENT,
  tracesSampleRate: 1.0,
})
```

### Analytics
```javascript
// Google Analytics 4
gtag('config', 'GA_MEASUREMENT_ID', {
  page_title: 'PDF Summarizer',
  page_location: window.location.href,
})
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow (`.github/workflows/deploy.yml`):**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run test
      - run: npm run lint
      - run: npm audit

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
        env:
          VITE_OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## 🚨 Troubleshooting

### Common Issues

**Build Failures:**
- Check Node.js version compatibility
- Verify all dependencies are installed
- Check for TypeScript errors
- Validate environment variables

**Performance Issues:**
- Analyze bundle size with `npm run analyze`
- Check for memory leaks
- Optimize images and assets
- Enable compression

**Security Issues:**
- Update dependencies regularly
- Run security audits
- Validate CSP configuration
- Check for exposed secrets

### Health Checks

**Application Health:**
```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
  })
})
```

## 📈 Post-Deployment

### Verification Steps
1. **Functionality Test**: Upload and process a test PDF
2. **Performance Check**: Verify load times and responsiveness
3. **Security Scan**: Run security audit
4. **Accessibility Test**: Verify WCAG compliance
5. **Cross-Browser Test**: Test on major browsers

### Monitoring Setup
1. Configure uptime monitoring
2. Set up error alerting
3. Monitor performance metrics
4. Track user analytics
5. Set up log aggregation

### Maintenance
- Regular dependency updates
- Security patch management
- Performance optimization
- Feature flag management
- Database maintenance (if applicable)

---

For additional support, refer to the main [README.md](README.md) or contact the development team.
