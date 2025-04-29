import { NextApiRequest, NextApiResponse } from 'next';
import createClient from '@/lib/supabase/api';
import { extractAvitoId, validateAvitoUrl } from '@/lib/avito';
import { decrypt } from '@/lib/encrypt';
import { hexColors } from '@/lib/colors';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(req, res);
  if (req.method === 'GET') {
    const { id: user_id, withAvitoLink } = req.query;

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
      .order('created_at', { ascending: false });

    if (withAvitoLink === 'true') {
      query = query.not('avito_link', 'is', null).neq('avito_link', '');
    }

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { id: user_id } = req.query;
    const { color, status, avito_link } = req.body;
    let { name } = req.body;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res
        .status(401)
        .json({ error: 'Войдите в аккаунт перед запросом' });
    }

    const avitoRoomId = extractAvitoId(avito_link);
    if (avito_link) {
      if (!validateAvitoUrl(avito_link)) {
        return res.status(400).json({ error: 'Некорректная ссылка на Avito.' });
      }

      // get name from avito if not specified
      if (!name) {
        // Retrieve the user's access token from the database
        const tokenDataRes = await fetch(
          `${process.env.NEXT_PUBLIC_URL}/api/avito/accessToken?user_id=${user_id}`
        );
        const tokenData: AvitoTokenData = await tokenDataRes.json();

        if (!tokenDataRes.ok) {
          return res.status(500).json({ error: tokenData });
        }

        const decryptedToken = decrypt(tokenData.access_token);

        /* 
        Tried using 
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
        const roomData = avitoData.resources.find(
          (resource: AvitoListing) => resource.id === avitoRoomId
        );

        if (!roomData) {
          return res.status(403).json({ error: 'Объект не принадлежит вам.' });
        }

        name = roomData.title;
      }

      // Check if a room with the same Avito link already exists
      const { data: existingRoom, error: existingRoomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('avito_link', avito_link)
        .single();

      if (existingRoomError && existingRoomError.code !== 'PGRST116') {
        return res.status(500).json({ error: existingRoomError.message });
      }

      if (existingRoom) {
        return res.status(400).json({ error: 'Эта комната уже добавлена' });
      }

      const { data, error } = await supabase.from('rooms').insert([
        {
          name,
          color:
            color ?? hexColors[Math.floor(Math.random() * hexColors.length)],
          status: status ?? 'ready',
          user_id,
          avito_link,
          avito_id: avitoRoomId,
        },
      ]);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    } else {
      if (!name || !color || !status) {
        return res
          .status(400)
          .json({ error: 'Не все обязательные поля заполнены' });
      }

      const { data, error } = await supabase.from('rooms').insert([
        {
          name,
          color,
          status,
          user_id,
          avito_link: avito_link === undefined ? null : avito_link,
          avito_id:
            avito_link === undefined ? null : extractAvitoId(avito_link),
        },
      ]);

      if (error) {
        return res.status(500).json({ error });
      }

      return res.status(200).json({ data });
    }
  }

  res.status(405).json({ error: 'Данный метод API не существует.' });
}
