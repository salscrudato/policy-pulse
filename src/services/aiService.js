/**
 * AI Service for insurance form summarization and claims analysis
 */

// System prompt for form summarization
const FORM_SUMMARY_SYSTEM_PROMPT = `
You are an expert insurance analyst. Summarize this insurance form with the following sections:

**Form Type**: [Type of insurance form]
**Form Name**: [Official name of the form]

**Overview**: 
[Provide a 3-sentence overview of what this form covers]

**Coverages**:
[List all coverages with bold titles, descriptions, and any sub-coverages]

**Conditions**:
[List key conditions and requirements]

**Exclusions**:
[List major exclusions and limitations]

Use clear, professional language and format the response in Markdown. Be concise but comprehensive.
`

/**
 * Generates a structured summary of insurance form content using OpenAI
 * @param {string} text - The extracted text from the PDF
 * @returns {Promise<string>} - The generated summary in markdown format
 */
export async function generateFormSummary(text) {
  try {
    // Check if OpenAI API key is available
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: FORM_SUMMARY_SYSTEM_PROMPT
          },
          { 
            role: 'user', 
            content: `Please analyze and summarize this insurance form:\n\n${text}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.2
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || 'No summary generated'
  } catch (error) {
    console.error('Error generating form summary:', error)
    throw error
  }
}

/**
 * Validates if the text appears to be an insurance form
 * @param {string} text - The text to validate
 * @returns {boolean} - True if it appears to be an insurance form
 */
export function validateInsuranceForm(text) {
  const insuranceKeywords = [
    'insurance', 'policy', 'coverage', 'premium', 'deductible',
    'liability', 'property', 'claim', 'insured', 'insurer',
    'exclusion', 'condition', 'limit', 'endorsement', 'form'
  ]
  
  const lowerText = text.toLowerCase()
  const keywordMatches = insuranceKeywords.filter(keyword => 
    lowerText.includes(keyword)
  ).length
  
  // Consider it an insurance form if it contains at least 3 insurance keywords
  return keywordMatches >= 3
}

/**
 * Preprocesses text for better AI analysis
 * @param {string} text - Raw extracted text
 * @returns {string} - Cleaned and formatted text
 */
export function preprocessTextForAI(text) {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove page numbers and headers/footers
    .replace(/Page \d+ of \d+/gi, '')
    .replace(/^\d+\s*$/gm, '')
    // Clean up common PDF artifacts
    .replace(/[^\w\s.,;:!?()-]/g, ' ')
    // Normalize line breaks
    .replace(/\n\s*\n/g, '\n\n')
    .trim()
}

/**
 * Estimates the cost of an OpenAI API call
 * @param {string} text - Input text
 * @param {string} model - Model name (default: gpt-4o-mini)
 * @returns {object} - Cost estimation details
 */
export function estimateAPIcost(text, model = 'gpt-4o-mini') {
  // Rough token estimation (1 token ≈ 4 characters)
  const inputTokens = Math.ceil(text.length / 4)
  const outputTokens = 250 // Estimated output tokens for summary
  
  // Pricing per 1M tokens (as of 2024)
  const pricing = {
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4o': { input: 2.50, output: 10.00 }
  }
  
  const modelPricing = pricing[model] || pricing['gpt-4o-mini']
  
  const inputCost = (inputTokens / 1000000) * modelPricing.input
  const outputCost = (outputTokens / 1000000) * modelPricing.output
  const totalCost = inputCost + outputCost
  
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    estimatedCost: totalCost,
    formattedCost: `$${totalCost.toFixed(4)}`
  }
}
