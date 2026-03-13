import { FC, PREF_LABELS, getFamilyOptions, CCY } from './constants'
import { fmtE } from './formatting'
import type { ScoreResult } from './scoring-engine'

interface ExportLot {
  name: string
  qty: number
  unit: string
  pref: number
  intens: number
  award: number
  prices: number[]
  excl: boolean[]
  baseline: number
  top3: ScoreResult[]
}

interface ExportData {
  evName: string
  userName: string
  mode: string
  spend: number
  nSup: number
  award: number | null
  ccy: string
  lots: ExportLot[]
  supNames: string[]
  totBase: number
}

const AWARD_MAP: Record<number, string> = { 1: 'Award', 2: 'Rank', 3: 'No Rank' }

const FAMILY_INTENSITY: Record<string, number> = {
  'Double Scenario': 15, 'English': 12, 'Dutch': 8,
  'Japanese': 8, 'Sealed Bid': 4, 'Traditional': 2,
}

const FAMILY_COLOR: Record<string, string> = {
  'Double Scenario': '#F472B6', 'English': '#34D399', 'Dutch': '#A78BFA',
  'Japanese': '#FBBF24', 'Sealed Bid': '#67E8F9', 'Traditional': '#FB923C',
}

function intensityHtml(family: string): string {
  const total = 16
  const filled = FAMILY_INTENSITY[family] ?? 0
  const color = FAMILY_COLOR[family] ?? '#FB923C'
  let bars = ''
  for (let i = 1; i <= total; i++) {
    const bg = i <= filled ? color : '#E9EAEC'
    bars += `<span style="display:inline-block;width:6px;height:11px;border-radius:4px;background:${bg};"></span>`
  }
  return `<div style="display:flex;align-items:center;gap:6px;">
    <span style="font-size:11px;color:#61615F;min-width:68px;font-weight:500;">Intensity:</span>
    <div style="display:flex;gap:2px;align-items:center;">${bars}</div>
  </div>`
}

function optionRowHtml(label: string, options: string[], selected: string): string {
  const pills = options.map(opt => {
    const sel = opt === selected
    const border = sel ? '#1D1D1B' : '#E5E7EB'
    const color = sel ? '#1D1D1B' : '#9CA3AF'
    const fw = sel ? '600' : '400'
    return `<span style="padding:3px 8px;border-radius:5px;border:1.5px solid ${border};font-size:10px;color:${color};font-weight:${fw};background:#FFF;white-space:nowrap;">${opt}</span>`
  }).join('')
  return `<div style="display:flex;align-items:center;gap:6px;">
    <span style="font-size:11px;color:#1D1D1B;min-width:68px;flex-shrink:0;font-weight:500;">${label}:</span>
    <div style="display:flex;gap:4px;">${pills}</div>
  </div>`
}

function displayName(rec: ScoreResult): string {
  const familyNames: Record<string, string> = {
    English: 'English', Dutch: 'Dutch', 'Sealed Bid': 'Sealed Bid',
    Japanese: 'Japanese', 'Double Scenario': 'Double Scenario',
    Traditional: 'Traditional Negotiation',
  }
  const base = familyNames[rec.family] || rec.family
  if (rec.family === 'Traditional' || rec.family === 'Double Scenario') return base
  const tfLabels: Record<string, string> = {
    'Fixed+Dynamic': 'Transfo', Ceiling: 'Ceiling',
    Preference: 'Preferred', 'Ceiling+Pref': 'Ceiling + Preferred',
  }
  const parts = [base]
  if (rec.tf && rec.tf !== 'None' && rec.tf !== '\u2014') parts.push(tfLabels[rec.tf] || rec.tf)
  if (rec.aw && rec.aw !== '\u2014') parts.push(rec.aw)
  return parts.join(' - ')
}

function cardColor(family: string) {
  const c = FC[family] || { border: '#D1D5DB', bg: '#F9FAFB', text: '#6B7280' }
  return c
}

