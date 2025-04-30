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
    } else if (email) {
      // Check if the email is already taken
      const { data: existingUser, error: emailCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (emailCheckError && emailCheckError.code !== 'PGRST116') {
        return res
          .status(500)
          .json({ error: 'Ошибка сервера при изменении почты.' });
      }

      if (existingUser && existingUser.id !== userId) {
        return res
          .status(400)
          .json({ error: 'Почта уже используется другим пользователем.' });
      }

      // Update the user's email
      const { error: emailUpdateError } = await supabase.auth.updateUser({
        email,
        data: {
          email,
        },
      });

      if (emailUpdateError) {
        return res.status(500).json({ error: emailUpdateError.message });
      }

      // Update the email in the public.users table
      const { error: publicEmailUpdateError } = await supabase
        .from('users')
        .update({ email })
        .eq('id', userId);

      if (publicEmailUpdateError) {
        return res.status(500).json({ error: publicEmailUpdateError.message });
      }

      return res.status(200).json({ message: 'Email успешно обновлен' });
    } else {
      const { error } = await supabase.auth.updateUser({
        data: {
          ...(first_name && { first_name }),
          ...(last_name && { last_name }),
          ...(related_to !== undefined && { related_to }),
          ...(preferred_date_format && { preferred_date_format }),
          ...(preferred_time_format && { preferred_time_format }),
          ...(confirmItemDelete !== undefined && { confirmItemDelete }),
        },
      });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

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

      return res.status(200).json({ message: 'Пользователь обновлен' });
    }
  }

  return res.status(405).json({ error: 'Данный метод API не существует.' });
}
