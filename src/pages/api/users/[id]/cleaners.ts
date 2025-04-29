import { NextApiRequest, NextApiResponse } from 'next';
import createClient from '@/lib/supabase/apiAdmin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(req, res);

  if (req.method === 'GET') {
    const { id: userId } = req.query;

    if (!userId)
      return res.status(400).json({ error: 'ID пользователя не указан' });

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'cleaner')
      .eq('related_to', userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { id: userId } = req.query;

    if (!userId)
      return res.status(400).json({ error: 'ID пользователя не указан' });

    const { email } = req.body;

    if (!email) return res.status(400).json({ error: 'Email не указан' });

    const { data: cleaner, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'cleaner')
      .eq('email', email)
      .single();

    if (error) {
      return res
        .status(500)
        .json({ error: 'Ошибка при поиске уборщика', details: error.message });
    }

    if (!cleaner) {
      return res.status(404).json({ error: 'Уборщик с таким email не найден' });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      cleaner.id,
      { user_metadata: { related_to: userId } }
    );
    if (updateError) {
      return res.status(500).json({
        error: 'Ошибка при обновлении данных',
        details: updateError.message,
      });
    }

    return res
      .status(201)
      .json({ message: 'Уборщик успешно связан с пользователем' });
  }

  return res.status(405).json({ error: 'Данный метод API не существует.' });
}
