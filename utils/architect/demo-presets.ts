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
    prices: number[]
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
    id: 'office',
    emoji: '📎',
    label: 'Office Supplies — Paper, Pens, Folders',
    suppliers: ['OfficeWorld', 'StatioPlus', 'ProOffice'],
    lots: [
      { name: 'Paper reams', unit: 'Boxes', qty: 500, pref: 1, intens: 25, prices: [22, 25, 20] },
      { name: 'Ballpoint pens', unit: 'Boxes', qty: 1000, pref: 2, intens: 55, prices: [18, 15, 21] },
      { name: 'Folders', unit: 'Boxes', qty: 200, pref: 1, intens: 40, prices: [85, 78, 92] },
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
