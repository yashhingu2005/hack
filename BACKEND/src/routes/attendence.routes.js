// src/routes/attendance.routes.js
import express from 'express';
import { supabase } from '../supabase.js';
import { verifyToken } from '../utils/jwtHmac.js';

const router = express.Router();

/**
 * POST /api/attendance/checkin
 * body: { roll_no, session_id, token }
 */
router.post('/checkin', async (req, res) => {
  try {
    const { roll_no, session_id, token } = req.body;
    if (!roll_no || !session_id || !token) return res.status(400).json({ error: 'missing_fields' });

    // fetch session by id
    const { data: session, error } = await supabase
      .from('attendance_sessions')
      .select('session_id, session_secret, active')
      .eq('session_id', session_id)
      .single();

    if (error || !session) return res.status(404).json({ error: 'session_not_found' });
    if (!session.active) return res.status(400).json({ error: 'session_not_active' });

    // verify token using session_secret
    const result = verifyToken(session.session_secret, token);
    if (!result.ok) return res.status(401).json({ error: 'invalid_token', reason: result.reason });

    const { payload } = result;
    // check session_id match and expiry
    if (payload.session_id !== session_id) return res.status(401).json({ error: 'token_session_mismatch' });

    const now = Date.now();
    if (now - payload.ts > (payload.ttl || 15000)) return res.status(400).json({ error: 'token_expired' });

    // check student exists
    const { data: student } = await supabase
      .from('students')
      .select('roll_no, name, class_id')
      .eq('roll_no', roll_no)
      .single();

    if (!student) return res.status(404).json({ error: 'student_not_found' });

    // prevent duplicate check-in for same session
    const { data: existing } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('session_id', session_id)
      .eq('roll_no', roll_no)
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'already_checked_in' });
    }

    // insert record
    const { data: inserted, error: insertErr } = await supabase
      .from('attendance_records')
      .insert([{ session_id, roll_no, verification_method: 'qr' }])
      .select()
      .single();

    if (insertErr) return res.status(500).json({ error: insertErr.message });
    return res.json({ status: 'ok', record: inserted });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server_error' });
  }
});

export default router;
