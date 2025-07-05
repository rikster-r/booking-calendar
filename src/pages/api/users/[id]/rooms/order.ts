import { NextApiRequest, NextApiResponse } from 'next';
import createClient from '@/lib/supabase/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Метод не разрешен' });

  const supabase = createClient(req, res);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ error: 'Войдите в аккаунт перед запросом' });
  }

  const { rooms } = req.body;

  if (!Array.isArray(rooms)) {
    return res.status(400).json({ error: 'Неверный формат данных' });
  }

  try {
    const updates = rooms.map(({ id, order }: { id: number; order: number }) =>
      supabase.from('rooms').update({ order }).eq('id', id)
    );

    const results = await Promise.all(updates);

    const hasError = results.some((result) => result.error);

    if (hasError) {
      console.error('One or more room reorders failed', results);
      return res
        .status(500)
        .json({ error: 'Ошибка сервера при изменении порядка комнат' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: 'Ошибка сервера при изменении порядка комнат' });
  }
}
