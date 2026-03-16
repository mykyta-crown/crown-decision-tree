// ╔══════════════════════════════════════════════════════════════╗
// ║  DEMO PRESETS — TEST ONLY — REMOVE BEFORE PRODUCTION        ║
// ╚══════════════════════════════════════════════════════════════╝

export interface DemoPreset {
  id: string
  emoji: string
  label: string
  suppliers: string[]
  lots: Array<{
    name: string
    unit: string
    qty: number
    pref: number
    intens: number
    award?: number
    prices: number[]
    excl?: boolean[]
  }>
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'fruits',
    emoji: '🍌',
    label: 'Fruits — Bananas, Apples, Kiwis',
    suppliers: ['FruitCo', 'GreenMart', 'FreshProd', 'NaturalBio'],
    lots: [
      { name: 'Bananas', unit: 'Tonnes', qty: 100, pref: 1, intens: 35, prices: [420, 390, 455, 380] },
      { name: 'Apples', unit: 'Tonnes', qty: 200, pref: 2, intens: 60, prices: [680, 725, 650, 700] },
      { name: 'Kiwis', unit: 'Tonnes', qty: 400, pref: 1, intens: 80, prices: [1100, 980, 1050, 1020] },
    ],
  },
  {
    id: 'computers',
    emoji: '💻',
    label: 'Computers — Laptops, Monitors, Mice, Keyboards',
    suppliers: ['TechCorp', 'CompuMax', 'DigitPro', 'SmartTech', 'GlobalIT'],
    lots: [
      { name: 'Laptops', unit: 'Units', qty: 2000, pref: 3, intens: 70, prices: [850, 920, 880, 800, 950] },
      { name: 'Monitors', unit: 'Units', qty: 4000, pref: 2, intens: 50, prices: [310, 290, 325, 280, 305] },
      { name: 'Mice', unit: 'Units', qty: 2000, pref: 1, intens: 30, prices: [28, 32, 25, 30, 27] },
      { name: 'Keyboards', unit: 'Units', qty: 2000, pref: 1, intens: 45, prices: [45, 52, 48, 40, 55] },
    ],
  },
  {
    id: 'transport',
    emoji: '🚛',
    label: 'Transport — Paris routes, containers',
    suppliers: ['TransLog', 'RouteExpress', 'FreightPro', 'CargoFast'],
    lots: [
      { name: 'Paris — Marseille', unit: 'Containers', qty: 1000, pref: 1, intens: 55, award: 1, prices: [1250, 1320, 1180, 1290] },
      { name: 'Paris — Toulon',    unit: 'Containers', qty: 2000, pref: 1, intens: 55, award: 1, prices: [1380, 1460, 1300, 1420] },
      { name: 'Paris — Lille',     unit: 'Containers', qty: 3000, pref: 1, intens: 55, award: 1, prices: [510, 490, 545, 525] },
      { name: 'Paris — Lyon',      unit: 'Containers', qty: 1500, pref: 1, intens: 55, award: 1, prices: [820, 860, 790, 840] },
    ],
  },
  {
    id: 'capex',
    emoji: '🏭',
    label: 'Capex — Production line',
    suppliers: ['IndustrialSys', 'FabriTech', 'ManuPro'],
    lots: [
      { name: 'Production Line', unit: 'Unit', qty: 1, pref: 1, intens: 25, award: 1, prices: [2850000, 3050000, 2960000] },
    ],
  },
  {
    id: 'consulting',
    emoji: '📊',
    label: 'Consulting — Audit & Roadmap (PwC, KPMG, EY)',
    suppliers: ['PwC', 'KPMG', 'EY'],
    lots: [
      // All 3 firms respond to the audit
      { name: 'Strategic Audit',        unit: 'Mission', qty: 1, pref: 1, intens: 70, award: 2, prices: [1100000, 1380000, 1250000] },
      // EY cannot respond to the implementation lot (conflict of interest)
      { name: 'Implementation Roadmap', unit: 'Mission', qty: 1, pref: 1, intens: 70, award: 2, prices: [1750000, 2100000, 0], excl: [false, false, true] },
    ],
  },
  {
    id: 'construction',
    emoji: '🏗️',
    label: 'Construction — Structural, Facade, Electrical',
    suppliers: ['BTP Construct', 'SolBâtiment', 'TravauxPro', 'CivilBuild', 'EuroBâti'],
    lots: [
      { name: 'Structural Works',    unit: 'Lump sum', qty: 1, pref: 1, intens: 60, award: 1, prices: [850000, 920000, 780000, 870000, 910000] },
      { name: 'Facade & Insulation', unit: 'Lump sum', qty: 1, pref: 1, intens: 60, award: 1, prices: [320000, 380000, 340000, 295000, 360000] },
      { name: 'Electrical Networks', unit: 'Lump sum', qty: 1, pref: 1, intens: 60, award: 1, prices: [180000, 210000, 195000, 175000, 205000] },
    ],
  },
  {
    id: 'supplies',
    emoji: '🗄️',
    label: 'General Supplies — 6 lots',
    suppliers: ['FourniPro', 'EquipPlus', 'MateriMax', 'DistribAll'],
    lots: [
      { name: 'Printer paper A4', unit: 'Pallets', qty: 120, pref: 1, intens: 30, prices: [185, 198, 175, 192] },
      { name: 'Ink cartridges', unit: 'Units', qty: 800, pref: 2, intens: 65, prices: [42, 38, 45, 40] },
      { name: 'Cleaning products', unit: 'Boxes', qty: 300, pref: 1, intens: 40, prices: [56, 62, 53, 59] },
      { name: 'Envelopes', unit: 'Boxes', qty: 1500, pref: 1, intens: 20, prices: [12, 14, 11, 13] },
      { name: 'Protective gloves', unit: 'Boxes', qty: 600, pref: 2, intens: 50, prices: [28, 32, 26, 30] },
      { name: 'Trash bags', unit: 'Rolls', qty: 2000, pref: 1, intens: 35, prices: [8, 9, 7, 10] },
    ],
  },
]
