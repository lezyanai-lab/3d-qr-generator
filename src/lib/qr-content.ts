/** Turns what the user typed into the exact string that goes inside the QR code. */

/** Default country code for local numbers such as 050-123-4567 (Israel). */
export const DEFAULT_COUNTRY_CODE = '972'

const KNOWN_SCHEME =
  /^(?:[a-z][a-z0-9+.-]*:\/\/|(?:mailto|tel|sms|smsto|geo|wifi|whatsapp|matmsg|market|skype|facetime):)/i

/**
 * Cleans a pasted link: trims stray spaces/newlines (they silently break the link
 * once printed) and adds https:// when the scheme is missing, so "example.com"
 * opens as a website instead of showing up as plain text. Anything with spaces is
 * left alone, because then it is not a link.
 */
export function normalizeUrl(raw: string): string {
  const v = raw.trim()
  if (!v || /\s/.test(v) || KNOWN_SCHEME.test(v)) return v
  return `https://${v}`
}

export function wifiString(ssid: string, password: string, security: string) {
  const esc = (v: string) => v.replace(/([\\;,:"])/g, '\\$1')
  if (security === 'nopass') return `WIFI:T:nopass;S:${esc(ssid)};;`
  return `WIFI:T:${security};S:${esc(ssid)};P:${esc(password)};;`
}

/**
 * Phone number in the international form WhatsApp expects (digits only, country
 * code first, no +, no leading zeros), or null when it cannot be a real number.
 *
 * Accepts: 050-123-4567 (local, uses `country`), +972 50 123 4567, 00972501234567,
 * 972501234567 and "+972 (0)50 123 4567".
 */
export function whatsappDigits(country: string, number: string): string | null {
  const raw = number.replace(/\(0\)/g, '').trim()
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null
  const cc = country.replace(/\D/g, '').replace(/^0+/, '')

  let full: string
  if (raw.startsWith('+')) full = digits
  else if (digits.startsWith('00')) full = digits.slice(2)
  else if (digits.startsWith('0')) full = cc + digits.replace(/^0+/, '')
  else if (cc && digits.startsWith(cc) && digits.length - cc.length >= 8)
    full = digits // already has the country code, just typed without "+"
  else full = cc + digits

  return /^[1-9]\d{7,14}$/.test(full) ? full : null
}

/** https://wa.me/<number>?text=<message>, or '' while the number is not valid. */
export function whatsappLink(
  country: string,
  number: string,
  message: string,
): string {
  const digits = whatsappDigits(country, number)
  if (!digits) return ''
  const text = message.trim()
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}
