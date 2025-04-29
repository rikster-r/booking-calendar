import { NextApiRequest, NextApiResponse } from 'next';
import createClient from '@/lib/supabase/api';

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

    if (authError || !user) {
      return res
        .status(401)
        .json({ error: 'Войдите в аккаунт перед запросом' });
    }

    const { tokenId } = req.query;

    if (!tokenId || typeof tokenId !== 'string') {
      return res.status(400).json({ error: 'Некорректный токен' });
    }

    const [{ error: deleteTokenError }, { error: deleteRoomsError }] =
      await Promise.all([
        supabase.from('avito_access_tokens').delete().eq('id', tokenId),
        supabase
          .from('rooms')
          .delete()
          .eq('user_id', user.id)
          .not('avito_link', 'is', null)
          .neq('avito_link', ''),
      ]);

    if (deleteTokenError) {
      return res.status(500).json({ error: deleteTokenError.message });
    }

    if (deleteRoomsError) {
      return res.status(500).json({ error: deleteRoomsError.message });
    }

    return res
      .status(200)
      .json({ message: 'Интеграция и связанные комнаты успешно удалены' });
  }

  return res.status(405).json({ error: 'Данный метод API не существует.' });
}
