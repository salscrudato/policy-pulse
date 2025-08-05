/**
 * PDF utility functions for text processing and formatting
 */

/**
 * Cleans and formats extracted PDF text
 * @param {string} text - Raw extracted text from PDF
 * @returns {string} - Cleaned and formatted text
 */
export const cleanPDFText = text => {
  if (!text) return ''

  return (
    text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove page breaks and form feeds
      .replace(/[\f\r]/g, '')
      // Clean up line breaks
      .replace(/\n\s*\n/g, '\n\n')
      // Trim whitespace
      .trim()
  )
}

/**
 * Extracts metadata from PDF text (simple heuristics)
 * @param {string} text - PDF text content
 * @returns {object} - Extracted metadata
 */
export const extractPDFMetadata = text => {
  const lines = text.split('\n').filter(line => line.trim())

  return {
    wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
    characterCount: text.length,
    lineCount: lines.length,
    estimatedReadingTime: Math.ceil(text.split(/\s+/).length / 200), // ~200 words per minute
    firstLine: lines[0] || '',
    lastLine: lines[lines.length - 1] || '',
  }
}

/**
 * Searches for specific patterns in PDF text
 * @param {string} text - PDF text content
 * @param {string} searchTerm - Term to search for
 * @param {boolean} caseSensitive - Whether search should be case sensitive
 * @returns {array} - Array of matches with context
 */
export const searchInPDFText = (text, searchTerm, caseSensitive = false) => {
  if (!text || !searchTerm) return []

  const searchText = caseSensitive ? text : text.toLowerCase()
  const searchPattern = caseSensitive ? searchTerm : searchTerm.toLowerCase()
  const matches = []

  let index = 0
  while ((index = searchText.indexOf(searchPattern, index)) !== -1) {
    const start = Math.max(0, index - 50)
    const end = Math.min(text.length, index + searchPattern.length + 50)
    const context = text.substring(start, end)

    matches.push({
      index,
      context: context.trim(),
      beforeMatch: text.substring(start, index),
      match: text.substring(index, index + searchPattern.length),
      afterMatch: text.substring(index + searchPattern.length, end),
    })

    index += searchPattern.length
  }

  return matches
}

/**
 * Splits PDF text into pages based on page markers
 * @param {string} text - PDF text content with page markers
 * @returns {array} - Array of page objects
 */
export const splitTextIntoPages = text => {
  if (!text) return []

  const pagePattern = /Page (\d+):\s*/g
  const pages = []
  let lastIndex = 0
  let match

  while ((match = pagePattern.exec(text)) !== null) {
    if (lastIndex > 0) {
      // Add previous page
      const pageContent = text.substring(lastIndex, match.index).trim()
      if (pageContent) {
        pages.push({
          pageNumber: pages.length + 1,
          content: pageContent,
          wordCount: pageContent.split(/\s+/).length,
        })
      }
    }
    lastIndex = match.index + match[0].length
  }

  // Add the last page
  if (lastIndex < text.length) {
    const pageContent = text.substring(lastIndex).trim()
    if (pageContent) {
      pages.push({
        pageNumber: pages.length + 1,
        content: pageContent,
        wordCount: pageContent.split(/\s+/).length,
      })
    }
  }

  return pages
}

/**
 * Formats text for better readability
 * @param {string} text - Text to format
 * @returns {string} - Formatted text
 */
export const formatTextForDisplay = text => {
  if (!text) return ''

  return (
    text
      // Add proper spacing after periods
      .replace(/\.([A-Z])/g, '. $1')
      // Fix common OCR issues
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Clean up multiple spaces
      .replace(/\s{2,}/g, ' ')
      // Ensure proper paragraph breaks
      .replace(/\n\s*\n/g, '\n\n')
      .trim()
  )
}
