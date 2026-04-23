import { Router } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// Get mock users for demo mapping
router.get('/demo', async (req, res) => {
  try {
    // Only return subset of fields for security in public match endpoint
    const { data, error } = await supabase
      .from('users')
      .select('user_id, username, display_name, mbti_type, age');

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
