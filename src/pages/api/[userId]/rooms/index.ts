import { NextApiRequest, NextApiResponse } from 'next';
import createClient from '@/lib/supabase/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(req, res);
  if (req.method === 'GET') {
    const { userId: user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'Некорректный ID пользователя' });
    }

    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { userId: user_id } = req.query;
    const { name, color, status } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'Некорректный айди' });
    }

    if (!name || !color || !status) {
      return res
        .status(400)
        .json({ error: 'Не все обязательные поля заполнены' });
    }

    const { data, error } = await supabase
      .from('rooms')
      .insert([{ name, color, status, user_id }]);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.status(405).json({ error: 'Данный метод API не существует.' });
}
