import { NextApiRequest, NextApiResponse } from 'next';
import createClient from '@/lib/supabase/apiAdmin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(req, res);

  if (req.method === 'DELETE') {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    const { id } = req.query;

    if (authError || !user) {
      return res.status(401).json({ error: 'Ошибка проверки доступа' });
    }

    if (user.user_metadata.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав доступа' });
    }

    if (!id) {
      return res.status(400).json({ error: 'ID пользователя не указан' });
    }

    const { error } = await supabase.auth.admin.deleteUser(id as string);

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ message: 'Пользователь удален' });
  }

  if (req.method === 'PUT') {
    const { email, first_name, last_name, password } = req.body;
    console.log(req.body)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res
        .status(401)
        .json({ error: 'Войдите в аккаунт перед запросом.' });
    }

    const { error } = await supabase.auth.updateUser({
      ...(email && { email }),
      ...(password && { password }),
      ...(first_name && { data: { first_name } }),
      ...(last_name && { data: { last_name } }),
    });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Пользователь обновлен' });
  }
}
