import crypto from 'node:crypto'

const TOKEN_TTL = 7 * 24 * 60 * 60 * 1000
const secret = process.env.JWT_SECRET

if (!secret) {
  throw new Error('JWT_SECRET is required')
}

export const createToken = (userId) => {
  const payload = `${userId}.${Date.now() + TOKEN_TTL}`
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return `${Buffer.from(payload).toString('base64url')}.${signature}`
}

export const getUserId = (token) => {
  try {
    const [encodedPayload, signature] = token.split('.')
    const payload = Buffer.from(encodedPayload, 'base64url').toString()
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    if (!signature || signature.length !== expected.length ||
        !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
    const [userId, expiresAt] = payload.split('.')
    return Date.now() < Number(expiresAt) ? userId : null
  } catch {
    return null
  }
}
