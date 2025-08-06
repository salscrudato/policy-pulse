/**
 * Test setup and configuration for PDF Summarizer
 */

import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Mock environment variables for testing
beforeAll(() => {
  // Mock OpenAI API key for tests
  import.meta.env.VITE_OPENAI_API_KEY = 'test-api-key'
  
  // Mock other environment variables
  import.meta.env.DEV = true
  import.meta.env.PROD = false
})

// Global test utilities
global.createMockFile = (name = 'test.pdf', size = 1024, type = 'application/pdf') => {
  const content = 'Mock PDF content '.repeat(Math.ceil(size / 17))
  const blob = new Blob([content], { type })
  const file = new File([blob], name, { type })
  
  // Add mock arrayBuffer method
  file.arrayBuffer = () => Promise.resolve(new ArrayBuffer(size))
  
  return file
}

// Mock PDF.js
global.mockPDFJS = {
  getDocument: () => ({
    promise: Promise.resolve({
      numPages: 3,
      getPage: (pageNum) => Promise.resolve({
        getTextContent: () => Promise.resolve({
          items: [
            { str: `Mock text content for page ${pageNum}. ` },
            { str: 'This is sample PDF text content. ' },
            { str: 'Used for testing purposes only.' }
          ]
        })
      }),
      getMetadata: () => Promise.resolve({
        info: {
          Title: 'Mock PDF Document',
          Author: 'Test Author',
          Subject: 'Test Subject',
          Creator: 'Test Creator',
          Producer: 'Test Producer',
          CreationDate: new Date().toISOString(),
          ModDate: new Date().toISOString(),
        }
      })
    })
  })
}

// Mock OpenAI API responses
global.mockOpenAIResponse = {
  choices: [{
    message: {
      content: 'This is a mock summary generated for testing purposes. It contains multiple paragraphs to simulate a real AI-generated summary.\n\nThe second paragraph provides additional details and analysis of the document content.\n\nThe final paragraph concludes the summary with key takeaways and recommendations.'
    }
  }],
  usage: {
    prompt_tokens: 100,
    completion_tokens: 50,
    total_tokens: 150
  }
}

// Mock fetch for API calls
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(global.mockOpenAIResponse),
  })
)

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve('mock clipboard content')),
  },
})

// Mock window.print
global.print = vi.fn()

// Mock performance API
global.performance = {
  now: vi.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 1024 * 1024, // 1MB
    totalJSHeapSize: 2048 * 1024, // 2MB
    jsHeapSizeLimit: 4096 * 1024, // 4MB
  },
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
}

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock requestIdleCallback
global.requestIdleCallback = vi.fn((callback) => {
  return setTimeout(callback, 0)
})

global.cancelIdleCallback = vi.fn((id) => {
  clearTimeout(id)
})

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-object-url')
global.URL.revokeObjectURL = vi.fn()

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock crypto for secure random generation
if (!global.crypto) {
  global.crypto = {
    getRandomValues: vi.fn((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256)
      }
      return array
    }),
  }
} else {
  global.crypto.getRandomValues = vi.fn((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
    return array
  })
}

// Custom matchers
expect.extend({
  toBeValidPDF(received) {
    const pass = received instanceof File && received.type === 'application/pdf'
    return {
      pass,
      message: () => pass 
        ? `Expected ${received} not to be a valid PDF file`
        : `Expected ${received} to be a valid PDF file`
    }
  },
  
  toHaveValidSummary(received) {
    const pass = received && 
                 typeof received.summary === 'string' && 
                 received.summary.length > 0 &&
                 typeof received.wordCount === 'number' &&
                 received.wordCount > 0
    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to have a valid summary`
        : `Expected ${received} to have a valid summary with content and word count`
    }
  },

  toBeWithinRange(received, min, max) {
    const pass = received >= min && received <= max
    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be within range ${min}-${max}`
        : `Expected ${received} to be within range ${min}-${max}`
    }
  }
})

// Test utilities
export const createMockSummaryResult = (overrides = {}) => ({
  summary: 'Mock summary content for testing purposes.',
  summaryLength: 'MEDIUM',
  documentType: 'General Document',
  wordCount: 8,
  model: 'gpt-4o-mini',
  processingTime: Date.now(),
  isDemo: false,
  ...overrides
})

export const createMockError = (type = 'generic', message = 'Mock error') => {
  const error = new Error(message)
  error.name = type
  return error
}

export const waitForAsync = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))

export const mockConsole = () => {
  const originalConsole = { ...console }
  console.log = vi.fn()
  console.warn = vi.fn()
  console.error = vi.fn()
  console.info = vi.fn()
  
  return {
    restore: () => {
      Object.assign(console, originalConsole)
    }
  }
}

// Cleanup after all tests
afterAll(() => {
  vi.clearAllMocks()
})
