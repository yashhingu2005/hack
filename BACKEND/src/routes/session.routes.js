// src/routes/session.routes.js
import express from 'express';
import crypto from 'crypto';
import { supabase } from '../supabase.js';
import { makeToken } from '../utils/jwtHmac.js';

const router = express.Router();

/**
 * POST /api/session/start
 * body: { teacher_id, class_id, subject_id }
 * returns: { session_id }
 */
router.post('/start', async (req, res) => {
  try {
    const { teacher_id, class_id, subject_id } = req.body;
    if (!teacher_id || !class_id || !subject_id) return res.status(400).json({ error: 'missing_fields' });

    // create a per-session secret
    const session_secret = crypto.randomBytes(32).toString('hex');

    const { data, error } = await supabase
      .from('attendance_sessions')
      .insert([{ teacher_id, class_id, subject_id, session_secret, active: true }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ session_id: data.session_id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server_error' });
  }
});

/**
 * GET /api/session/:id/token
 * returns ephemeral token payload to embed in QR (valid for short time)
 * query param: ttl (seconds) optional, default 15
 */
router.get('/:id/token', async (req, res) => {
  try {
    const session_id = Number(req.params.id);
    const ttl = Number(req.query.ttl) || 15;

    const { data: session, error } = await supabase
      .from('attendance_sessions')
      .select('session_id, session_secret, active, teacher_id, class_id, subject_id')
      .eq('session_id', session_id)
      .single();

    if (error || !session) return res.status(404).json({ error: 'session_not_found' });
    if (!session.active) return res.status(400).json({ error: 'session_not_active' });

    const ts = Date.now();
    const payload = { session_id: session.session_id, ts, ttl };
    const token = makeToken(session.session_secret, payload);

    // Return minimal data for QR: token + expires_at
    return res.json({ token, expires_at: ts + ttl * 1000 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server_error' });
  }
});

export default router;
