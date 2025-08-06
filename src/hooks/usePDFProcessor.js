/**
 * Custom hook for PDF processing with enhanced error handling and performance
 */

import { useState, useCallback, useRef } from 'react'
import { extractTextFromPDF, validatePDFFile, sanitizeExtractedText } from '../utils/enhancedPdfProcessor'
import { generateDocumentSummary } from '../services/documentSummarizerService'
import { formatErrorForUser, logError } from '../utils/errorHandling'

export const usePDFProcessor = () => {
  const [state, setState] = useState({
    file: null,
    isProcessing: false,
    progress: 0,
    error: null,
    summaryResult: null,
    extractedText: null,
    metadata: null,
  })

  const abortControllerRef = useRef(null)

  /**
   * Reset the processor state
   */
  const reset = useCallback(() => {
    // Cancel any ongoing operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setState({
      file: null,
      isProcessing: false,
      progress: 0,
      error: null,
      summaryResult: null,
      extractedText: null,
      metadata: null,
    })
  }, [])

  /**
   * Update progress during processing
   */
  const updateProgress = useCallback((current, total) => {
    const progressPercent = Math.round((current / total) * 100)
    setState(prev => ({ ...prev, progress: progressPercent }))
  }, [])

  /**
   * Validate and process a PDF file
   */
  const processFile = useCallback(async (file, summaryLength = 'MEDIUM') => {
    if (!file) {
      setState(prev => ({ ...prev, error: 'No file provided' }))
      return
    }

    // Create new abort controller for this operation
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    setState(prev => ({
      ...prev,
      file,
      isProcessing: true,
      progress: 0,
      error: null,
      summaryResult: null,
      extractedText: null,
      metadata: null,
    }))

    try {
      // Step 1: Validate file (5% progress)
      setState(prev => ({ ...prev, progress: 5 }))
      await validatePDFFile(file)

      if (signal.aborted) return

      // Step 2: Extract text (5% - 70% progress)
      setState(prev => ({ ...prev, progress: 10 }))
      
      const extractionResult = await extractTextFromPDF(
        file,
        (currentPage, totalPages) => {
          const extractionProgress = 10 + Math.round((currentPage / totalPages) * 60)
          setState(prev => ({ ...prev, progress: extractionProgress }))
        },
        signal
      )

      if (signal.aborted) return

      // Step 3: Sanitize text (75% progress)
      setState(prev => ({ ...prev, progress: 75 }))
      const sanitizedText = sanitizeExtractedText(extractionResult.text)

      if (!sanitizedText.trim()) {
        throw new Error('No readable text found in the PDF document')
      }

      setState(prev => ({
        ...prev,
        extractedText: sanitizedText,
        metadata: extractionResult.metadata,
        progress: 80,
      }))

      if (signal.aborted) return

      // Step 4: Generate summary (80% - 100% progress)
      setState(prev => ({ ...prev, progress: 85 }))
      
      const summaryResult = await generateDocumentSummary(sanitizedText, summaryLength)

      if (signal.aborted) return

      setState(prev => ({
        ...prev,
        summaryResult,
        progress: 100,
        isProcessing: false,
      }))

    } catch (error) {
      if (signal.aborted) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          progress: 0,
        }))
        return
      }

      const userFriendlyError = formatErrorForUser(error)
      
      // Log error for debugging
      logError(error, {
        fileName: file.name,
        fileSize: file.size,
        summaryLength,
        operation: 'PDF Processing',
      })

      setState(prev => ({
        ...prev,
        error: userFriendlyError,
        isProcessing: false,
        progress: 0,
      }))
    }
  }, [])

  /**
   * Regenerate summary with different length
   */
  const regenerateSummary = useCallback(async (newLength) => {
    if (!state.extractedText) {
      setState(prev => ({ ...prev, error: 'No extracted text available for regeneration' }))
      return
    }

    setState(prev => ({
      ...prev,
      isProcessing: true,
      progress: 80,
      error: null,
    }))

    try {
      const summaryResult = await generateDocumentSummary(state.extractedText, newLength)

      setState(prev => ({
        ...prev,
        summaryResult,
        progress: 100,
        isProcessing: false,
      }))

    } catch (error) {
      const userFriendlyError = formatErrorForUser(error)
      
      logError(error, {
        summaryLength: newLength,
        operation: 'Summary Regeneration',
        textLength: state.extractedText?.length,
      })

      setState(prev => ({
        ...prev,
        error: userFriendlyError,
        isProcessing: false,
        progress: 0,
      }))
    }
  }, [state.extractedText])

  /**
   * Cancel ongoing processing
   */
  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    setState(prev => ({
      ...prev,
      isProcessing: false,
      progress: 0,
    }))
  }, [])

  /**
   * Retry processing with the same file
   */
  const retryProcessing = useCallback((summaryLength = 'MEDIUM') => {
    if (state.file) {
      processFile(state.file, summaryLength)
    }
  }, [state.file, processFile])

  return {
    // State
    file: state.file,
    isProcessing: state.isProcessing,
    progress: state.progress,
    error: state.error,
    summaryResult: state.summaryResult,
    extractedText: state.extractedText,
    metadata: state.metadata,

    // Actions
    processFile,
    regenerateSummary,
    cancelProcessing,
    retryProcessing,
    reset,

    // Computed values
    hasResult: !!state.summaryResult,
    canRegenerate: !!state.extractedText && !state.isProcessing,
    canRetry: !!state.file && !state.isProcessing,
  }
}

export default usePDFProcessor
