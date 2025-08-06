/**
 * Basic tests for PDFUpload component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PDFUpload from '../components/PDFUpload/PDFUpload'

// Mock the PDF processor hook
vi.mock('../hooks/usePDFProcessor', () => ({
  default: () => ({
    file: null,
    isProcessing: false,
    progress: 0,
    error: null,
    summaryResult: null,
    processFile: vi.fn(),
    regenerateSummary: vi.fn(),
    cancelProcessing: vi.fn(),
    reset: vi.fn(),
    hasResult: false,
    canRegenerate: false,
  })
}))

// Mock responsive utilities
vi.mock('../utils/responsive', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
    deviceType: 'desktop'
  }),
  getResponsiveContainer: () => 'max-w-4xl mx-auto px-4',
  getResponsiveGrid: () => 'grid grid-cols-1 md:grid-cols-3'
}))

// Mock security utilities
vi.mock('../utils/security', () => ({
  validateFileUpload: () => ({ isValid: true, errors: [], warnings: [] }),
  uploadRateLimiter: {
    isAllowed: () => true,
    getTimeUntilReset: () => 0
  }
}))

describe('PDFUpload Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial Render', () => {
    it('renders the main heading', () => {
      render(<PDFUpload />)
      expect(screen.getByText('PDF Summarizer')).toBeInTheDocument()
    })

    it('renders summary length selection options', () => {
      render(<PDFUpload />)
      expect(screen.getByText('Short')).toBeInTheDocument()
      expect(screen.getByText('Medium')).toBeInTheDocument()
      expect(screen.getByText('Long')).toBeInTheDocument()
    })

    it('renders upload area', () => {
      render(<PDFUpload />)
      expect(screen.getByText('Upload your PDF')).toBeInTheDocument()
    })
  })

})
