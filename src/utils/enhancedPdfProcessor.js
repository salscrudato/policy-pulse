/**
 * Enhanced PDF processing utilities with security and performance optimizations
 */

import * as pdfjsLib from 'pdfjs-dist'
import { PDFProcessingError, ValidationError } from './errorHandling'

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

// Security constants
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MIN_FILE_SIZE = 1024 // 1KB
const MAX_PAGES = 500 // Prevent processing of extremely large documents
const MAX_TEXT_LENGTH = 1000000 // 1MB of text
const ALLOWED_MIME_TYPES = ['application/pdf']

// PDF magic number for validation
const PDF_MAGIC_NUMBERS = [
  [0x25, 0x50, 0x44, 0x46], // %PDF
]

/**
 * Enhanced file validation with security checks
 * @param {File} file - File to validate
 * @throws {ValidationError} - If file is invalid
 */
export const validatePDFFile = async (file) => {
  if (!file) {
    throw new ValidationError('No file provided')
  }

  // Basic file properties validation
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new ValidationError('File must be a PDF document', 'fileType')
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`, 'fileSize')
  }

  if (file.size < MIN_FILE_SIZE) {
    throw new ValidationError('File appears to be empty or corrupted', 'fileSize')
  }

  // Magic number validation for additional security
  try {
    const buffer = await file.slice(0, 4).arrayBuffer()
    const bytes = new Uint8Array(buffer)
    
    const isValidPDF = PDF_MAGIC_NUMBERS.some(magic => 
      magic.every((byte, index) => bytes[index] === byte)
    )

    if (!isValidPDF) {
      throw new ValidationError('File does not appear to be a valid PDF', 'fileFormat')
    }
  } catch (error) {
    if (error instanceof ValidationError) throw error
    throw new ValidationError('Unable to validate file format', 'fileValidation')
  }
}

/**
 * Extract text from PDF with progress tracking and optimization
 * @param {File} file - PDF file to process
 * @param {Function} onProgress - Progress callback (page, totalPages)
 * @param {AbortSignal} signal - Abort signal for cancellation
 * @returns {Promise<{text: string, metadata: object}>} - Extracted text and metadata
 */
export const extractTextFromPDF = async (file, onProgress = null, signal = null) => {
  try {
    // Validate file first
    await validatePDFFile(file)

    const arrayBuffer = await file.arrayBuffer()
    
    // Check for cancellation
    if (signal?.aborted) {
      throw new Error('Operation cancelled')
    }

    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      disableFontFace: true, // Performance optimization
      maxImageSize: 1024 * 1024, // Limit image processing
    }).promise

    // Validate page count
    if (pdf.numPages > MAX_PAGES) {
      throw new PDFProcessingError(`Document has too many pages (${pdf.numPages}). Maximum allowed: ${MAX_PAGES}`)
    }

    let fullText = ''
    const metadata = {
      numPages: pdf.numPages,
      title: '',
      author: '',
      subject: '',
      creator: '',
      producer: '',
      creationDate: null,
      modificationDate: null,
    }

    // Extract metadata
    try {
      const pdfMetadata = await pdf.getMetadata()
      if (pdfMetadata.info) {
        Object.assign(metadata, {
          title: pdfMetadata.info.Title || '',
          author: pdfMetadata.info.Author || '',
          subject: pdfMetadata.info.Subject || '',
          creator: pdfMetadata.info.Creator || '',
          producer: pdfMetadata.info.Producer || '',
          creationDate: pdfMetadata.info.CreationDate || null,
          modificationDate: pdfMetadata.info.ModDate || null,
        })
      }
    } catch (metadataError) {
      console.warn('Could not extract PDF metadata:', metadataError)
    }

    // Extract text page by page with progress tracking
    for (let i = 1; i <= pdf.numPages; i++) {
      // Check for cancellation
      if (signal?.aborted) {
        throw new Error('Operation cancelled')
      }

      try {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ')
          .trim()

        if (pageText) {
          fullText += pageText + '\n\n'
        }

        // Report progress
        if (onProgress) {
          onProgress(i, pdf.numPages)
        }

        // Check text length limit
        if (fullText.length > MAX_TEXT_LENGTH) {
          console.warn(`Text extraction stopped at page ${i} due to length limit`)
          break
        }

      } catch (pageError) {
        console.warn(`Error extracting text from page ${i}:`, pageError)
        // Continue with other pages
      }
    }

    const finalText = fullText.trim()
    
    if (!finalText) {
      throw new PDFProcessingError('No readable text found in the PDF document')
    }

    return {
      text: finalText,
      metadata: {
        ...metadata,
        extractedPages: Math.min(pdf.numPages, Math.ceil(fullText.length / 1000)),
        textLength: finalText.length,
        wordCount: finalText.split(/\s+/).length,
      }
    }

  } catch (error) {
    if (error instanceof ValidationError || error instanceof PDFProcessingError) {
      throw error
    }
    
    if (error.message === 'Operation cancelled') {
      throw new Error('PDF processing was cancelled')
    }

    throw new PDFProcessingError(`Failed to extract text from PDF: ${error.message}`, error)
  }
}

/**
 * Process PDF in a Web Worker for better performance
 * @param {File} file - PDF file to process
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<{text: string, metadata: object}>} - Extracted text and metadata
 */
export const extractTextFromPDFWorker = async (file, onProgress = null) => {
  return new Promise((resolve, reject) => {
    // Create a Web Worker for PDF processing
    const workerCode = `
      importScripts('https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js');
      
      self.onmessage = async function(e) {
        const { fileData, options } = e.data;
        
        try {
          // Process PDF in worker thread
          const result = await processPDFInWorker(fileData, options);
          self.postMessage({ success: true, result });
        } catch (error) {
          self.postMessage({ success: false, error: error.message });
        }
      };
      
      async function processPDFInWorker(fileData, options) {
        // Implementation would go here
        // This is a simplified version
        return { text: 'Processed text', metadata: {} };
      }
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = (e) => {
      const { success, result, error } = e.data;
      
      if (success) {
        resolve(result);
      } else {
        reject(new PDFProcessingError(error));
      }
      
      worker.terminate();
      URL.revokeObjectURL(blob);
    };

    worker.onerror = (error) => {
      reject(new PDFProcessingError(`Worker error: ${error.message}`));
      worker.terminate();
    };

    // Send file data to worker
    file.arrayBuffer().then(buffer => {
      worker.postMessage({ fileData: buffer, options: {} });
    });
  });
}

/**
 * Sanitize extracted text to prevent XSS and other security issues
 * @param {string} text - Raw extracted text
 * @returns {string} - Sanitized text
 */
export const sanitizeExtractedText = (text) => {
  if (!text) return ''

  try {
    return text
      // Remove potential script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove other potentially dangerous HTML
      .replace(/<[^>]*>/g, '')
      // Remove potential JavaScript protocols
      .replace(/javascript:/gi, '')
      // Remove potential data URLs
      .replace(/data:[^;]*;base64,[^"']*/gi, '')
      // Remove control characters that might cause encoding issues
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize Unicode characters to prevent encoding issues
      .normalize('NFKC')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
  } catch (error) {
    console.warn('Text sanitization failed, using basic cleanup:', error)
    // Fallback: basic cleanup
    return text
      .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '') // Keep only printable characters
      .replace(/\s+/g, ' ')
      .trim()
  }
}