function recCardHtml(rec: ScoreResult, rank: number, lot: ExportLot, ccy: string, mode: string): string {
  const c = cardColor(rec.family)
  const isDbl = rec.family === 'Double Scenario'
  const engC = FC['English']
  const dutC = FC['Dutch']

  const accentBg = isDbl
    ? `linear-gradient(180deg, ${engC.border} 0%, ${dutC.border} 100%)`
    : c.border
  const chipBg = isDbl
    ? `linear-gradient(135deg, ${engC.bg} 0%, ${dutC.bg} 100%)`
    : c.bg
  const textColor = isDbl ? '#1D1D1B' : c.text
  const barBg = isDbl
    ? `linear-gradient(90deg, ${engC.border}, ${dutC.border})`
    : c.border

  const rankColors = ['#D1FAE5;color:#065F46', '#FEF3C7;color:#92400E', '#F3F4F6;color:#6B7280']
  const rankLabels = ['1st', '2nd', '3rd']

  const opts = getFamilyOptions(rec.family)
  const prefLabel = PREF_LABELS[lot.pref] || 'None'
  const awLabel = rec.family === 'Double Scenario' ? 'Award' : (rec.aw && rec.aw !== '\u2014' ? rec.aw : 'Award')

  let optionsHtml = ''
  if (opts.security) optionsHtml += optionRowHtml('Security', opts.security, 'Pre-bid')
  if (opts.preference) optionsHtml += optionRowHtml('Preference', opts.preference, prefLabel)
  if (opts.awarding) optionsHtml += optionRowHtml('Awarding', opts.awarding, awLabel)
  optionsHtml += intensityHtml(rec.family)

  const savingsAmount = lot.baseline > 0
    ? ` <span style="font-size:13px;color:#374151;font-weight:500;">&asymp; ${fmtE(Math.round(lot.baseline * rec.saving / 100), ccy)}</span>`
    : ''

  return `
  <div style="border-radius:8px;overflow:hidden;background:#FFF;position:relative;box-shadow:0 1px 4px rgba(0,0,0,0.06);break-inside:avoid;">
    <div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:${accentBg};"></div>
    <div style="padding:11px 14px 11px 18px;background:${chipBg};">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;font-size:10px;font-weight:700;background:${rankColors[rank]};">${rankLabels[rank]}</span>
          <span style="font-size:14px;font-weight:600;color:${textColor};">${displayName(rec)}</span>
        </div>
        <span style="font-size:14px;font-weight:600;color:${textColor};">${rec.pctMatch}%</span>
      </div>
      <div style="height:4px;border-radius:2px;background:rgba(0,0,0,0.08);">
        <div style="height:100%;border-radius:2px;background:${barBg};width:${rec.pctMatch}%;"></div>
      </div>
    </div>
    <div style="padding:12px 16px 16px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="background:#D1FAE5;color:#065F46;border-radius:4px;padding:3px 8px;font-size:12px;font-weight:600;">+${rec.saving}%</span>
        ${savingsAmount}
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${optionsHtml}
      </div>
    </div>
  </div>`
}

function supplierPriceTableHtml(lot: ExportLot, supNames: string[], ccy: string): string {
  let rows = ''
  for (let si = 0; si < supNames.length; si++) {
    const price = lot.prices[si] || 0
    const excluded = lot.excl[si]
    const total = price > 0 ? price * (lot.qty || 1) : 0
    const rowBg = si % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
    const textDecor = excluded ? 'text-decoration:line-through;color:#9CA3AF;' : 'color:#1D1D1B;'
    const excludedBadge = excluded
      ? '<span style="background:#FEE2E2;color:#991B1B;border-radius:4px;padding:1px 6px;font-size:10px;font-weight:500;margin-left:6px;">Excluded</span>'
      : ''

    rows += `
    <tr style="background:${rowBg};">
      <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;font-size:12px;font-weight:500;${textDecor}">${supNames[si]}${excludedBadge}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;font-size:12px;text-align:right;${textDecor}">${price > 0 ? fmtE(price, ccy) : '—'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;font-size:12px;text-align:right;${textDecor}">${total > 0 ? fmtE(total, ccy) : '—'}</td>
    </tr>`
  }

  return `
  <table style="width:100%;border-collapse:collapse;margin-top:12px;border:1px solid #E9EAEC;border-radius:6px;overflow:hidden;">
    <thead>
      <tr style="background:#F9FAFB;">
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:500;color:#61615F;border-bottom:1px solid #E9EAEC;">Supplier</th>
        <th style="padding:8px 12px;text-align:right;font-size:11px;font-weight:500;color:#61615F;border-bottom:1px solid #E9EAEC;">Unit Price</th>
        <th style="padding:8px 12px;text-align:right;font-size:11px;font-weight:500;color:#61615F;border-bottom:1px solid #E9EAEC;">Total (x${lot.qty} ${lot.unit})</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`
}

