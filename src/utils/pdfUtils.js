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
 * Enhanced metadata extraction for insurance documents
 * @param {string} text - PDF text content
 * @returns {object} - Comprehensive metadata including insurance-specific data
 */
export const extractPDFMetadata = text => {
  const lines = text.split('\n').filter(line => line.trim())
  const lowerText = text.toLowerCase()

  // Extract insurance-specific metadata
  const insuranceMetadata = extractInsuranceMetadata(text)

  return {
    wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
    characterCount: text.length,
    lineCount: lines.length,
    estimatedReadingTime: Math.ceil(text.split(/\s+/).length / 200), // ~200 words per minute
    firstLine: lines[0] || '',
    lastLine: lines[lines.length - 1] || '',

    // Insurance-specific metadata
    ...insuranceMetadata,

    // Document structure analysis
    hasTabularData: detectTabularData(text),
    hasCurrencyAmounts: /\$[\d,]+(?:\.\d{2})?/.test(text),
    hasPercentages: /\d+(?:\.\d+)?%/.test(text),
    hasDates: /\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4}/.test(text),

    // Content complexity indicators
    complexityScore: calculateComplexityScore(text)
  }
}

/**
 * Extracts insurance-specific metadata from document text
 * @param {string} text - Document text
 * @returns {object} - Insurance metadata
 */
const extractInsuranceMetadata = text => {
  const lowerText = text.toLowerCase()

  // Policy identification patterns
  const policyNumberMatch = text.match(/policy\s*(?:number|no\.?|#)?\s*:?\s*([A-Z0-9-]+)/i)
  const effectiveDateMatch = text.match(/effective\s*date\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i)
  const expirationDateMatch = text.match(/expir(?:ation|y)\s*date\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i)

  // Coverage indicators
  const coverageTypes = [
    'general liability', 'auto liability', 'property', 'workers compensation',
    'umbrella', 'professional liability', 'cyber', 'employment practices'
  ]

  const detectedCoverages = coverageTypes.filter(coverage =>
    lowerText.includes(coverage)
  )

  // Financial data detection
  const currencyAmounts = text.match(/\$[\d,]+(?:\.\d{2})?/g) || []
  const limits = text.match(/limit[s]?\s*:?\s*\$[\d,]+/gi) || []
  const deductibles = text.match(/deductible[s]?\s*:?\s*\$[\d,]+/gi) || []

  return {
    policyNumber: policyNumberMatch ? policyNumberMatch[1] : null,
    effectiveDate: effectiveDateMatch ? effectiveDateMatch[1] : null,
    expirationDate: expirationDateMatch ? expirationDateMatch[1] : null,
    detectedCoverages,
    financialDataCount: currencyAmounts.length,
    limitsCount: limits.length,
    deductiblesCount: deductibles.length,
    hasEndorsements: lowerText.includes('endorsement') || lowerText.includes('amendment'),
    hasExclusions: lowerText.includes('exclusion') || lowerText.includes('excluded'),
    documentDensity: calculateDocumentDensity(text)
  }
}

/**
 * Detects if document contains tabular data
 * @param {string} text - Document text
 * @returns {boolean} - True if tabular data is detected
 */
const detectTabularData = text => {
  const lines = text.split('\n')
  let tabularLines = 0

  lines.forEach(line => {
    // Check for multiple currency amounts or numbers in a line
    const currencyMatches = (line.match(/\$[\d,]+(?:\.\d{2})?/g) || []).length
    const numberMatches = (line.match(/\b\d+(?:,\d{3})*(?:\.\d{2})?\b/g) || []).length

    if (currencyMatches >= 2 || numberMatches >= 3) {
      tabularLines++
    }
  })

  return tabularLines >= 3 // At least 3 lines with tabular data
}

/**
 * Calculates document complexity score
 * @param {string} text - Document text
 * @returns {number} - Complexity score (0-1)
 */
const calculateComplexityScore = text => {
  const factors = {
    length: Math.min(text.length / 50000, 1), // Normalize by 50k characters
    uniqueWords: new Set(text.toLowerCase().match(/\b\w+\b/g) || []).size / 1000,
    sentences: (text.match(/[.!?]+/g) || []).length / 100,
    technicalTerms: (text.match(/\b(?:aggregate|occurrence|deductible|exclusion|endorsement|liability|coverage)\b/gi) || []).length / 50
  }

  return Math.min(
    (factors.length + factors.uniqueWords + factors.sentences + factors.technicalTerms) / 4,
    1
  )
}

/**
 * Calculates document information density
 * @param {string} text - Document text
 * @returns {number} - Density score
 */
const calculateDocumentDensity = text => {
  const totalWords = text.split(/\s+/).length
  const informativeWords = (text.match(/\b(?:coverage|limit|deductible|premium|exclusion|condition|endorsement)\b/gi) || []).length

  return totalWords > 0 ? informativeWords / totalWords : 0
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
 * Enhanced text formatting for insurance documents
 * @param {string} text - Text to format
 * @returns {string} - Formatted text optimized for insurance analysis
 */
export const formatTextForDisplay = text => {
  if (!text) return ''

  return (
    text
      // Preserve insurance form numbers and policy numbers
      .replace(/\b([A-Z]{2,}\s*\d{2,}[-\s]*\d*)\b/g, ' $1 ')
      // Add proper spacing after periods
      .replace(/\.([A-Z])/g, '. $1')
      // Fix common OCR issues while preserving insurance terminology
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Preserve currency formatting
      .replace(/\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g, '$$$1')
      // Clean up multiple spaces
      .replace(/\s{2,}/g, ' ')
      // Ensure proper paragraph breaks
      .replace(/\n\s*\n/g, '\n\n')
      // Preserve section headers
      .replace(/^([A-Z\s]{3,}):?\s*$/gm, '\n$1\n')
      .trim()
  )
}

/**
 * Extracts structured coverage information from formatted text
 * @param {string} text - Formatted insurance document text
 * @returns {object} - Structured coverage data
 */
export const extractCoverageStructure = text => {
  const structure = {
    sections: [],
    coverages: [],
    limits: [],
    deductibles: [],
    exclusions: [],
    endorsements: []
  }

  // Extract sections based on common insurance document patterns
  const sectionPatterns = [
    /^(COVERAGE[S]?\s*[A-Z\s]*):?\s*$/gim,
    /^(LIMIT[S]?\s*[A-Z\s]*):?\s*$/gim,
    /^(DEDUCTIBLE[S]?\s*[A-Z\s]*):?\s*$/gim,
    /^(EXCLUSION[S]?\s*[A-Z\s]*):?\s*$/gim,
    /^(CONDITION[S]?\s*[A-Z\s]*):?\s*$/gim,
    /^(ENDORSEMENT[S]?\s*[A-Z\s]*):?\s*$/gim
  ]

  sectionPatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)]
    matches.forEach(match => {
      structure.sections.push({
        title: match[1].trim(),
        position: match.index,
        type: categorizeSection(match[1])
      })
    })
  })

  // Extract coverage items
  structure.coverages = extractCoverageItems(text)
  structure.limits = extractLimits(text)
  structure.deductibles = extractDeductibles(text)
  structure.exclusions = extractExclusions(text)
  structure.endorsements = extractEndorsements(text)

  return structure
}

