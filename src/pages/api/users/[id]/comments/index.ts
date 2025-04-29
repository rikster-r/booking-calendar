import { NextApiRequest, NextApiResponse } from 'next';
import createClient from '@/lib/supabase/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(req, res);

  if (req.method === 'POST') {
    const { id: user_id } = req.query;
    const { text, room_id, author_id } = req.body;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Ошибка проверки доступа' });
    }

    if (!user_id) {
      return res.status(400).json({ error: 'Некорректный ID пользователя.' });
    }

    if (!text || !room_id || !author_id) {
      return res
        .status(400)
        .json({ error: 'Не все обязательные поля заполнены' });
    }

    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          author_id,
          room_id,
          text,
        },
      ])
      .select();
    if (error) {
      return res.status(500).json({ error });
    }

    return res.status(201).json(data);
  }

  if (req.method === 'GET') {
    const { id: user_id } = req.query;

    const { data, error } = await supabase
      .from('comments')
      .select(
        `*,
      room:room_id (
        user_id,
        owner:user_id (
          id
        )
      ),
      author:author_id (
        first_name,
        last_name
      )`
      )
      .eq('room.user_id', user_id);

    if (error) {
      return res.status(500).json({ error });
    }

    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Данный метод API не существует.' });
}
