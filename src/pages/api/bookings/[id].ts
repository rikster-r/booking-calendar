import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!id) return res.status(400).json({ error: 'Некорректный айди.' });

    const { error } = await supabase.from('bookings').delete().eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: `Успешно удалена бронь ${id}` });
  }

  res.status(405).json({ error: 'Данный метод API не существует.' });
}
