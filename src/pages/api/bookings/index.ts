import { NextApiRequest, NextApiResponse } from 'next';
import createClient from '@/lib/supabase/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(req, res);
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('bookings').select('*');

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
}
