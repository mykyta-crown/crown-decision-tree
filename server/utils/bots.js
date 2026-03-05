/**
 * Bot configuration for training/test auctions
 * Centralized constants to avoid duplication across files
 */

export const BOT_EMAILS = [
  'bot-1@crown-procurement.com',
  'bot-2@crown-procurement.com',
  'bot-3@crown-procurement.com',
  'bot-4@crown-procurement.com',
  'bot-5@crown-procurement.com'
]

/**
 * Check if an email belongs to a bot
 * @param {string} email - Email to check
 * @returns {boolean} - True if email is a bot email
 */
export function isBotEmail(email) {
  return BOT_EMAILS.includes(email)
}