function intensityLevelLabel(intens: number): string {
  if (intens <= 33) return 'Collaborative'
  if (intens <= 66) return 'Competitive'
  return 'Aggressive'
}

function lotBlockHtml(lot: ExportLot, li: number, data: ExportData): string {
  const activeSup = lot.prices.filter((p, i) => !lot.excl[i] && p > 0).length
  const excludedSup = lot.excl.filter(Boolean).length

  const awardLabel = (data.mode === 'guided' || data.mode === 'blue') ? (AWARD_MAP[lot.award] || 'Award') : (AWARD_MAP[data.award ?? 1] || 'Award')
  const prefLabel = PREF_LABELS[lot.pref] || 'None'

  // Gap calculation (same as scoring engine)
  const activePrices = lot.prices.filter((p, i) => p > 0 && !lot.excl[i])
  let gapText = '—'
  if (activePrices.length >= 2) {
    const sorted = [...activePrices].sort((a, b) => a - b)
    const low3 = sorted.slice(0, 3)
    const mn = low3[0], mx = low3[low3.length - 1]
    if (mn > 0) {
      const g = Math.round((mx - mn) / mn * 10000) / 100
      gapText = g + '%'
    }
  }

  let recsHtml = ''
  if (lot.top3.length === 0) {
    recsHtml = '<div style="color:#9CA3AF;font-size:13px;padding:20px;text-align:center;">No recommendations available</div>'
  } else {
    recsHtml = `<div style="display:grid;grid-template-columns:repeat(${Math.min(lot.top3.length, 3)}, 1fr);gap:12px;margin-top:16px;">`
    lot.top3.forEach((rec, ri) => {
      recsHtml += recCardHtml(rec, ri, lot, data.ccy, data.mode)
    })
    recsHtml += '</div>'
  }

  return `
  <div style="border:1px solid #E9EAEC;border-radius:10px;padding:20px;margin-bottom:20px;break-inside:avoid;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
      <div>
        <div style="font-size:11px;color:#61615F;font-weight:500;">Lot ${li + 1}</div>
        <div style="font-size:16px;font-weight:600;color:#1D1D1B;">${lot.name}</div>
      </div>
      <div style="font-size:16px;font-weight:700;color:#1D1D1B;">${fmtE(lot.baseline, data.ccy)}</div>
    </div>

    <!-- Lot parameters -->
    <div style="display:flex;flex-wrap:wrap;gap:16px;margin-top:10px;margin-bottom:4px;padding:12px 16px;background:#F9FAFB;border-radius:8px;">
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:11px;color:#61615F;">Quantity:</span>
        <span style="font-size:13px;font-weight:600;color:#1D1D1B;">${lot.qty} ${lot.unit}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:11px;color:#61615F;">Active Suppliers:</span>
        <span style="font-size:13px;font-weight:600;color:#1D1D1B;">${activeSup}${excludedSup > 0 ? ` <span style="color:#9CA3AF;font-weight:400;">(${excludedSup} excluded)</span>` : ''}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:11px;color:#61615F;">Award:</span>
        <span style="font-size:13px;font-weight:600;color:#1D1D1B;">${awardLabel}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:11px;color:#61615F;">Preference:</span>
        <span style="font-size:13px;font-weight:600;color:#1D1D1B;">${prefLabel}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:11px;color:#61615F;">Intensity:</span>
        <span style="font-size:13px;font-weight:600;color:#1D1D1B;">${lot.intens}% (${intensityLevelLabel(lot.intens)})</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:11px;color:#61615F;">Gap (top 3):</span>
        <span style="font-size:13px;font-weight:600;color:#1D1D1B;">${gapText}</span>
      </div>
    </div>

    <!-- Supplier price table -->
    ${supplierPriceTableHtml(lot, data.supNames, data.ccy)}

    <!-- Recommendations -->
    <div style="margin-top:16px;">
      <div style="font-size:13px;font-weight:600;color:#1D1D1B;margin-bottom:4px;">Recommendations</div>
      ${recsHtml}
    </div>
  </div>`
}

