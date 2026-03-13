/**
 * Unit tests for Decision Tree SVG chart components.
 *
 * These tests verify structural correctness of the SVG templates:
 * - Bar widths are consistent across all steps
 * - Axis lines are rendered AFTER bars (SVG z-order: later = on top)
 * - Annotation positions don't overlap bar columns
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const CHARTS_DIR = resolve(__dirname, '../../components/architect/calculator/charts')

function readChart(name: string): string {
  return readFileSync(resolve(CHARTS_DIR, name), 'utf-8')
}

/** Extract all rect width attributes from a SVG template string */
function extractBarWidths(template: string): number[] {
  const matches = [...template.matchAll(/<rect[^>]+width="(\d+)"[^>]*>/g)]
  return matches.map(m => parseInt(m[1], 10))
}

/** Return position (index in string) of the x-axis line */
function axisLinePos(template: string): number {
  // X-axis: horizontal line at y1="185"
  const match = template.match(/x1="38" y1="185" x2="\d+" y2="185"/)
  return match ? template.indexOf(match[0]) : -1
}

/** Return position of the last bar area rect */
function lastBarAreaPos(template: string): number {
  let last = -1
  const re = /<rect[^>]+height="\d+"[^>]*>/g
  let m
  while ((m = re.exec(template)) !== null) {
    last = m.index
  }
  return last
}

// ─── ChartDutch ──────────────────────────────────────────────────────────────

describe('ChartDutch.vue', () => {
  const template = readChart('ChartDutch.vue')

  it('all active step area rects have the same width (28px)', () => {
    // The 5 active bars + 2 future bars — all should be width=28
    const stepRects = [...template.matchAll(/<rect class="(?:area-s\d|future-du)"[^>]+width="(\d+)"/g)]
    expect(stepRects.length).toBe(7)
    const widths = stepRects.map(m => parseInt(m[1], 10))
    const unique = [...new Set(widths)]
    expect(unique).toEqual([28])
  })

  it('S6 and S7 step top lines have the same width as active steps (28px)', () => {
    // S6: x1=208 → x2=236 (28px), S7: x1=240 → x2=268 (28px)
    const s6 = template.match(/x1="208" y1="63"\s+x2="(\d+)"/)
    const s7 = template.match(/x1="240" y1="42"\s+x2="(\d+)"/)
    expect(s6).not.toBeNull()
    expect(s7).not.toBeNull()
    expect(parseInt(s6![1]) - 208).toBe(28)
    expect(parseInt(s7![1]) - 240).toBe(28)
  })

  it('x-axis line is rendered AFTER all bar area rects (SVG z-order)', () => {
    const axisPos = axisLinePos(template)
    const lastBar = lastBarAreaPos(template)
    expect(axisPos).toBeGreaterThan(-1)
    expect(lastBar).toBeGreaterThan(-1)
    expect(axisPos).toBeGreaterThan(lastBar)
  })

  it('"rises" annotation x-position has at least 6px gap from S7 right edge (x=268)', () => {
    // S7 ends at x=268 (x=240 + width=28); annotation should be > 268+6
    const annMatch = template.match(/<text[^>]+class="ann">rises<\/text>/)
    expect(annMatch).not.toBeNull()
    const xMatch = annMatch![0].match(/x="(\d+)"/)
    expect(xMatch).not.toBeNull()
    const annotationX = parseInt(xMatch![1])
    expect(annotationX).toBeGreaterThan(274) // 268 + 6px minimum
  })

  it('active step area widths match their step top line widths', () => {
    // Every active step top: x2 - x1 should equal 28
    const tops = [...template.matchAll(/class="top-s\d"[^>]+x1="(\d+)"[^>]+x2="(\d+)"/g)]
    expect(tops.length).toBe(5)
    for (const [, x1, x2] of tops) {
      expect(parseInt(x2) - parseInt(x1)).toBe(28)
    }
  })
})

// ─── ChartDoubleScenario ─────────────────────────────────────────────────────

describe('ChartDoubleScenario.vue', () => {
  const template = readChart('ChartDoubleScenario.vue')

  it('active step areas and future step area have the same width (30px)', () => {
    // ds-area-s1, ds-area-s2, future-ds area should all have the same width
    const stepRects = [
      ...template.matchAll(/<rect[^>]+(?:ds-area-s\d|future-ds)[^>]+width="(\d+)"/g),
    ]
    expect(stepRects.length).toBeGreaterThan(0)
    const widths = stepRects.map(m => parseInt(m[1], 10))
    const unique = [...new Set(widths)]
    expect(unique.length).toBe(1)
  })
})

// ─── ChartJapanese ───────────────────────────────────────────────────────────

describe('ChartJapanese.vue', () => {
  const template = readChart('ChartJapanese.vue')

  it('active round step lines and future round lines have consistent x-span', () => {
    // Active rounds use class="step-r1"…"step-r5"
    // R1: x1=46 x2=76 → span=30, etc. — all should be equal
    const activeRounds = [...template.matchAll(/class="step-r[1-5]"\s+x1="(\d+)"\s+[^>]*x2="(\d+)"/g)]
    expect(activeRounds.length).toBe(5)
    const activeSpans = activeRounds.map(([, x1, x2]) => parseInt(x2) - parseInt(x1))
    const uniqueActive = [...new Set(activeSpans)]
    expect(uniqueActive.length).toBe(1)
    const expectedSpan = uniqueActive[0]

    // Future step lines are horizontal (y1 == y2) with class="future-jp"
    const futureLines = [...template.matchAll(/class="future-jp"\s+x1="(\d+)"\s+y1="(\d+)"\s+x2="(\d+)"\s+y2="(\d+)"/g)]
    const futureSteps = futureLines.filter(([, , y1, , y2]) => y1 === y2)
    expect(futureSteps.length).toBe(2)
    for (const [, x1, , x2] of futureSteps) {
      expect(parseInt(x2) - parseInt(x1)).toBe(expectedSpan)
    }
  })
})
