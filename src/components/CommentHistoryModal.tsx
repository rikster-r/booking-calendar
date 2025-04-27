import { useState } from 'react';
import { KeyedMutator } from 'swr';
import Modal from './Modal';
import { User } from '@supabase/supabase-js';
import {
  UserCircleIcon,
  XMarkIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'react-toastify';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  comments: RoomComment[];
  mutateComments: KeyedMutator<RoomComment[]>;
  user: User;
  selectedRoomId: number | null;
};

const CommentHistoryModal = ({
  isOpen,
  onClose,
  comments,
  mutateComments,
  user,
  selectedRoomId,
}: Props) => {
  const [commentText, setCommentText] = useState('');

  const addComment = async () => {
    if (!selectedRoomId) return;

    const res = await fetch(
      `/api/users/${user.user_metadata.related_to}/comments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author_id: user.id,
          room_id: selectedRoomId,
          text: commentText,
        }),
      }
    );

    if (res.ok) {
      toast.success('Комментарий добавлен');
      setCommentText('');
    } else {
      toast.error('Не удалось добавить комментарий');
    }

    mutateComments();
  };

  const deleteComment = async (commentId: number) => {
    const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });

    if (!res.ok) {
      const errorData = await res.json();
      toast.error(
        errorData.error || 'Произошла ошибка при удалении комментария'
      );
    } else {
      mutateComments();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px]">
      <div className="relative p-5 sm:p-7 text-sm sm:text-base">
        <div className="flex justify-between items-center gap-2 sm:gap-12">
          <h2 className="sm:text-lg font-semibold text-base flex items-center gap-2">
            История комментариев
          </h2>
          <button
            type="button"
            className="hover:cursor-pointer"
            onClick={onClose}
          >
            <XMarkIcon className="w-6 sm:w-7 h-6 sm:h-7" />
          </button>
        </div>

        <div
          className="mt-4 space-y-4 max-h-[300px] overflow-y-auto"
          ref={(el) => {
            if (el) {
              el.scrollTop = el.scrollHeight;
            }
          }}
        >
          {comments
            .filter((comment) => comment.room_id === selectedRoomId)
            .map((comment) => (
              <div
                key={comment.id}
                className="bg-gray-100 rounded-md p-4 text-left flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <UserCircleIcon className="w-8 h-8 text-gray-500" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {comment.author?.first_name} {comment.author?.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(
                          comment.created_at,
                          user.user_metadata.preferred_date_format ??
                            'd MMMM yyyy',
                          { locale: ru }
                        )}
                        ,{' '}
                        {format(
                          comment.created_at,
                          user.user_metadata.preferred_time_format ?? 'HH:mm'
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-800 text-base">{comment.text}</p>
                </div>
                {(comment.author_id === user.id ||
                  comment?.room?.owner?.id === user.id) && (
                  <button
                    onClick={() => deleteComment(comment.id)}
                    className="text-gray-700 text-sm hover:cursor-pointer"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          {comments.filter((comment) => comment.room_id === selectedRoomId)
            .length === 0 && (
            <p className="text-gray-500">Комментариев пока нет.</p>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            addComment();
          }}
          className="mt-4"
        >
          <textarea
            id="new-comment"
            name="new-comment"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md outline-none transition-all resize-none text-gray-900 placeholder-gray-400 text-base sm:text-sm"
            rows={3}
            placeholder="Введите ваш комментарий..."
            required
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:cursor-pointer hover:bg-blue-600 focus-visible:ring-4 focus-visible:ring-blue-300 outline-none text-base sm:text-sm"
            >
              Добавить комментарий
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CommentHistoryModal;
