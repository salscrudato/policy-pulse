import { useState, useCallback, useMemo, memo } from 'react'
import { SUMMARY_LENGTHS } from '../../services/documentSummarizerService'
import {
  FiFileText,
  FiEdit3,
  FiCopy,
  FiDownload,
  FiBook,
  FiCheck
} from 'react-icons/fi'

const DocumentSummary = memo(({
  summary,
  summaryLength,
  documentType,
  wordCount,
  model,
  isDemo,
  onRegenerateWithLength
}) => {
  const [copyStatus, setCopyStatus] = useState('idle') // idle, copying, copied

  // Memoize current configuration
  const currentConfig = useMemo(() =>
    SUMMARY_LENGTHS[summaryLength] || SUMMARY_LENGTHS.MEDIUM,
    [summaryLength]
  )

  // Memoize formatted timestamp
  const formattedTimestamp = useMemo(() =>
    new Date().toLocaleString(),
    []
  )

  // Optimized copy function with feedback
  const handleCopy = useCallback(async () => {
    if (copyStatus === 'copying') return

    setCopyStatus('copying')

    try {
      await navigator.clipboard.writeText(summary)
      setCopyStatus('copied')

      // Reset status after 2 seconds
      setTimeout(() => setCopyStatus('idle'), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
      setCopyStatus('idle')

      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea')
        textArea.value = summary
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        setCopyStatus('copied')
        setTimeout(() => setCopyStatus('idle'), 2000)
      } catch (fallbackError) {
        console.error('Fallback copy also failed:', fallbackError)
      }
    }
  }, [summary, copyStatus])

  // Optimized print function
  const handlePrint = useCallback(() => {
    const printContent = `
      <html>
        <head>
          <title>Document Summary - ${documentType}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .summary { white-space: pre-wrap; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Document Summary</h1>
            <p><strong>Type:</strong> ${documentType} • <strong>Length:</strong> ${currentConfig.name} • <strong>Words:</strong> ${wordCount}</p>
            ${isDemo ? '<p><em>Generated in Demo Mode</em></p>' : ''}
          </div>
          <div class="summary">${summary}</div>
          <div class="footer">
            <p>Generated on ${formattedTimestamp} using ${model}</p>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }, [summary, documentType, currentConfig.name, wordCount, isDemo, formattedTimestamp, model])

  // Memoize summary length options
  const summaryLengthOptions = useMemo(() =>
    Object.entries(SUMMARY_LENGTHS).map(([key, config]) => {
      const IconComponent = config.icon === 'FiEdit3' ? FiEdit3 :
                           config.icon === 'FiFileText' ? FiFileText : FiBook;
      return { key, config, IconComponent }
    }),
    []
  )

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Document Summary</h2>
            <p className="text-gray-600 mt-1">
              {documentType} • {wordCount} words
              {isDemo && <span className="text-yellow-600 ml-2">• Demo Mode</span>}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
              {currentConfig.name}
            </div>
            {isDemo && (
              <div className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                Demo
              </div>
            )}
          </div>
        </div>

        {/* Summary Length Options */}
        <div className="flex space-x-3">
          {summaryLengthOptions.map(({ key, config, IconComponent }) => (
            <button
              key={key}
              onClick={() => onRegenerateWithLength && onRegenerateWithLength(key)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                summaryLength === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <IconComponent className="mr-2 w-4 h-4" />
              {config.name}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Content */}
      <div className="px-8 py-6">
        <div className="prose prose-lg max-w-none">
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {summary}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Generated {formattedTimestamp}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleCopy}
              disabled={copyStatus === 'copying'}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
                copyStatus === 'copied'
                  ? 'text-green-700 bg-green-50 border-green-300'
                  : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
              } ${copyStatus === 'copying' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {copyStatus === 'copied' ? (
                <>
                  <FiCheck className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <FiCopy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiDownload className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

// Add display name for debugging
DocumentSummary.displayName = 'DocumentSummary'

export default DocumentSummary
