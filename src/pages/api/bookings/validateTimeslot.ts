import { NextApiRequest, NextApiResponse } from 'next';
import createClient from '@/lib/supabase/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(req, res);
  if (req.method === 'POST') {
    const { id, room_id, check_in, check_out } = req.body;

    if (!room_id || !check_in || !check_out) {
      return res.status(400).json({ error: 'Некорректные данные' });
    }

    let query = supabase
      .from('bookings')
      .select('*')
      .or(`and(check_in.lte.${check_out}, check_out.gte.${check_in})`)
      .eq('room_id', room_id);

    if (id) {
      query = query.neq('id', id);
    }

    const { data: existingBookings, error: existingBookingsError } =
      await query;

    if (existingBookingsError) {
      return res.status(500).json({ error: existingBookingsError.message });
    }

    if (existingBookings && existingBookings.length > 0) {
      return res
        .status(409)
        .json({ error: 'Временной слот уже занят другой бронью.' });
    }

    return res.status(200).json({ message: 'Слот доступен' });
  }

  res.status(405).json({ error: 'Данный метод API не существует.' });
}
