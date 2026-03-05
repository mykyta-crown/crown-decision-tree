/**
 * Document Text Extraction Utility
 * Extracts text from PDF and DOCX files for AI processing
 */

import mammoth from 'mammoth'
import { extractText as extractPDFText, getDocumentProxy } from 'unpdf'

/**
 * Extract text from a PDF buffer
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<{text: string, wordCount: number, pageCount: number}>}
 */
export async function extractTextFromPDF(buffer) {
  try {
    // Convert Buffer to ArrayBuffer for unpdf
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    )

    // Extract text using unpdf
    const { text, totalPages } = await extractPDFText(arrayBuffer, { mergePages: true })

    const trimmedText = text.trim()
    const wordCount = trimmedText.split(/\s+/).filter((word) => word.length > 0).length

    return {
      text: trimmedText,
      wordCount,
      pageCount: totalPages,
      metadata: {
        pages: totalPages
      }
    }
  } catch (error) {
    console.error('Error extracting text from PDF:', error)
    throw new Error('Failed to extract text from PDF: ' + error.message)
  }
}

/**
 * Extract text from a DOCX buffer
 * @param {Buffer} buffer - DOCX file buffer
 * @returns {Promise<{text: string, wordCount: number}>}
 */
export async function extractTextFromDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer })

    const text = result.value.trim()
    const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length

    // Check for warnings (e.g., unsupported elements)
    if (result.messages.length > 0) {
      console.warn('DOCX extraction warnings:', result.messages)
    }

    return {
      text,
      wordCount,
      metadata: {
        warnings: result.messages
      }
    }
  } catch (error) {
    console.error('Error extracting text from DOCX:', error)
    throw new Error('Failed to extract text from DOCX: ' + error.message)
  }
}

/**
 * Extract text from a file based on its MIME type
 * @param {Buffer} buffer - File buffer
 * @param {string} mimeType - File MIME type
 * @returns {Promise<{text: string, wordCount: number, estimatedTokens: number, metadata: object}>}
 */
export async function extractText(buffer, mimeType) {
  let result

  if (mimeType === 'application/pdf') {
    result = await extractTextFromPDF(buffer)
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    result = await extractTextFromDOCX(buffer)
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`)
  }

  // Estimate tokens (rough approximation: 1 word ≈ 1.3 tokens)
  const estimatedTokens = Math.ceil(result.wordCount * 1.3)

  return {
    text: result.text,
    wordCount: result.wordCount,
    estimatedTokens,
    metadata: result.metadata || {}
  }
}

/**
 * Validate file size and type
 * @param {number} fileSize - File size in bytes
 * @param {string} mimeType - File MIME type
 * @param {number} maxSize - Maximum file size in bytes (default: 10MB)
 * @returns {boolean}
 * @throws {Error} If validation fails
 */
export function validateFile(fileSize, mimeType, maxSize = 10485760) {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]

  if (fileSize > maxSize) {
    throw new Error(`File too large. Maximum size is ${Math.floor(maxSize / 1048576)}MB`)
  }

  if (fileSize <= 0) {
    throw new Error('File is empty')
  }

  if (!allowedTypes.includes(mimeType)) {
    throw new Error('Invalid file type. Only PDF and DOCX files are supported')
  }

  return true
}

/**
 * Format extracted text for AI prompt
 * @param {string} filename - Name of the document
 * @param {string} text - Extracted text
 * @param {number} wordCount - Word count
 * @returns {string} Formatted text for AI
 */
export function formatDocumentForAI(filename, text, wordCount) {
  return `[Document: ${filename} - ${wordCount} words]\n\n${text}\n\n[End of ${filename}]`
}
