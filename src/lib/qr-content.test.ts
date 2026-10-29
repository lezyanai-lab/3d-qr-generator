import { describe, expect, it } from 'vitest'

import {
  normalizeUrl,
  whatsappDigits,
  whatsappLink,
  wifiString,
} from '@/lib/qr-content'

describe('normalizeUrl', () => {
  it('adds https:// to a bare domain and trims stray whitespace', () => {
    expect(normalizeUrl('  example.com\n')).toBe('https://example.com')
    expect(normalizeUrl('example.com:8080/menu')).toBe(
      'https://example.com:8080/menu',
    )
  })

  it('keeps anything that already has a scheme', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com')
    expect(normalizeUrl('https://example.com/a?b=1')).toBe(
      'https://example.com/a?b=1',
    )
    expect(normalizeUrl('mailto:me@example.com')).toBe('mailto:me@example.com')
    expect(normalizeUrl('tel:+972501234567')).toBe('tel:+972501234567')
  })

  it('leaves plain sentences alone and handles empty input', () => {
    expect(normalizeUrl('hello world')).toBe('hello world')
    expect(normalizeUrl('   ')).toBe('')
  })
})

describe('wifiString', () => {
  it('escapes special characters', () => {
    expect(wifiString('My;Net', 'pa:ss', 'WPA')).toBe(
      'WIFI:T:WPA;S:My\\;Net;P:pa\\:ss;;',
    )
  })

  it('omits the password for open networks', () => {
    expect(wifiString('Cafe', 'ignored', 'nopass')).toBe(
      'WIFI:T:nopass;S:Cafe;;',
    )
  })
})

describe('whatsappDigits', () => {
  it.each([
    ['972', '050-123-4567', '972501234567'], // local Israeli format
    ['972', '0501234567', '972501234567'],
    ['972', '501234567', '972501234567'], // trunk zero left off
    ['972', '+972 50 123 4567', '972501234567'],
    ['972', '+972 (0)50-123-4567', '972501234567'],
    ['972', '00972501234567', '972501234567'],
    ['972', '972501234567', '972501234567'], // country code without "+"
    ['1', '(415) 555-2671', '14155552671'],
    ['1', '14155552671', '14155552671'],
    ['44', '+44 7911 123456', '447911123456'],
    ['+972', '050-123-4567', '972501234567'], // "+" typed in the country box
  ])('country %s, number %s -> %s', (country, number, expected) => {
    expect(whatsappDigits(country, number)).toBe(expected)
  })

  it.each([
    ['972', ''],
    ['972', 'abc'],
    ['972', '123'],
    ['972', '0501234567890123456'], // longer than any real number
  ])('rejects country %s, number "%s"', (country, number) => {
    expect(whatsappDigits(country, number)).toBeNull()
  })
})

describe('whatsappLink', () => {
  it('builds a wa.me link with digits only', () => {
    expect(whatsappLink('972', '050-123-4567', '')).toBe(
      'https://wa.me/972501234567',
    )
  })

  it('encodes the optional message', () => {
    const message = 'שלום, מה נשמע? & more'
    expect(whatsappLink('972', '050-123-4567', `  ${message} `)).toBe(
      `https://wa.me/972501234567?text=${encodeURIComponent(message)}`,
    )
  })

  it('is empty while the number is not valid', () => {
    expect(whatsappLink('972', '12', 'hi')).toBe('')
  })
})
