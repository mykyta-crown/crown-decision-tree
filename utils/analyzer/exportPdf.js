/**
 * Analyzer PDF Export — generates HTML report and triggers browser print dialog
 * Same pattern as architect/exportPdf.ts
 */

const PAGE_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; color: #1D1D1B; font-size: 12px; padding: 40px; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  @page { size: A4 landscape; margin: 20mm; }
  h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  h2 { font-size: 16px; font-weight: 600; margin: 20px 0 10px; border-bottom: 2px solid #E9EAEC; padding-bottom: 6px; }
  h3 { font-size: 13px; font-weight: 600; margin: 12px 0 6px; }
  .subtitle { font-size: 12px; color: #61615F; margin-bottom: 16px; }
  .kpi-row { display: flex; gap: 12px; margin-bottom: 16px; }
  .kpi-box { flex: 1; border: 1px solid #E9EAEC; border-radius: 4px; padding: 10px 14px; }
  .kpi-value { font-size: 20px; font-weight: 700; }
  .kpi-label { font-size: 10px; color: #61615F; margin-top: 2px; }
  .green { color: #16a34a; }
  .red { color: #dc2626; }
  .grey { color: #AEB0B2; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
  th { background: #F4F4F5; font-weight: 500; color: #61615F; text-align: left; padding: 6px 8px; border-bottom: 1px solid #E9EAEC; }
  td { padding: 5px 8px; border-bottom: 1px solid #F0F0F0; }
  th.right, td.right { text-align: right; }
  th.center, td.center { text-align: center; }
  .chip { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 500; }
  .chip-dutch { background: #EDEBFE; color: #6D28D9; }
  .chip-reverse { background: #EBFFF7; color: #059669; }
  .chip-japanese { background: #FDFFD2; color: #92400E; }
  .chip-sealed-bid { background: #DFF0FF; color: #1D4ED8; }
  .bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .bar-label { width: 80px; font-size: 11px; color: #61615F; }
  .bar-bg { flex: 1; height: 8px; background: #F0F0F0; border-radius: 3px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 3px; }
  .bar-fill-green { background: #34D399; }
  .bar-fill-blue { background: #60A5FA; }
  .bar-fill-purple { background: #A78BFA; }
  .bar-value { width: 50px; text-align: right; font-size: 11px; font-weight: 600; }
  .bar-sub { width: 30px; text-align: right; font-size: 10px; color: #AEB0B2; }
  .section-card { border: 1px solid #E9EAEC; border-radius: 4px; padding: 14px; margin-bottom: 12px; }
  .two-col { display: flex; gap: 16px; }
  .two-col > div { flex: 1; }
  .metric-row { display: flex; justify-content: space-between; padding: 3px 0; }
  .metric-label { font-size: 11px; color: #61615F; }
  .metric-value { font-size: 11px; font-weight: 500; }
  .page-break { page-break-before: always; }
  .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #E9EAEC; font-size: 10px; color: #AEB0B2; display: flex; justify-content: space-between; }
`

const typeLabel = (t) => ({ reverse: 'English', dutch: 'Dutch', japanese: 'Japanese', 'sealed-bid': 'Sealed Bid' }[t] || t)
const typeChipClass = (t) => `chip-${t}`

const fmtNum = (v, c) => {
  if (v == null || v === 0) return '—'
  const n = Number(v)
  if (isNaN(n) || n === 0) return '—'
  const cc = c || ''
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M ${cc}`.trim()
  if (n >= 1e3) return `${Math.round(n / 1e3)}K ${cc}`.trim()
  return `${n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} ${cc}`.trim()
}

const fmtSaving = (pct) => {
  if (pct == null) return '—'
  const n = Number(pct)
  if (n > 0) return `+${n}%`
  if (n < 0) return `${n}%`
  return '0%'
}

const titleCase = (s) => {
  if (!s) return ''
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

function buildAuctionsTable(auctions, currency) {
  if (!auctions.length) return '<p class="grey">No auctions data</p>'
  return `
    <table>
      <thead><tr>
        <th>Name</th><th>Client</th><th>Type</th><th>Date</th>
        <th class="right">Baseline</th><th class="right">Spend</th>
        <th class="right">Saved</th><th class="right">Saving</th>
        <th class="center">Suppl.</th><th class="center">Bids</th>
      </tr></thead>
      <tbody>
        ${auctions.map(a => `<tr>
          <td>${a.name}</td>
          <td>${titleCase(a.company_name)}</td>
          <td><span class="chip ${typeChipClass(a.type)}">${typeLabel(a.type)}</span></td>
          <td>${a.start_at ? new Date(a.start_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
          <td class="right">${fmtNum(a.baseline, a.currency)}</td>
          <td class="right">${fmtNum(a.best_price, a.currency)}</td>
          <td class="right ${a.saving_pct > 0 ? 'green' : a.saving_pct < 0 ? 'red' : ''}">${fmtNum(a.saving_abs ? Math.abs(a.saving_abs) : null, a.currency)}</td>
          <td class="right ${a.saving_pct > 0 ? 'green' : a.saving_pct < 0 ? 'red' : ''}">${fmtSaving(a.saving_pct)}</td>
          <td class="center">${a.sellers_invited || '—'}</td>
          <td class="center">${a.bid_count || '—'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  `
}

function buildEventsTable(events) {
  if (!events.length) return '<p class="grey">No events data</p>'
  return `
    <table>
      <thead><tr>
        <th>Event</th><th>Client</th><th class="center">Lots</th><th>Type</th>
        <th class="right">Baseline</th><th class="right">Spend</th>
        <th class="right">Saved</th><th class="right">Saving</th>
        <th class="center">Suppl.</th><th class="center">Success</th>
      </tr></thead>
      <tbody>
        ${events.map(e => `<tr>
          <td>${e.event_name}</td>
          <td>${titleCase(e.company_name)}</td>
          <td class="center">${e.lot_count}</td>
          <td>${e.types?.split(', ').map(t => typeLabel(t)).join(', ')}</td>
          <td class="right">${fmtNum(e.total_baseline, e.currency)}</td>
          <td class="right">${fmtNum(e.total_spend, e.currency)}</td>
          <td class="right green">${fmtNum(e.total_saved, e.currency)}</td>
          <td class="right green">${fmtSaving(e.saving_pct)}</td>
          <td class="center">${e.unique_suppliers}</td>
          <td class="center">${e.lots_with_bids}/${e.lot_count}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  `
}

function buildSuppliersTable(suppliers) {
  if (!suppliers.length) return '<p class="grey">No supplier data</p>'
  return `
    <table>
      <thead><tr>
        <th>Profile</th><th>Supplier</th><th>Buyer</th>
        <th class="center">Inv.</th><th class="center">Bid%</th>
        <th class="center">Won</th><th class="center">Win%</th>
        <th class="right">Spend Won</th><th class="right">Entry%</th>
        <th class="right">Best%</th><th class="right">Compr.</th>
      </tr></thead>
      <tbody>
        ${suppliers.map(s => `<tr>
          <td>${s.profile}</td>
          <td>${s.email}</td>
          <td>${titleCase(s.buyers)}</td>
          <td class="center">${s.lots_invited}</td>
          <td class="center">${s.bid_rate || 0}%</td>
          <td class="center" style="font-weight:600">${s.lots_won}</td>
          <td class="center">${s.win_rate != null ? s.win_rate + '%' : '—'}</td>
          <td class="right">${fmtNum(s.spend_won, '')}</td>
          <td class="right">${s.avg_start_pct ? s.avg_start_pct + '%' : '—'}</td>
          <td class="right">${s.avg_best_pct ? s.avg_best_pct + '%' : '—'}</td>
          <td class="right">${s.avg_compression > 0 ? s.avg_compression + '%' : '—'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  `
}

function buildSupplierDetail(s) {
  const intensityDots = Array.from({ length: 5 }, (_, i) =>
    `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${i < s.intensity ? '#34D399' : '#E9EAEC'};margin-right:2px"></span>`
  ).join('')

  let lotHistoryHtml = ''
  if (s.lot_history && s.lot_history.length) {
    lotHistoryHtml = `
      <h3>Lot History</h3>
      <table>
        <thead><tr>
          <th>Auction</th><th>Type</th><th class="right">Start %BL</th>
          <th class="right">Best %BL</th><th class="right">Compression</th>
          <th class="center">Bids</th><th class="center">Result</th>
        </tr></thead>
        <tbody>
          ${s.lot_history.map(l => `<tr>
            <td>${l.auction}</td>
            <td><span class="chip ${typeChipClass(l.type)}">${typeLabel(l.type)}</span></td>
            <td class="right">${l.start_pct_bl ? l.start_pct_bl + '%' : '—'}</td>
            <td class="right">${l.best_pct_bl ? l.best_pct_bl + '%' : '—'}</td>
            <td class="right">${l.compression > 0 ? l.compression + '%' : '—'}</td>
            <td class="center">${l.bids}</td>
            <td class="center" style="color:${l.won ? '#059669' : '#AEB0B2'};font-weight:${l.won ? '600' : '400'}">${l.won ? 'Won' : 'Lost'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    `
  }

  const risks = (s.risks || []).map(r => {
    const labels = {
      ghost_recurring: 'Ghost — invited multiple times, never bids',
      dominant_winner: 'Dominant — wins almost every lot',
      always_bid_never_win: 'Always bids, never wins',
      extreme_high_entry: 'Enters very high above baseline',
      unstable_prebid: 'Frequently revises prebids'
    }
    return labels[r] || r
  })

  return `
    <div class="section-card page-break">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div>
          <span style="font-size:15px;font-weight:700">${s.email}</span>
          <span style="margin-left:8px;font-size:11px;color:#61615F">${titleCase(s.buyers || '')}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="chip" style="background:${s.profile === 'Expert' ? '#EBFFF7;color:#059669' : s.profile === 'Competiteur' ? '#DFF0FF;color:#1D4ED8' : s.profile === 'Volatile' ? '#FFE1CB;color:#9a3412' : '#F4F4F5;color:#61615F'}">${s.profile}</span>
          ${intensityDots}
        </div>
      </div>
      <div style="font-size:11px;color:#61615F;margin-bottom:10px;font-style:italic">${s.profile_detail || ''}</div>
      ${risks.length ? `<div style="margin-bottom:10px">${risks.map(r => `<span style="display:inline-block;font-size:10px;color:#92400E;background:#FFF7ED;padding:2px 8px;border-radius:4px;border:1px solid #FFE1CB;margin-right:4px">⚠ ${r}</span>`).join('')}</div>` : ''}
      <div class="kpi-row">
        <div class="kpi-box"><div class="kpi-value">${s.lots_invited}</div><div class="kpi-label">Invited</div></div>
        <div class="kpi-box"><div class="kpi-value">${s.bid_rate || 0}%</div><div class="kpi-label">Bid Rate</div></div>
        <div class="kpi-box"><div class="kpi-value green">${s.lots_won}</div><div class="kpi-label">Won</div></div>
        <div class="kpi-box"><div class="kpi-value">${s.win_rate || 0}%</div><div class="kpi-label">Win Rate</div></div>
        <div class="kpi-box"><div class="kpi-value green">${fmtNum(s.spend_won, '')}</div><div class="kpi-label">Spend Won</div></div>
      </div>
      <div class="two-col">
        <div class="section-card">
          <h3>Pricing Posture</h3>
          <div class="metric-row"><span class="metric-label">Avg entry</span><span class="metric-value">${s.avg_start_pct ? s.avg_start_pct + '% of baseline' : '—'}</span></div>
          <div class="metric-row"><span class="metric-label">Avg best</span><span class="metric-value green">${s.avg_best_pct ? s.avg_best_pct + '% of baseline' : '—'}</span></div>
          <div class="metric-row"><span class="metric-label">Compression</span><span class="metric-value">${s.avg_compression || 0}%</span></div>
          ${s.std_compression != null ? `<div class="metric-row"><span class="metric-label">Consistency</span><span class="metric-value">±${s.std_compression}%</span></div>` : ''}
        </div>
        <div class="section-card">
          <h3>Activity</h3>
          ${s.english_lots > 0 ? `
            <div class="metric-row"><span class="metric-label">English lots</span><span class="metric-value">${s.english_lots}</span></div>
            <div class="metric-row"><span class="metric-label">Avg bids/lot</span><span class="metric-value">${s.avg_bids_per_lot}</span></div>
            ${s.avg_reaction_min != null ? `<div class="metric-row"><span class="metric-label">Reaction time</span><span class="metric-value">${s.avg_reaction_min}min</span></div>` : ''}
          ` : ''}
          ${s.total_prebids > 0 ? `
            <div class="metric-row"><span class="metric-label">Prebids</span><span class="metric-value">${s.total_prebids}</span></div>
            <div class="metric-row"><span class="metric-label">Lots with prebid</span><span class="metric-value">${s.lots_with_prebids}</span></div>
          ` : ''}
        </div>
      </div>
      ${lotHistoryHtml}
    </div>
  `
}

/**
 * Main export function
 * @param {Object} opts
 * @param {string} opts.tab - Current tab name
 * @param {string} opts.company - Selected company filter or null
 * @param {string} opts.currency - Display currency
 * @param {Array} opts.auctions - Filtered auctions
 * @param {Array} opts.events - Filtered events
 * @param {Array} opts.suppliers - Filtered suppliers
 * @param {Object} opts.kpis - Dashboard KPI data
 */
export function exportAnalyzerPdf(opts) {
  if (typeof window === 'undefined') return

  const now = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const filterText = opts.company ? `Client: ${titleCase(opts.company)}` : 'All companies'

  let content = ''

  // Header
  content += `
    <h1>Crown Analyzer Report</h1>
    <div class="subtitle">${filterText} · ${opts.currency} · ${now} · ${opts.auctions.length} lots</div>
  `

  // KPIs
  if (opts.kpis) {
    const k = opts.kpis
    content += `
      <div class="kpi-row">
        <div class="kpi-box"><div class="kpi-value">${k.baseline || '—'}</div><div class="kpi-label">Total Baseline</div></div>
        <div class="kpi-box"><div class="kpi-value">${k.spend || '—'}</div><div class="kpi-label">Total Spend</div></div>
        <div class="kpi-box"><div class="kpi-value green">${k.saved || '—'}</div><div class="kpi-label">Total Saved</div></div>
        <div class="kpi-box"><div class="kpi-value green">${k.avgSaving || '0'}%</div><div class="kpi-label">Avg Saving</div></div>
        <div class="kpi-box"><div class="kpi-value">${k.successRate || '0'}%</div><div class="kpi-label">Success Rate</div></div>
        <div class="kpi-box"><div class="kpi-value">${k.auctionCount || 0}</div><div class="kpi-label">Auctions</div></div>
      </div>
    `
  }

  // Tab-specific content
  if (opts.tab === 'dashboard' || opts.tab === 'auctions') {
    content += '<h2>Auctions</h2>'
    content += buildAuctionsTable(opts.auctions, opts.currency)
  }

  if (opts.tab === 'dashboard' || opts.tab === 'events') {
    content += '<h2>Events</h2>'
    content += buildEventsTable(opts.events)
  }

  if (opts.tab === 'dashboard' || opts.tab === 'suppliers') {
    content += `<h2>Suppliers (${opts.suppliers.length})</h2>`
    content += buildSuppliersTable(opts.suppliers)

    // Add individual supplier detail pages (only for suppliers tab)
    if (opts.tab === 'suppliers') {
      content += '<h2 class="page-break">Supplier Profiles</h2>'
      const activeSuppliers = opts.suppliers.filter(s => s.lots_bid > 0).sort((a, b) => (a.profile_rank || 5) - (b.profile_rank || 5))
      activeSuppliers.forEach(s => {
        content += buildSupplierDetail(s)
      })
    }
  }

  if (opts.tab === 'savings') {
    content += '<h2>Auctions Detail</h2>'
    content += buildAuctionsTable(opts.auctions, opts.currency)
  }

  if (opts.tab === 'competition') {
    const english = opts.auctions.filter(a => a.type === 'reverse')
    const dutch = opts.auctions.filter(a => a.type === 'dutch')
    content += '<h2>English Auctions</h2>'
    content += buildAuctionsTable(english, opts.currency)
    content += '<h2>Dutch Auctions</h2>'
    content += buildAuctionsTable(dutch, opts.currency)
  }

  // Footer
  content += `
    <div class="footer">
      <span>Crown Procurement · Analyzer Report</span>
      <span>Generated ${now}</span>
    </div>
  `

  // Build full HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Analyzer Report — ${filterText} — ${now}</title>
  <style>${PAGE_STYLE}</style>
</head>
<body>${content}</body>
</html>`

  // Open and print
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.document.fonts.ready.then(() => { win.print() })
}
