import { useState, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import {
  cleanPDFText,
  extractPDFMetadata,
  formatTextForDisplay,
} from '../../utils'

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const PDFUpload = () => {
  const [extractedText, setExtractedText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [metadata, setMetadata] = useState(null)
  const fileInputRef = useRef(null)

  const extractTextFromPDF = async file => {
    try {
      setIsLoading(true)
      setError('')
      setExtractedText('')

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

      let fullText = ''

      // Extract text from all pages
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map(item => item.str).join(' ')
        fullText += `Page ${pageNum}:\n${pageText}\n\n`
      }

      const cleanedText = cleanPDFText(fullText)
      const formattedText = formatTextForDisplay(cleanedText)
      const textMetadata = extractPDFMetadata(formattedText)

      setExtractedText(formattedText)
      setMetadata(textMetadata)
      setFileName(file.name)
    } catch (err) {
      console.error('Error extracting PDF text:', err)
      setError(
        'Failed to extract text from PDF. Please ensure the file is a valid PDF.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = file => {
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Please select a valid PDF file.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      setError('File size must be less than 10MB.')
      return
    }

    extractTextFromPDF(file)
  }

  const handleFileChange = event => {
    const file = event.target.files[0]
    handleFileSelect(file)
  }

  const handleDrop = event => {
    event.preventDefault()
    setIsDragOver(false)

    const file = event.dataTransfer.files[0]
    handleFileSelect(file)
  }

  const handleDragOver = event => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = event => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const clearContent = () => {
    setExtractedText('')
    setFileName('')
    setError('')
    setMetadata(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className='w-full max-w-4xl mx-auto p-6'>
      <div className='bg-white rounded-lg shadow-lg overflow-hidden'>
        {/* Header */}
        <div className='bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4'>
          <h2 className='text-xl font-semibold text-white flex items-center'>
            <svg
              className='w-6 h-6 mr-2'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
              />
            </svg>
            PDF Text Extractor
          </h2>
          <p className='text-blue-100 text-sm mt-1'>
            Upload a PDF file to extract and view its text content
          </p>
        </div>

        {/* Upload Area */}
        <div className='p-6'>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
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
              type='file'
              accept='.pdf'
              onChange={handleFileChange}
              className='hidden'
            />

            <div className='flex flex-col items-center'>
              <svg
                className={`w-12 h-12 mb-4 transition-colors ${
                  isDragOver ? 'text-blue-500' : 'text-gray-400'
                }`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                />
              </svg>

              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                {isDragOver ? 'Drop your PDF here' : 'Upload PDF File'}
              </h3>

              <p className='text-gray-500 mb-4'>
                Drag and drop your PDF file here, or click to browse
              </p>

              <button
                type='button'
                className='bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200'
              >
                Choose File
              </button>

              <p className='text-xs text-gray-400 mt-2'>
                Maximum file size: 10MB
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded-md'>
              <div className='flex'>
                <svg
                  className='w-5 h-5 text-red-400 mr-2 mt-0.5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                <p className='text-red-700 text-sm'>{error}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className='mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md'>
              <div className='flex items-center'>
                <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3'></div>
                <p className='text-blue-700 text-sm'>
                  Extracting text from PDF...
                </p>
              </div>
            </div>
          )}

          {/* File Info */}
          {fileName && !isLoading && (
            <div className='mt-4 p-4 bg-green-50 border border-green-200 rounded-md'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                  <svg
                    className='w-5 h-5 text-green-500 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  <p className='text-green-700 text-sm font-medium'>
                    {fileName}
                  </p>
                </div>
                <button
                  onClick={clearContent}
                  className='text-green-600 hover:text-green-800 text-sm font-medium'
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Document Metadata */}
        {metadata && (
          <div className='border-t border-gray-200'>
            <div className='px-6 py-4 bg-blue-50'>
              <h3 className='text-lg font-medium text-gray-900 mb-3'>
                Document Statistics
              </h3>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='bg-white rounded-lg p-3 text-center'>
                  <div className='text-2xl font-bold text-blue-600'>
                    {metadata.wordCount.toLocaleString()}
                  </div>
                  <div className='text-sm text-gray-600'>Words</div>
                </div>
                <div className='bg-white rounded-lg p-3 text-center'>
                  <div className='text-2xl font-bold text-green-600'>
                    {metadata.characterCount.toLocaleString()}
                  </div>
                  <div className='text-sm text-gray-600'>Characters</div>
                </div>
                <div className='bg-white rounded-lg p-3 text-center'>
                  <div className='text-2xl font-bold text-purple-600'>
                    {metadata.lineCount.toLocaleString()}
                  </div>
                  <div className='text-sm text-gray-600'>Lines</div>
                </div>
                <div className='bg-white rounded-lg p-3 text-center'>
                  <div className='text-2xl font-bold text-orange-600'>
                    {metadata.estimatedReadingTime}
                  </div>
                  <div className='text-sm text-gray-600'>Min Read</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Extracted Text Display */}
        {extractedText && (
          <div className='border-t border-gray-200'>
            <div className='px-6 py-4 bg-gray-50'>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                Extracted Text
              </h3>
              <div className='bg-white border border-gray-200 rounded-md p-4 max-h-96 overflow-y-auto'>
                <pre className='whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed'>
                  {extractedText}
                </pre>
              </div>
              <div className='mt-3 flex justify-between items-center'>
                <div className='text-sm text-gray-500'>
                  {metadata &&
                    `${metadata.wordCount} words • ${metadata.characterCount} characters`}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(extractedText)}
                  className='bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors duration-200'
                >
                  Copy Text
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PDFUpload
