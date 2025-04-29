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
    const {
      email,
      first_name,
      last_name,
      password,
      role,
      related_to,
      preferred_date_format,
      preferred_time_format,
      confirmItemDelete,
    } = req.body;
    const { id: userId } = req.query;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res
        .status(401)
        .json({ error: 'Войдите в аккаунт перед запросом.' });
    }

    if (role) {
      if (user.user_metadata.role !== 'admin') {
        return res.status(403).json({ error: 'Недостаточно прав доступа' });
      }

      if (!['admin', 'client', 'cleaner'].includes(role)) {
        return res.status(400).json({ error: 'Указана некорректная роль' });
      }

      if (!userId)
        return res.status(400).json({ error: 'ID пользователя не указан' });

      const { data: userToChange, error: fetchError } =
        await supabase.auth.admin.getUserById(userId as string);
      if (fetchError || !userToChange.user) {
        return res
          .status(404)
          .json({ error: 'Пользователь с таким айди не был найден' });
      }

      // Update user metadata with new role
      const { data, error } = await supabase.auth.admin.updateUserById(
        userId as string,
        {
          user_metadata: { role },
        }
      );

      if (error) {
        return res
          .status(500)
          .json({ error: 'Ошибка сервера при изменении роли' });
      }

      return res.status(200).json({
        message: `Роль успешно изменена`,
        user: data,
      });
    } else {
      const { error } = await supabase.auth.admin.updateUserById(
        userId as string,
        {
          ...(email && { email }),
          ...(password && { password }),
          ...(first_name ||
          last_name ||
          related_to !== undefined ||
          preferred_date_format ||
          preferred_time_format ||
          confirmItemDelete !== undefined
            ? {
                user_metadata: {
                  ...(first_name && { first_name }),
                  ...(last_name && { last_name }),
                  ...(related_to !== undefined && { related_to }),
                  ...(preferred_date_format && { preferred_date_format }),
                  ...(preferred_time_format && { preferred_time_format }),
                  ...(confirmItemDelete !== undefined && { confirmItemDelete }),
                },
              }
            : {}),
        }
      );

      // add update for public.users too
      const { error: publicError } = await supabase
        .from('users')
        .update({
          ...(email && { email }),
          ...(first_name && { first_name }),
          ...(last_name && { last_name }),
          ...(related_to !== undefined && { related_to }),
          ...(preferred_date_format && { preferred_date_format }),
          ...(preferred_time_format && { preferred_time_format }),
          ...(confirmItemDelete !== undefined && { confirmItemDelete }),
        })
        .eq('id', userId);

      if (publicError) {
        return res.status(500).json({ error: publicError.message });
      }

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ message: 'Пользователь обновлен' });
    }
  }

  return res.status(405).json({ error: 'Данный метод API не существует.' });
}
