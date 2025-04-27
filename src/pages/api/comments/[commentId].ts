import { NextApiRequest, NextApiResponse } from 'next';
import createClient from '@/lib/supabase/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(req, res);

  if (req.method === 'DELETE') {
    const { commentId: comment_id } = req.query;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Ошибка проверки доступа' });
    }

    if (!comment_id) {
      return res
        .status(400)
        .json({ error: 'Некорректный ID пользователя или комментария.' });
    }

    // Fetch the comment to verify ownership
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', comment_id)
      .single();

    if (commentError || !comment) {
      return res.status(404).json({ error: 'Комментарий не найден.' });
    }

    if (user.user_metadata.role === 'cleaner') {
      // Allow cleaners to delete only their own comments
      if (comment.author_id !== user.id) {
        return res
          .status(403)
          .json({ error: 'Вы можете удалять только свои комментарии.' });
      }
    } else {
      // Allow other roles to delete comments if the room belongs to them
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('user_id')
        .eq('id', comment.room_id)
        .single();

      if (roomError || !room) {
        return res.status(404).json({ error: 'Комната не найдена.' });
      }

      if (room.user_id !== user.id) {
        return res
          .status(403)
          .json({ error: 'Вы не являетесь владельцем этой комнаты.' });
      }
    }

    // Proceed to delete the comment
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', comment_id);

    if (deleteError) {
      return res.status(500).json({ error: 'Не удалось удалить комментарий.' });
    }

    return res.status(200).json({ message: 'Комментарий успешно удален.' });
  }
}
