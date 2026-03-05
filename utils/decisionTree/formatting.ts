import { CCY } from './constants'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function fmtE(n: number, c?: string): string {
  const s = (c && CCY[c]?.sym) || '€'
  return n ? s + n.toLocaleString('en-US') : s + '0'
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear()
}

export function gridC(n: number): string {
  return '28px 150px 68px 72px 140px 120px ' + Array(n).fill('96px').join(' ') + ' 34px'
}
