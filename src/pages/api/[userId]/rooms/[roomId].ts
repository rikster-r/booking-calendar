import { NextApiRequest, NextApiResponse } from 'next';
import createClient from '@/lib/supabase/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(req, res);
  if (req.method === 'DELETE') {
    const { roomId: room_id } = req.query;

    if (!room_id) return res.status(400).json({ error: 'Некорректный айди.' });

    const { error } = await supabase.from('rooms').delete().eq('id', room_id);

    if (error) return res.status(500).json({ error: error.message });
    return res
      .status(200)
      .json({ message: `Успешно удалено помещение ${room_id}` });
  }

  if (req.method === 'PUT') {
    const { roomId: room_id } = req.query;
    const { name, color, status } = req.body;

    if (!room_id) {
      return res.status(400).json({ error: 'Некорректный айди' });
    }

    if (!name || !color || !status) {
      return res
        .status(400)
        .json({ error: 'Не все обязательные поля заполнены' });
    }

    const { data, error } = await supabase
      .from('rooms')
      .update({ name, color, status })
      .eq('id', room_id)
      .select();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.status(405).json({ error: 'Данный метод API не существует.' });
}
