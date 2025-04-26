import { NextApiRequest, NextApiResponse } from 'next';
import createClient from '@/lib/supabase/api';
import { decrypt, encrypt } from '@/lib/encrypt';
import { addSeconds, isAfter, parseISO } from 'date-fns';

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

    const avitoUserRes = await fetch(
      'https://api.avito.ru/core/v1/accounts/self',
      {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      }
    );

    if (!avitoUserRes.ok)
      return res.status(500).json({ error: 'Не удалось добавить интеграцию.' });

    const userData = await avitoUserRes.json();

    const { data: accessTokenData, error } = await supabase
      .from('avito_access_tokens')
      .insert([
        {
          user_id: userId,
          avito_user_id: userData.id,
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
    const { user_id } = req.query;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user_id && (authError || !user)) {
      return res
        .status(401)
        .json({ error: 'Войдите в аккаунт перед запросом' });
    }

    let { data: tokenData, error: tokenError } = await supabase
      .from('avito_access_tokens')
      .select('*')
      .eq('user_id', user?.id ?? user_id)
      .single();

    if (tokenError) return res.status(500).json({ error: tokenError.message });

    const createdAt = parseISO(tokenData.created_at);
    const expiresAt = addSeconds(createdAt, tokenData.expires_in);
    const isExpired = isAfter(new Date(), expiresAt);

    if (!isExpired) {
      return res.status(200).json(tokenData);
    }

    // refresh token if expired
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append(
      'client_id',
      process.env.NEXT_PUBLIC_AVITO_CLIENT_ID as string
    );
    params.append('client_secret', process.env.AVITO_CLIENT_SECRET as string);
    params.append('refresh_token', decrypt(tokenData.refresh_token));

    const refreshRes = await fetch('https://api.avito.ru/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const refreshData = await refreshRes.json();

    if (!refreshRes.ok) {
      return res.status(500).json({ error: refreshData });
    }

    // update data after token refresh
    ({ data: tokenData, error: tokenError } = await supabase
      .from('avito_access_tokens')
      .update([
        {
          access_token: encrypt(refreshData.access_token),
          expires_in: refreshData.expires_in,
          scope: refreshData.scope,
          refresh_token: encrypt(refreshData.refresh_token),
          token_type: refreshData.token_type,
        },
      ])
      .eq('user_id', user?.id ?? user_id));

    if (tokenError) {
      return res.status(500).json({ error: tokenError.message });
    }

    return res.status(200).json(tokenData);
  }
}