function buildExecutiveSummary(data: ExportData): string {
  const ccyCode = CCY[data.ccy]?.code || data.ccy

  // Collect all top-1 recommendations across lots
  const topRecs = data.lots
    .map(l => l.top3[0])
    .filter(Boolean)

  // Count families
  const familyCounts: Record<string, number> = {}
  topRecs.forEach(r => {
    familyCounts[r.family] = (familyCounts[r.family] || 0) + 1
  })
  const dominantFamily = Object.entries(familyCounts).sort((a, b) => b[1] - a[1])[0]

  // Average savings and best savings
  const savings = topRecs.map(r => r.saving)
  const avgSaving = savings.length ? Math.round(savings.reduce((s, v) => s + v, 0) / savings.length) : 0
  const maxSaving = savings.length ? Math.max(...savings) : 0
  const avgMatch = topRecs.length ? Math.round(topRecs.reduce((s, r) => s + r.pctMatch, 0) / topRecs.length) : 0

  // Estimated savings amount
  const estSavingsAmount = data.totBase > 0 ? Math.round(data.totBase * avgSaving / 100) : 0

  // Build sentences
  const lines: string[] = []

  const familyDisplayNames: Record<string, string> = {
    English: 'English', Dutch: 'Dutch', 'Sealed Bid': 'Sealed Bid',
    Japanese: 'Japanese', 'Double Scenario': 'Double Scenario',
    Traditional: 'Traditional Negotiation',
  }

  // Intro line
  const lotWord = data.lots.length === 1 ? '1 lot' : `${data.lots.length} lots`
  const supWord = data.nSup === 1 ? '1 supplier' : `${data.nSup} suppliers`
  lines.push(`This report covers a sourcing scenario totalling <strong>${fmtE(data.spend, data.ccy)}</strong> (${ccyCode}) across <strong>${lotWord}</strong> with <strong>${supWord}</strong> in the panel.`)

  // Recommendation line
  if (dominantFamily && topRecs.length > 0) {
    const famName = familyDisplayNames[dominantFamily[0]] || dominantFamily[0]
    const famColor = FAMILY_COLOR[dominantFamily[0]] || '#1D1D1B'

    if (data.lots.length === 1) {
      lines.push(`Based on the parameters entered, the most suitable eAuction format is <strong style="color:${famColor};">${famName}</strong>, with a compatibility score of <strong>${avgMatch}%</strong>.`)
    } else {
      const allSame = Object.keys(familyCounts).length === 1
      if (allSame) {
        lines.push(`The analysis recommends <strong style="color:${famColor};">${famName}</strong> across all lots, with an average compatibility score of <strong>${avgMatch}%</strong>.`)
      } else {
        const familySummary = Object.entries(familyCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([fam, count]) => {
            const name = (familyDisplayNames[fam] || fam)
            const col = FAMILY_COLOR[fam] || '#1D1D1B'
            return `<strong style="color:${col};">${name}</strong> (${count} lot${count > 1 ? 's' : ''})`
          })
          .join(', ')
        lines.push(`The recommended auction formats vary by lot: ${familySummary}. Average compatibility score: <strong>${avgMatch}%</strong>.`)
      }
    }
  }

  // Savings line
  if (avgSaving > 0) {
    let savingsLine = `The estimated savings potential is <strong>+${avgSaving}%</strong> on average`
    if (maxSaving !== avgSaving) {
      savingsLine += ` (up to <strong>+${maxSaving}%</strong> on the best-performing lot)`
    }
    if (estSavingsAmount > 0) {
      savingsLine += `, representing approximately <strong>${fmtE(estSavingsAmount, data.ccy)}</strong> against a total baseline of ${fmtE(data.totBase, data.ccy)}`
    }
    savingsLine += '.'
    lines.push(savingsLine)
  }

  // No recommendation warning
  if (topRecs.length === 0) {
    lines.push('No eAuction format could be recommended for this scenario given the current parameters. A traditional negotiation approach may be more appropriate.')
  }

  return `
  <div style="margin-bottom:32px;padding:20px 24px;background:linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%);border:1px solid #BBF7D0;border-radius:10px;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#065F46" stroke-width="1.5"/><path d="M10 6v5M10 13.5v.5" stroke="#065F46" stroke-width="1.5" stroke-linecap="round"/></svg>
      <span style="font-size:15px;font-weight:700;color:#065F46;">Executive Summary</span>
    </div>
    <div style="font-size:13px;line-height:1.7;color:#1D1D1B;">
      ${lines.map(l => `<p style="margin:0 0 6px 0;">${l}</p>`).join('')}
    </div>
  </div>`
}

