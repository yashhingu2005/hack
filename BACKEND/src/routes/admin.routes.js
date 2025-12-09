// src/routes/admin.routes.js
import express from 'express';
import { supabase } from '../supabase.js';
const router = express.Router();

/**
 * POST /api/admin/student
 * body: { roll_no, name, class_id }
 */
router.post('/student', async (req, res) => {
  try {
    const { roll_no, name, class_id } = req.body;
    if (!roll_no || !name || !class_id) return res.status(400).json({ error: 'missing_fields' });

    const { data, error } = await supabase.from('students').insert([{ roll_no, name, class_id }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ status: 'ok', student: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server_error' });
  }
});

export default router;
