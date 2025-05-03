import { NextApiRequest, NextApiResponse } from 'next';
import createClient from '@/lib/supabase/apiAdmin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(req, res);
  if (req.method === 'POST') {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res
        .status(401)
        .json({ error: 'Войдите в аккаунт перед запросом.' });
    }

    const { email, related_to } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Необходима эллектронная почта.' });
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      if (existingUser.role !== 'cleaner') {
        return res.status(400).json({
          error: 'Пользователь с данной почтой не является уборщиком.',
        });
      }

      if (existingUser.related_to === related_to) {
        return res.status(400).json({
          error: 'Пользователь с данной почтой уже добавлен к вам.',
        });
      }

      const { error } = await supabase.auth.updateUser({
        data: {
          related_to,
        },
      });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      // add update for public.users too
      const { error: publicError } = await supabase
        .from('users')
        .update({
          related_to,
        })
        .eq('id', existingUser.id);

      if (publicError) {
        return res.status(500).json({ error: publicError.message });
      }

      return res.status(200).json({ message: 'Уборщик добавлен к вам.' });
    } else {
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            role: 'cleaner',
            related_to: related_to ?? null,
            preferred_date_format: 'd MMMM yyyy',
            preferred_time_format: 'HH:mm',
            confirmItemDelete: true,
          },
          redirectTo: `${process.env.NEXT_PUBLIC_URL}/login/cleaners`,
        }
      );

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json(data);
    }
  }
}