/**
 * Categorizes section type based on title
 * @param {string} title - Section title
 * @returns {string} - Section category
 */
const categorizeSection = title => {
  const lowerTitle = title.toLowerCase()
  if (lowerTitle.includes('coverage')) return 'coverage'
  if (lowerTitle.includes('limit')) return 'limit'
  if (lowerTitle.includes('deductible')) return 'deductible'
  if (lowerTitle.includes('exclusion')) return 'exclusion'
  if (lowerTitle.includes('condition')) return 'condition'
  if (lowerTitle.includes('endorsement')) return 'endorsement'
  return 'general'
}

/**
 * Extracts coverage items from text
 * @param {string} text - Document text
 * @returns {array} - Array of coverage objects
 */
const extractCoverageItems = text => {
  const coverages = []

  // Common coverage patterns
  const patterns = [
    /(?:^|\n)\s*([A-Z][^:\n]*(?:LIABILITY|COVERAGE|PROTECTION|INSURANCE)[^:\n]*):?\s*([^\n]*)/gim,
    /(?:^|\n)\s*([A-Z][^:\n]*(?:BODILY INJURY|PROPERTY DAMAGE|MEDICAL|COLLISION|COMPREHENSIVE)[^:\n]*):?\s*([^\n]*)/gim
  ]

  patterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)]
    matches.forEach(match => {
      coverages.push({
        name: match[1].trim(),
        description: match[2].trim(),
        position: match.index
      })
    })
  })

  return coverages
}

/**
 * Extracts limit information from text
 * @param {string} text - Document text
 * @returns {array} - Array of limit objects
 */
const extractLimits = text => {
  const limits = []
  const limitPattern = /([^:\n]*(?:limit|aggregate|occurrence)[^:\n]*):?\s*\$?([\d,]+(?:\.\d{2})?)/gim

  const matches = [...text.matchAll(limitPattern)]
  matches.forEach(match => {
    limits.push({
      type: match[1].trim(),
      amount: match[2].replace(/,/g, ''),
      formatted: `$${match[2]}`,
      position: match.index
    })
  })

  return limits
}

/**
 * Extracts deductible information from text
 * @param {string} text - Document text
 * @returns {array} - Array of deductible objects
 */
const extractDeductibles = text => {
  const deductibles = []
  const deductiblePattern = /([^:\n]*deductible[^:\n]*):?\s*\$?([\d,]+(?:\.\d{2})?)/gim

  const matches = [...text.matchAll(deductiblePattern)]
  matches.forEach(match => {
    deductibles.push({
      type: match[1].trim(),
      amount: match[2].replace(/,/g, ''),
      formatted: `$${match[2]}`,
      position: match.index
    })
  })

  return deductibles
}

/**
 * Extracts exclusion information from text
 * @param {string} text - Document text
 * @returns {array} - Array of exclusion objects
 */
const extractExclusions = text => {
  const exclusions = []
  const exclusionPattern = /(?:^|\n)\s*([^:\n]*(?:exclusion|excluded|does not cover)[^:\n]*):?\s*([^\n]*)/gim

  const matches = [...text.matchAll(exclusionPattern)]
  matches.forEach(match => {
    exclusions.push({
      title: match[1].trim(),
      description: match[2].trim(),
      position: match.index
    })
  })

  return exclusions
}

/**
 * Extracts endorsement information from text
 * @param {string} text - Document text
 * @returns {array} - Array of endorsement objects
 */
const extractEndorsements = text => {
  const endorsements = []
  const endorsementPattern = /(?:^|\n)\s*([^:\n]*(?:endorsement|amendment|rider)[^:\n]*):?\s*([^\n]*)/gim

  const matches = [...text.matchAll(endorsementPattern)]
  matches.forEach(match => {
    endorsements.push({
      title: match[1].trim(),
      description: match[2].trim(),
      position: match.index
    })
  })

  return endorsements
}
