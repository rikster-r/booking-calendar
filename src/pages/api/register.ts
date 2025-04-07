import { NextApiRequest, NextApiResponse } from 'next';
import createClient from '@/lib/supabase/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(req, res);
  if (req.method === 'POST') {
    const {
      email,
      password,
      firstName: first_name,
      lastName: last_name,
    } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res
        .status(400)
        .json({ error: 'Не все обязательные поля заполнены' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name, last_name, role: 'client' } },
    });

    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json(data);
  }

  res.status(405).json({ error: 'Данный метод API не существует.' });
}
