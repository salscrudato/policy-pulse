/**
 * Generic Document Summarizer Service
 * AI-powered PDF document summarization with configurable length options
 */

import {
  AIServiceError,
  withRetry,
  withErrorHandling,
  handleAPIError
} from '../utils/errorHandling'
import { optimizedFetch, requestDeduplicator, rateLimiter } from '../utils/apiCache'

/*********************
 * SUMMARY LENGTH CONFIGURATIONS
 *********************/

export const SUMMARY_LENGTHS = {
  SHORT: {
    name: 'Short',
    description: 'Brief overview (2-3 paragraphs)',
    maxTokens: 300,
    temperature: 0.3,
    icon: 'FiEdit3'
  },
  MEDIUM: {
    name: 'Medium',
    description: 'Detailed summary (4-6 paragraphs)',
    maxTokens: 800,
    temperature: 0.2,
    icon: 'FiFileText'
  },
  LONG: {
    name: 'Long',
    description: 'Comprehensive analysis (8+ paragraphs)',
    maxTokens: 1500,
    temperature: 0.1,
    icon: 'FiBook'
  }
}

/*********************
 * SYSTEM PROMPTS FOR DIFFERENT SUMMARY LENGTHS
 *********************/

const SYSTEM_PROMPTS = {
  SHORT: `You are an expert document analyst. Create a concise summary of the provided document.

Requirements:
- Write 2-3 well-structured paragraphs
- Focus on the main purpose, key points, and conclusions
- Use clear, professional language
- Highlight the most important information
- Keep it brief but informative

Format your response as clean, readable text without special formatting.`,

  MEDIUM: `You are an expert document analyst. Create a detailed summary of the provided document.

Requirements:
- Write 4-6 well-structured paragraphs
- Include main topics, key details, and supporting information
- Organize content logically with smooth transitions
- Provide context and background where relevant
- Include important data, findings, or recommendations
- Use professional, accessible language

Format your response as clean, readable text without special formatting.`,

  LONG: `You are an expert document analyst. Create a comprehensive analysis of the provided document.

Requirements:
- Write 8+ well-structured paragraphs
- Provide thorough coverage of all major topics and sections
- Include detailed analysis of key points, data, and findings
- Discuss methodology, context, and implications where applicable
- Cover supporting details, examples, and evidence
- Analyze relationships between different sections
- Include conclusions, recommendations, and next steps if present
- Maintain logical flow and organization throughout

Format your response as clean, readable text without special formatting.`
}

/*********************
 * MODEL SELECTION
 *********************/
const selectModel = (textLength, summaryLength) => {
  // Use more powerful model for longer documents or comprehensive summaries
  if (textLength > 30000 || summaryLength === 'LONG') return 'gpt-4o'
  if (textLength > 15000 || summaryLength === 'MEDIUM') return 'gpt-4o'
  return 'gpt-4o-mini'
}

/*********************
 * DOCUMENT TYPE DETECTION
 *********************/
export function detectDocumentType(text) {
  const lowerText = text.toLowerCase()
  
  const documentTypes = {
    'Academic Paper': /abstract|introduction|methodology|conclusion|references|bibliography/gi,
    'Business Report': /executive summary|quarterly|annual|revenue|profit|loss|financial/gi,
    'Legal Document': /whereas|hereby|agreement|contract|terms|conditions|legal/gi,
    'Technical Manual': /installation|configuration|troubleshooting|specifications|manual/gi,
    'Research Document': /hypothesis|experiment|data|analysis|findings|research/gi,
    'Policy Document': /policy|procedure|guidelines|standards|compliance/gi,
    'Marketing Material': /product|service|benefits|features|pricing|marketing/gi,
    'Medical Document': /patient|diagnosis|treatment|medical|clinical|health/gi,
    'Financial Document': /financial|budget|investment|accounting|audit|tax/gi,
    'Educational Material': /course|lesson|curriculum|learning|education|training/gi
  }

  let bestMatch = 'General Document'
  let highestScore = 0

  Object.entries(documentTypes).forEach(([type, pattern]) => {
    const matches = (lowerText.match(pattern) || []).length
    if (matches > highestScore) {
      highestScore = matches
      bestMatch = type
    }
  })

  return {
    type: bestMatch,
    confidence: Math.min(highestScore / 5, 1), // Normalize to 0-1
    indicators: highestScore
  }
}

/*********************
 * TEXT PREPROCESSING
 *********************/
export function preprocessDocumentText(text) {
  try {
    return text
      // Remove control characters that might cause encoding issues
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize Unicode characters to prevent encoding issues
      .normalize('NFKC')
      // Clean up excessive whitespace
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      // Remove common PDF artifacts
      .replace(/^Page \d+ of \d+$/gm, '')
      .replace(/^\d+\s*$/gm, '')
      // Preserve important formatting
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2')
      // Clean up headers and footers
      .replace(/^(Header|Footer):\s*/gm, '')
      .trim()
  } catch (error) {
    console.warn('Text preprocessing failed, using basic cleanup:', error)
    // Fallback: basic cleanup
    return text
      .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '') // Keep only printable characters
      .replace(/\s+/g, ' ')
      .trim()
  }
}

/*********************
 * MAIN SUMMARIZATION FUNCTION
 *********************/