export function exportArchitectPdf(data: ExportData) {
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const awardLabel = data.award ? (AWARD_MAP[data.award] || '-') : '-'
  const ccyLabel = CCY[data.ccy]?.code || data.ccy

  const spendRange = data.spend < 100000 ? 'Under 100K' : data.spend <= 500000 ? '100K - 500K' : 'Over 500K'

  // Executive summary
  const execSummaryHtml = buildExecutiveSummary(data)

  // Supplier names list
  const supListHtml = data.supNames.map((name, i) => {
    return `<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;border:1px solid #E9EAEC;background:#FFF;font-size:12px;color:#1D1D1B;font-weight:500;">
      <span style="color:#9CA3AF;font-size:10px;font-weight:600;">${i + 1}</span> ${name}
    </span>`
  }).join('')

  // Phase 1 summary
  const phase1Html = `
  <div style="margin-bottom:32px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
      <div style="width:28px;height:28px;border-radius:6px;background:#D1FAE5;color:#065F46;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;">1</div>
      <span style="font-size:16px;font-weight:600;color:#1D1D1B;">eAuction Feasibility Check</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(${(data.mode === 'guided' || data.mode === 'blue') ? 3 : 4}, 1fr);gap:16px;margin-bottom:16px;">
      <div style="border:1px solid #E9EAEC;border-radius:8px;padding:16px;">
        <div style="font-size:11px;color:#61615F;margin-bottom:4px;">Total Spend</div>
        <div style="font-size:18px;font-weight:700;color:#1D1D1B;">${fmtE(data.spend, data.ccy)}</div>
        <div style="font-size:11px;color:#9CA3AF;margin-top:2px;">${spendRange}</div>
      </div>
      <div style="border:1px solid #E9EAEC;border-radius:8px;padding:16px;">
        <div style="font-size:11px;color:#61615F;margin-bottom:4px;">Number of Suppliers</div>
        <div style="font-size:18px;font-weight:700;color:#1D1D1B;">${data.nSup}</div>
      </div>
      <div style="border:1px solid #E9EAEC;border-radius:8px;padding:16px;">
        <div style="font-size:11px;color:#61615F;margin-bottom:4px;">Currency</div>
        <div style="font-size:18px;font-weight:700;color:#1D1D1B;">${ccyLabel}</div>
      </div>
      ${(data.mode !== 'guided' && data.mode !== 'blue') ? `
      <div style="border:1px solid #E9EAEC;border-radius:8px;padding:16px;">
        <div style="font-size:11px;color:#61615F;margin-bottom:4px;">Award Method</div>
        <div style="font-size:18px;font-weight:700;color:#1D1D1B;">${awardLabel}</div>
      </div>` : ''}
    </div>
    <!-- Suppliers list -->
    <div style="border:1px solid #E9EAEC;border-radius:8px;padding:16px;">
      <div style="font-size:11px;color:#61615F;margin-bottom:8px;">Suppliers</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">${supListHtml}</div>
    </div>
  </div>`

  // Phase 2 - Lot overview table
  let lotTableRows = ''
  data.lots.forEach((lot, i) => {
    const activePrices = lot.prices.filter((p, pi) => !lot.excl[pi] && p > 0)
    const supCount = activePrices.length
    const prefLabel = PREF_LABELS[lot.pref] || 'None'
    const lotAward = (data.mode === 'guided' || data.mode === 'blue') ? (AWARD_MAP[lot.award] || 'Award') : awardLabel
    lotTableRows += `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;font-size:12px;color:#61615F;">Lot ${i + 1}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;font-size:12px;font-weight:600;color:#1D1D1B;">${lot.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;font-size:12px;color:#1D1D1B;">${lot.qty} ${lot.unit}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;font-size:12px;color:#1D1D1B;">${supCount} suppliers</td>
      <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;font-size:12px;color:#1D1D1B;">${prefLabel}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;font-size:12px;color:#1D1D1B;">${lotAward}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;font-size:12px;color:#1D1D1B;">${lot.intens}%</td>
      <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;font-size:12px;font-weight:600;color:#1D1D1B;">${fmtE(lot.baseline, data.ccy)}</td>
    </tr>`
  })

  const phase2Html = `
  <div style="margin-bottom:32px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
      <div style="width:28px;height:28px;border-radius:6px;background:#D1FAE5;color:#065F46;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;">2</div>
      <span style="font-size:16px;font-weight:600;color:#1D1D1B;">Lot Configuration Overview</span>
    </div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #E9EAEC;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#F9FAFB;">
          <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:500;color:#61615F;border-bottom:1px solid #E9EAEC;">#</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:500;color:#61615F;border-bottom:1px solid #E9EAEC;">Name</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:500;color:#61615F;border-bottom:1px solid #E9EAEC;">Quantity</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:500;color:#61615F;border-bottom:1px solid #E9EAEC;">Suppliers</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:500;color:#61615F;border-bottom:1px solid #E9EAEC;">Preference</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:500;color:#61615F;border-bottom:1px solid #E9EAEC;">Award</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:500;color:#61615F;border-bottom:1px solid #E9EAEC;">Intensity</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:500;color:#61615F;border-bottom:1px solid #E9EAEC;">Baseline</th>
        </tr>
      </thead>
      <tbody>${lotTableRows}</tbody>
      <tfoot>
        <tr style="background:#F9FAFB;">
          <td colspan="7" style="padding:8px 12px;font-size:12px;font-weight:600;color:#1D1D1B;">Total Baseline</td>
          <td style="padding:8px 12px;font-size:12px;font-weight:700;color:#1D1D1B;">${fmtE(data.totBase, data.ccy)}</td>
        </tr>
      </tfoot>
    </table>
  </div>`

  // Phase 3 - Detailed lots with supplier prices + recommendations
  let lotsHtml = ''
  data.lots.forEach((lot, li) => {
    lotsHtml += lotBlockHtml(lot, li, data)
  })

  const phase3Html = `
  <div style="margin-bottom:24px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
      <div style="width:28px;height:28px;border-radius:6px;background:#D1FAE5;color:#065F46;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;">3</div>
      <span style="font-size:16px;font-weight:600;color:#1D1D1B;">Detailed Lot Analysis & Recommendations</span>
    </div>
    ${lotsHtml}
  </div>`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${data.evName || 'Scenario Report'} - Crown</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1D1D1B;
      background: #FFF;
      padding: 48px;
      max-width: 960px;
      margin: 0 auto;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print {
      body { padding: 24px; }
      @page { size: A4; margin: 16mm; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #E9EAEC;">
    <div>
      <div style="font-size:11px;letter-spacing:0.08em;color:#9CA3AF;font-weight:600;text-transform:uppercase;margin-bottom:6px;">Scenario Report</div>
      <div style="font-size:24px;font-weight:700;color:#1D1D1B;margin-bottom:4px;">${data.evName || 'Untitled Scenario'}</div>
      <div style="font-size:13px;color:#6B7280;">
        Prepared by <strong>${data.userName || '-'}</strong> &middot; ${dateStr}
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;color:#9CA3AF;font-weight:500;margin-bottom:4px;">Total Baseline</div>
      <div style="font-size:20px;font-weight:700;color:#1D1D1B;">${fmtE(data.totBase, data.ccy)}</div>
      <div style="font-size:11px;color:#9CA3AF;margin-top:2px;">${data.lots.length} lot${data.lots.length > 1 ? 's' : ''} &middot; ${data.nSup} supplier${data.nSup > 1 ? 's' : ''} &middot; ${ccyLabel} &middot; ${data.mode === 'guided' ? 'Quick Scenario' : data.mode === 'blue' ? 'Architect' : 'Standard'}</div>
    </div>
  </div>

  ${execSummaryHtml}
  ${phase1Html}
  ${phase2Html}
  ${phase3Html}

  <!-- Footer -->
  <div style="text-align:center;padding-top:20px;border-top:1px solid #E9EAEC;margin-top:24px;">
    <div style="font-size:11px;color:#9CA3AF;">Generated by Crown Procurement &middot; ${dateStr}</div>
  </div>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  // Wait for fonts to load, then trigger print
  setTimeout(() => { win.print() }, 500)
}
