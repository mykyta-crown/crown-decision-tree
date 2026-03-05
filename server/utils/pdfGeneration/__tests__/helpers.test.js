/**
 * Tests for PDF Generation Helpers
 *
 * Run with: npm test helpers.test.js
 */

import { describe, it, expect } from 'vitest'
import { getAuctionStatus, validateAuctionData, validateImagesData } from '../helpers.js'
import dayjs from 'dayjs'

describe('getAuctionStatus', () => {
  it('should return closed status for past sealed-bid auctions', () => {
    const startAt = dayjs().subtract(2, 'days').toISOString()
    const endAt = dayjs().subtract(1, 'day').toISOString()

    const result = getAuctionStatus(startAt, endAt, 'sealed-bid')

    expect(result.label).toBe('closed')
    expect(result.color).toBe('sky')
  })

  it('should return active status for ongoing sealed-bid auctions', () => {
    const startAt = dayjs().subtract(1, 'day').toISOString()
    const endAt = dayjs().add(1, 'day').toISOString()

    const result = getAuctionStatus(startAt, endAt, 'sealed-bid')

    expect(result.label).toBe('active')
    expect(result.color).toBe('grass')
  })

  it('should return upcoming status for future auctions', () => {
    const startAt = dayjs().add(1, 'day').toISOString()
    const endAt = dayjs().add(2, 'days').toISOString()

    const result = getAuctionStatus(startAt, endAt)

    expect(result.label).toBe('upcoming')
    expect(result.color).toBe('yellow')
  })

  it('should return active status for ongoing regular auctions', () => {
    const startAt = dayjs().subtract(1, 'day').toISOString()
    const endAt = dayjs().add(1, 'day').toISOString()

    const result = getAuctionStatus(startAt, endAt)

    expect(result.label).toBe('active')
    expect(result.color).toBe('grass')
  })
})

describe('validateAuctionData', () => {
  it('should throw error when auction is missing', () => {
    expect(() => validateAuctionData(null)).toThrow('Auction data is missing')
  })

  it('should throw error when auction ID is missing', () => {
    const auction = { name: 'Test Auction' }
    expect(() => validateAuctionData(auction)).toThrow('Auction ID is missing')
  })

  it('should return true for valid auction data', () => {
    const auction = { id: '123', name: 'Test Auction' }
    expect(validateAuctionData(auction)).toBe(true)
  })
})

describe('validateImagesData', () => {
  it('should throw error when images is not an array', () => {
    expect(() => validateImagesData(null)).toThrow('Images must be an array')
    expect(() => validateImagesData('not-array')).toThrow('Images must be an array')
  })

  it('should throw error when images array is empty', () => {
    expect(() => validateImagesData([])).toThrow('No image data provided')
  })

  it('should throw error when image is missing data', () => {
    const images = [{ title: 'Test' }]
    expect(() => validateImagesData(images)).toThrow('Image 0 is missing data')
  })

  it('should throw error when image data format is invalid', () => {
    const images = [{ data: 'invalid-format' }]
    expect(() => validateImagesData(images)).toThrow('Image 0 has invalid data format')
  })

  it('should return true for valid images', () => {
    const images = [
      {
        title: 'Test Image',
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      }
    ]
    expect(validateImagesData(images)).toBe(true)
  })
})
