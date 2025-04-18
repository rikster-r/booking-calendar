import { NextApiRequest, NextApiResponse } from 'next';
import createClient from '@/lib/supabase/apiAdmin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(req, res);
  if (req.method === 'GET') {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Ошибка проверки доступа' });
    }

    if (user.user_metadata.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав доступа' });
    }

    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data.users.filter((x) => x.id !== user.id));
  }

  if (req.method === 'DELETE') {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    const { ids } = req.body;

    if (authError || !user) {
      return res.status(401).json({ error: 'Ошибка проверки доступа' });
    }

    if (user.user_metadata.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав доступа' });
    }

    if (!ids || ids.length === 0) {
      return res.status(400).json({ error: 'ID пользователей не указан' });
    }

    const deletePromises = ids.map((id: string) =>
      supabase.auth.admin.deleteUser(id)
    );
    await Promise.allSettled(deletePromises);

    return res.status(200).json({ message: 'Пользователи удалены' });
  }

  if (req.method === 'POST') {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    const {
      email,
      password,
      firstName: first_name,
      lastName: last_name,
      role,
    } = req.body;

    if (authError || !user) {
      return res.status(401).json({ error: 'Ошибка проверки доступа' });
    }

    if (user.user_metadata.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав доступа' });
    }

    if (!email || !password || !first_name || !last_name || !role) {
      return res.status(400).json({ error: 'Указаны не все данные' });
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        email,
        first_name,
        last_name,
        role,
      },
      email_confirm: true,
    });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
}