export const generateDocumentSummary = withErrorHandling(
  async (text, summaryLength = 'MEDIUM', options = {}) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey) return generateMockSummary(text, summaryLength, options)

    // Validate summary length
    if (!SUMMARY_LENGTHS[summaryLength]) {
      throw new AIServiceError(`Invalid summary length: ${summaryLength}`)
    }

    // Detect document type
    const documentType = detectDocumentType(text)
    
    // Preprocess text
    const processedText = preprocessDocumentText(text)
    
    // Select appropriate model and configuration
    const config = SUMMARY_LENGTHS[summaryLength]
    const model = selectModel(processedText.length, summaryLength)
    const systemPrompt = SYSTEM_PROMPTS[summaryLength]

    // Create request key for deduplication
    const requestKey = `summary_${model}_${summaryLength}_${processedText.slice(0, 100)}`

    const apiCall = async () => {
      // Check rate limit
      await rateLimiter.checkLimit()

      return optimizedFetch.fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Please summarize the following document:\n\n${processedText}` }
          ],
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          top_p: 0.9
        }),
        cache: 'no-cache', // Don't cache POST requests
        timeout: 45000, // 45 second timeout
      })
    }

    // Use request deduplication to prevent duplicate API calls
    const response = await requestDeduplicator.execute(requestKey, () =>
      withRetry(apiCall, {
        maxRetries: 3,
        delay: 1500,
        shouldRetry: e => e.status >= 500 || e.status === 429
      })
    )
    
    if (!response.ok) await handleAPIError(response)

    const data = await response.json()
    const summary = data.choices?.[0]?.message?.content ?? 'No summary generated'

    return {
      summary,
      summaryLength,
      documentType: documentType.type,
      confidence: documentType.confidence,
      wordCount: summary.split(/\s+/).length,
      usage: data.usage,
      model,
      processingTime: Date.now(),
      config
    }
  },
  { context: 'Document Summary Generation', timeout: 45000 }
)

/*********************
 * COST ESTIMATION
 *********************/
export function estimateDocumentSummaryCost(text, summaryLength = 'MEDIUM') {
  if (!text) return { estimatedCost: 0, tokenCount: 0, model: 'none' }

  const config = SUMMARY_LENGTHS[summaryLength]
  const estimatedInputTokens = Math.ceil(text.length / 4)
  const estimatedOutputTokens = config.maxTokens
  const model = selectModel(text.length, summaryLength)
  
  // Pricing (approximate, as of 2025)
  const pricing = {
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-4o': { input: 0.0025, output: 0.01 }
  }

  const inputCost = (estimatedInputTokens / 1000) * pricing[model].input
  const outputCost = (estimatedOutputTokens / 1000) * pricing[model].output
  const totalCost = inputCost + outputCost

  return {
    estimatedCost: Math.round(totalCost * 10000) / 10000,
    tokenCount: estimatedInputTokens + estimatedOutputTokens,
    model,
    summaryLength,
    breakdown: {
      inputTokens: estimatedInputTokens,
      outputTokens: estimatedOutputTokens,
      inputCost: Math.round(inputCost * 10000) / 10000,
      outputCost: Math.round(outputCost * 10000) / 10000
    }
  }
}

/*********************
 * MOCK DATA FOR DEVELOPMENT
 *********************/
function generateMockSummary(text, summaryLength, options = {}) {
  const config = SUMMARY_LENGTHS[summaryLength]
  const documentType = detectDocumentType(text)
  
  const mockSummaries = {
    SHORT: `This document appears to be a ${documentType.type.toLowerCase()} containing key information and analysis. The main focus centers on presenting important concepts and findings in a structured format. Overall, the document provides valuable insights and serves as a comprehensive resource for its intended audience.`,
    
    MEDIUM: `This document is classified as a ${documentType.type.toLowerCase()} that presents detailed information across multiple sections. The content is well-organized and covers various aspects of the subject matter with supporting details and analysis.

The document begins with foundational concepts and progresses through more complex topics, providing readers with a logical flow of information. Key findings and recommendations are highlighted throughout, making it easy to identify the most important points.

The structure includes multiple sections that build upon each other, creating a comprehensive overview of the topic. Supporting data and examples are provided to reinforce the main arguments and conclusions presented in the document.`,
    
    LONG: `This comprehensive document has been identified as a ${documentType.type.toLowerCase()} that provides extensive coverage of its subject matter through multiple detailed sections and thorough analysis.

The document opens with introductory material that establishes the context and scope of the content. This foundation allows readers to understand the purpose and objectives before diving into more complex topics and detailed analysis.

Throughout the middle sections, the document presents core concepts with supporting evidence, data, and examples. The information is structured logically, with each section building upon previous content to create a cohesive narrative that guides readers through the material systematically.

Key findings and insights are distributed throughout the document, with particular emphasis on practical applications and real-world implications. The analysis demonstrates depth and consideration of multiple perspectives on the topics discussed.

The document includes detailed explanations of methodologies, processes, or frameworks relevant to the subject matter. These technical aspects are presented in an accessible manner while maintaining the necessary level of detail for professional use.

Supporting materials such as data tables, charts, or reference materials enhance the main content and provide additional context for readers seeking deeper understanding of specific points.

The concluding sections synthesize the information presented earlier, drawing connections between different concepts and highlighting the most significant takeaways. Recommendations for future action or consideration are provided where appropriate.

Overall, this document serves as a comprehensive resource that balances thoroughness with accessibility, making it valuable for both general readers and subject matter experts seeking detailed information on the topic.`
  }

  return {
    summary: mockSummaries[summaryLength],
    summaryLength,
    documentType: documentType.type,
    confidence: documentType.confidence,
    wordCount: mockSummaries[summaryLength].split(/\s+/).length,
    model: 'demo-mode',
    processingTime: Date.now(),
    config,
    isDemo: true
  }
}
