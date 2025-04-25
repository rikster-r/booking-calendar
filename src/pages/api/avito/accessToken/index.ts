import { NextApiRequest, NextApiResponse } from 'next';
import createClient from '@/lib/supabase/api';
import { encrypt } from '@/lib/encrypt';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(req, res);

  if (req.method === 'POST') {
    const { avitoCode, userId } = req.body;

    if (!avitoCode || !userId) {
      return res.status(400).json({ error: 'Отсутствует код авторизации' });
    }

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append(
      'client_id',
      process.env.NEXT_PUBLIC_AVITO_CLIENT_ID as string
    );
    params.append('client_secret', process.env.AVITO_CLIENT_SECRET as string);
    params.append('code', avitoCode as string);

    const avitoRes = await fetch('https://api.avito.ru/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await avitoRes.json();

    if (!avitoRes.ok) {
      return res.status(avitoRes.status).json({ error: data });
    }

    const { data: accessTokenData, error } = await supabase
      .from('avito_access_tokens')
      .insert([
        {
          user_id: userId,
          access_token: encrypt(data.access_token),
          expires_in: data.expires_in,
          scope: data.scope,
          refresh_token: encrypt(data.refresh_token),
          token_type: data.token_type,
        },
      ]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(accessTokenData);
  }

  if (req.method === 'GET') {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res
        .status(401)
        .json({ error: 'Войдите в аккаунт перед запросом' });
    }

    const { data: tokenData, error } = await supabase
      .from('avito_access_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(tokenData);
  }
}
