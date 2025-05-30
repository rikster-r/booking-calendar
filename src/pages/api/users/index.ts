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

    const { page = 1, pageSize = 50, search = '' } = req.query;

    const query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .neq('id', user.id);

    if (search) {
      const searchTerms = (search as string)
        .split(' ')
        .map((term) => `%${term}%`);
      query.or(
        searchTerms
          .map((term) =>
            ['email', 'first_name', 'last_name']
              .map((field) => `${field}.ilike.${term}`)
              .join(',')
          )
          .join(',')
      );
    }

    const {
      data: users,
      error,
      count,
    } = await query.range(
      (Number(page) - 1) * Number(pageSize),
      Number(page) * Number(pageSize) - 1
    );

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      users,
      total: count,
    });
  }

  if (req.method === 'DELETE') {
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

    const { ids } = req.body;
    if (!ids || ids.length === 0) {
      return res.status(400).json({ error: 'ID пользователей не указан' });
    }

    // Delete users in parallel and await for completion
    const deletePromises = ids.map((id: string) =>
      supabase.auth.admin.deleteUser(id)
    );
    try {
      await Promise.all(deletePromises); // Parallel deletion
      return res.status(200).json({ message: 'Пользователи удалены' });
    } catch (error) {
      return res
        .status(500)
        .json({ error: error || 'Ошибка при удалении пользователей' });
    }
  }

  if (req.method === 'POST') {
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

    const {
      email,
      password,
      firstName: first_name,
      lastName: last_name,
      role,
    } = req.body;
    if (!email || !password || !first_name || !last_name || !role) {
      return res.status(400).json({ error: 'Указаны не все данные' });
    }

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          email,
          first_name,
          last_name,
          role,
          related_to: null,
          preferred_date_format: 'd MMMM yyyy',
          preferred_time_format: 'HH:mm',
          confirmItemDelete: true,
        },
        email_confirm: true,
      });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json(data);
    } catch (error) {
      return res
        .status(500)
        .json({ error: error || 'Ошибка при создании пользователя' });
    }
  }

  return res.status(405).json({ error: 'Данный метод API не существует.' });
}
