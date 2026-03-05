// ══════════════════════════════════════════════════════════════
// UI CONSTANTS
// ══════════════════════════════════════════════════════════════

export const FC: Record<string, { border: string; bg: string; text: string }> = {
  'Sealed Bid': { border: '#67E8F9', bg: '#ECFEFF', text: '#0E7490' },
  'English': { border: '#34D399', bg: '#ECFDF5', text: '#065F46' },
  'Dutch': { border: '#A78BFA', bg: '#F5F3FF', text: '#5B21B6' },
  'Japanese': { border: '#FBBF24', bg: '#FFFBEB', text: '#92400E' },
  'Traditional': { border: '#FB923C', bg: '#FFF7ED', text: '#9A3412' },
  'Double Scenario': { border: '#F472B6', bg: '#FDF2F8', text: '#9D174D' },
}

export const noFC = { border: '#D1D5DB', bg: '#F9FAFB', text: '#6B7280' }

export function gfc(f: string) {
  return FC[f] || noFC
}

export const BAR3 = ['#34D399', '#FB923C', '#E88B8B']

export const PREF_LABELS: Record<number, string> = {
  1: 'None',
  2: 'Non-Financial',
  3: 'Financial',
}

export const CCY: Record<string, { sym: string; code: string }> = {
  EUR: { sym: '€', code: 'EUR' },
  USD: { sym: '$', code: 'USD' },
  GBP: { sym: '£', code: 'GBP' },
}

export const DISP_NAMES: Record<string, string> = {
  'English': 'English Reverse',
  'Dutch': 'Dutch Reverse',
  'Sealed Bid': 'Sealed Bid',
  'Japanese': 'Japanese',
  'Traditional': 'Traditional Negotiation',
  'Double Scenario': 'Double Scenario',
}

export function getFamilyOptions(f: string): { security: string[] | null; preference: string[] | null; awarding: string[] | null } {
  const map: Record<string, { security: string[] | null; preference: string[] | null; awarding: string[] | null }> = {
    'English': { security: ['Pre-bid', 'No Pre-bid'], preference: ['None', 'Non-Financial', 'Financial'], awarding: ['Award', 'Rank'] },
    'Dutch': { security: ['Pre-bid', 'No Pre-bid'], preference: ['None', 'Non-Financial', 'Financial'], awarding: ['Award'] },
    'Sealed Bid': { security: ['No Pre-bid'], preference: ['None', 'Non-Financial', 'Financial'], awarding: ['Award', 'Rank', 'No Rank'] },
    'Japanese': { security: ['Pre-bid', 'No Pre-bid'], preference: null, awarding: ['Award', 'Rank', 'No Rank'] },
    'Double Scenario': { security: ['Pre-bid', 'No Pre-bid'], preference: ['None', 'Non-Financial', 'Financial'], awarding: ['Award', 'Rank'] },
  }
  return map[f] || { security: null, preference: null, awarding: null }
}
