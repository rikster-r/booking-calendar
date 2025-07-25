import { NextApiRequest, NextApiResponse } from 'next';
import createClient from '@/lib/supabase/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(req, res);
  if (req.method === 'POST') {
    try {
      const {
        email,
        password,
        firstName: first_name,
        lastName: last_name,
        role,
      } = req.body;

      if (!email || !password || !first_name || !last_name || !role) {
        return res
          .status(400)
          .json({ error: 'Не все обязательные поля заполнены' });
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name,
            last_name,
            role,
            related_to: null,
            preferred_date_format: 'd MMMM yyyy',
            preferred_time_format: 'HH:mm',
            confirmItemDelete: true,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return res.status(201).json(data);
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: (error as Error).message || 'Internal Server Error' });
    }
  }

  res.status(405).json({ error: 'Данный метод API не существует.' });
}
