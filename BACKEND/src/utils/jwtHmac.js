// src/utils/jwtHmac.js
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

export function makeToken(sessionSecret, payload) {
  // payload: object (will include ts)
  const data = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', sessionSecret).update(data).digest('hex');
  return Buffer.from(`${Buffer.from(data).toString('base64')}.${signature}`).toString('base64');
}

export function verifyToken(sessionSecret, token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const [dataB64, signature] = decoded.split('.');
    const dataJSON = Buffer.from(dataB64, 'base64').toString();
    const expected = crypto.createHmac('sha256', sessionSecret).update(dataJSON).digest('hex');
    if (expected !== signature) return { ok: false, reason: 'invalid_signature' };
    return { ok: true, payload: JSON.parse(dataJSON) };
  } catch (err) {
    return { ok: false, reason: 'malformed_token' };
  }
}
