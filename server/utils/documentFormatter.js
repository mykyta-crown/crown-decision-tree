/**
 * Document Formatting Utility (Edge Runtime Compatible)
 * Formats extracted document text for AI prompt inclusion
 */

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
