import { NextApiRequest, NextApiResponse } from 'next';
import createClient from '@/lib/supabase/api';
import { extractAvitoId } from '@/lib/extractAvitoId';
import { decrypt } from '@/lib/encrypt';
import { hexColors } from '@/lib/colors';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(req, res);
  if (req.method === 'GET') {
    const { userId: user_id, withAvitoLink } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'Некорректный ID пользователя' });
    }

    let query = supabase
      .from('rooms')
      .select(
        `*, last_cleaned_user:users!last_cleaned_by (
      id,
      first_name,
      last_name,
      email
      )`
      )
      .eq('user_id', user_id)
      .order('created_at', { ascending: true });

    if (withAvitoLink === 'true') {
      query = query.not('avito_link', 'is', null).neq('avito_link', '');
    }

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { userId: user_id } = req.query;
    const { name, color, status, avitoLink } = req.body;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res
        .status(401)
        .json({ error: 'Войдите в аккаунт перед запросом' });
    }

    if (avitoLink) {
      // Retrieve the user's access token from the database
      const { data: tokenData, error: tokenError } = await supabase
        .from('avito_access_tokens')
        .select('*')
        .eq('user_id', user_id)
        .single();

      if (tokenError || !tokenData) {
        return res
          .status(500)
          .json({ error: 'Токен доступа не найден для пользователя' });
      }

      const decryptedToken = decrypt(tokenData.access_token);

      /* Tried using 
      https://api.avito.ru/core/v1/accounts/${(tokenData as AvitoTokenData)
      .avito_user_id}/items/${avitoRoomId}
      but it doesn't return any relevant data. Had to get all items and search with find.
      */
      const avitoRes = await fetch(`https://api.avito.ru/core/v1/items`, {
        headers: {
          Authorization: `Bearer ${decryptedToken}`,
        },
      });

      if (!avitoRes.ok) {
        return res
          .status(avitoRes.status)
          .json({ error: 'Ошибка при запросе к Avito' });
      }
      const avitoData = await avitoRes.json();
      const avitoRoomId = extractAvitoId(avitoLink);
      const roomData = avitoData.resources.find(
        (resource: AvitoListing) => resource.id === avitoRoomId
      );

      // Check if a room with the same Avito link already exists
      const { data: existingRoom, error: existingRoomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('avito_link', avitoLink)
        .single();

      if (existingRoomError && existingRoomError.code !== 'PGRST116') {
        return res.status(500).json({ error: existingRoomError.message });
      }

      if (existingRoom) {
        return res.status(400).json({ error: 'Эта комната уже добавлена' });
      }

      const { data, error } = await supabase.from('rooms').insert([
        {
          name: roomData.title,
          color: hexColors[Math.floor(Math.random() * hexColors.length)],
          status: 'ready',
          user_id,
          avito_link: avitoLink,
          avito_id: avitoRoomId,
        },
      ]);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    } else {
      if (!user_id) {
        return res.status(400).json({ error: 'Некорректный айди' });
      }

      if (!name || !color || !status) {
        return res
          .status(400)
          .json({ error: 'Не все обязательные поля заполнены' });
      }

      const { data, error } = await supabase
        .from('rooms')
        .insert([{ name, color, status, user_id }]);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }
  }

  res.status(405).json({ error: 'Данный метод API не существует.' });
}
