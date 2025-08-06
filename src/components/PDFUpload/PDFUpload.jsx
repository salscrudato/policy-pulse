import { useState, useRef } from 'react'
import { SUMMARY_LENGTHS } from '../../services/documentSummarizerService'
import { FiUpload, FiFile, FiEdit3, FiFileText, FiBook, FiRotateCw, FiX, FiAlertCircle } from 'react-icons/fi'
import DocumentSummary from '../DocumentSummary/DocumentSummary'
import usePDFProcessor from '../../hooks/usePDFProcessor'
import { validateFileUpload, uploadRateLimiter } from '../../utils/security'
import { useResponsive, getResponsiveContainer, getResponsiveGrid } from '../../utils/responsive'

const PDFUpload = () => {
  const [selectedSummaryLength, setSelectedSummaryLength] = useState('MEDIUM')
  const [isDragOver, setIsDragOver] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])
  const fileInputRef = useRef(null)

  // Responsive utilities
  const { isMobile, isTablet, deviceType } = useResponsive()

  // Use the enhanced PDF processor hook
  const {
    file,
    isProcessing,
    progress,
    error,
    summaryResult,
    processFile,
    regenerateSummary,
    cancelProcessing,
    reset,
    hasResult,
    canRegenerate,
  } = usePDFProcessor()

  // Enhanced file validation with security checks
  const validateAndProcessFile = async (uploadedFile) => {
    setValidationErrors([])

    // Rate limiting check
    const clientId = 'anonymous' // In a real app, this would be user ID or IP
    if (!uploadRateLimiter.isAllowed(clientId)) {
      const timeUntilReset = uploadRateLimiter.getTimeUntilReset(clientId)
      const minutesUntilReset = Math.ceil(timeUntilReset / 60000)
      setValidationErrors([`Upload rate limit exceeded. Please wait ${minutesUntilReset} minute(s) before trying again.`])
      return
    }

    // Enhanced file validation
    const validation = validateFileUpload(uploadedFile)

    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }

    if (validation.warnings.length > 0) {
      setValidationErrors(validation.warnings)
      // Continue processing despite warnings
    }

    // Process the file using the hook
    await processFile(uploadedFile, selectedSummaryLength)
  }

  // Regenerate summary with different length
  const regenerateWithLength = async (newLength) => {
    setSelectedSummaryLength(newLength)
    await regenerateSummary(newLength)
  }

  // Handle file selection
  const handleFileSelect = (selectedFile) => {
    validateAndProcessFile(selectedFile)
  }

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const resetUpload = () => {
    reset()
    setSelectedSummaryLength('MEDIUM')
    setValidationErrors([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 sm:py-8 lg:py-12 px-4">
      <div className={getResponsiveContainer('lg')}>
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            PDF Summarizer
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 px-4">
            AI-powered document summarization in seconds
          </p>

          {!import.meta.env.VITE_OPENAI_API_KEY && (
            <div className="mt-4 inline-flex items-center px-3 sm:px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg max-w-full">
              <span className="text-yellow-800 text-xs sm:text-sm font-medium text-center">
                🚀 Demo Mode - Add your OpenAI API key for full functionality
              </span>
            </div>
          )}
        </div>

        {!hasResult ? (
          <div className="space-y-6 sm:space-y-8">
            {/* Summary Length Selection */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">
                Choose Summary Length
              </h2>
              <div className={getResponsiveGrid({ base: 1, sm: 2, md: 3 }) + ' gap-4 sm:gap-6'}>
                {Object.entries(SUMMARY_LENGTHS).map(([key, config]) => {
                  const IconComponent = config.icon === 'FiEdit3' ? FiEdit3 : 
                                     config.icon === 'FiFileText' ? FiFileText : FiBook;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedSummaryLength(key)}
                      className={`p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 transition-all ${
                        selectedSummaryLength === key
                          ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex justify-center mb-3 sm:mb-4">
                        <IconComponent className="w-6 h-6 sm:w-8 sm:h-8" />
                      </div>
                      <div className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">
                        {config.name}
                      </div>
                      <div className="text-xs sm:text-sm opacity-75 leading-relaxed">
                        {config.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upload Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={handleClick}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {isProcessing ? (
                  <div className="space-y-4">
                    <FiRotateCw className="w-12 h-12 text-blue-600 mx-auto animate-spin" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Processing PDF...</h3>
                      <p className="text-gray-600 mt-2">Extracting text and generating summary</p>

                      {/* Progress bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Cancel button */}
                      <button
                        onClick={cancelProcessing}
                        className="mt-4 inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <FiX className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <FiUpload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Upload your PDF</h3>
                      <p className="text-gray-600 mt-2">
                        Drag and drop your PDF file here, or click to browse
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Maximum file size: 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced error and validation display */}
              {(error || validationErrors.length > 0) && (
                <div className="mt-6 space-y-4">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start">
                        <FiAlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                        <p className="text-red-700">{error}</p>
                      </div>
                    </div>
                  )}

                  {validationErrors.length > 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start">
                        <FiAlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-yellow-800 mb-2">File Validation Issues:</h4>
                          <ul className="text-yellow-700 text-sm space-y-1">
                            {validationErrors.map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {error.includes('Rate limit') && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">💡 Tips to avoid rate limits:</h4>
                      <ul className="text-blue-800 text-sm space-y-1">
                        <li>• Try using "Short" summary length to reduce token usage</li>
                        <li>• Wait a few minutes before trying again</li>
                        <li>• Upload smaller PDF files when possible</li>
                        <li>• Consider upgrading your OpenAI plan for higher limits</li>
                      </ul>
                    </div>
                  )}

                  {error.includes('API key') && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">🔑 How to add your OpenAI API key:</h4>
                      <ol className="text-green-800 text-sm space-y-1">
                        <li>1. Get an API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a></li>
                        <li>2. Create a <code className="bg-green-100 px-1 rounded">.env.local</code> file in your project root</li>
                        <li>3. Add: <code className="bg-green-100 px-1 rounded">VITE_OPENAI_API_KEY=your_key_here</code></li>
                        <li>4. Restart the development server</li>
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary Result */}
            <DocumentSummary
              summary={summaryResult.summary}
              summaryLength={summaryResult.summaryLength}
              documentType={summaryResult.documentType}
              wordCount={summaryResult.wordCount}
              model={summaryResult.model}
              isDemo={summaryResult.isDemo}
              onRegenerateWithLength={regenerateWithLength}
            />

            {/* Reset Button */}
            <div className="text-center">
              <button
                onClick={resetUpload}
                className="inline-flex items-center px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiFile className="w-4 h-4 mr-2" />
                Upload Another PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PDFUpload
