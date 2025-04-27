import RoomStatusBadge from './RoomStatusBadge';
import { User } from '@supabase/supabase-js';
import Handshake from '@/assets/handshake.svg';
import HouseSearch from '@/assets/house-search.svg';
import Image from 'next/image';
import { KeyedMutator } from 'swr';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'react-toastify';
import {
  EllipsisVerticalIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  RectangleGroupIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
} from '@headlessui/react';
import { useState } from 'react';
import Modal from '@/components/Modal';
import CommentHistoryModal from './CommentHistoryModal';

type Props = {
  rooms: Room[];
  mutateRooms: KeyedMutator<Room[]>;
  user: User;
  comments: RoomComment[];
  mutateComments: KeyedMutator<RoomComment[]>;
};

const CleaningObjects = ({
  rooms,
  mutateRooms,
  user,
  comments,
  mutateComments,
}: Props) => {
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentHistoryOpen, setCommentHistoryOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');

  const changeRoomStatus = async (roomId: number, status: string) => {
    // Optimistic update
    mutateRooms((currentRooms) => {
      if (!currentRooms) return currentRooms;
      return currentRooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              status: status as 'cleaning' | 'not ready' | 'ready',
              last_cleaned_at:
                status === 'cleaning'
                  ? new Date().toISOString()
                  : room.last_cleaned_at,
              last_cleaned_by:
                status === 'cleaning' ? user.id : room.last_cleaned_by,
            }
          : room
      );
    }, false);

    const body: {
      status: string;
      last_cleaned_at?: string;
      last_cleaned_by?: string;
    } = {
      status,
    };

    if (status === 'cleaning') {
      body.last_cleaned_at = new Date().toISOString();
      body.last_cleaned_by = user.id; // Using the user's ID to identify who cleaned
    } else {
      delete body.last_cleaned_at;
      delete body.last_cleaned_by;
    }

    const res = await fetch(
      `/api/users/${user.user_metadata.related_to}/rooms/${roomId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      toast.error('Не удалось изменить статус комнаты');
    }

    mutateRooms();
  };

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
      setCommentModalOpen(false);
    } else {
      toast.error('Не удалось добавить комментарий');
    }

    mutateComments();
  };

  if (!user.user_metadata.related_to) {
    return (
      <div className="h-full w-full lg:px-8">
        <div className="p-4 bg-white rounded-t-xl flex justify-center items-center w-full max-w-[800px] mx-auto h-full flex-col text-center">
          <Image src={Handshake} alt="" className="w-16 h-16" />
          <h2 className="text-lg font-semibold text-gray-900 mt-6">
            Вы не связаны ни с одним владельцем помещений
          </h2>
          <p className="mt-1 text-gray-500">
            Попросите владельца связать ваш аккаунт для доступа к функционалу.
          </p>
        </div>
      </div>
    );
  }

  if (!rooms || !rooms.length) {
    return (
      <div className="h-full w-full lg:px-8">
        <div className="p-4 bg-white rounded-t-xl flex justify-center items-center w-full max-w-[800px] mx-auto h-full flex-col text-center">
          <Image src={HouseSearch} alt="" className="w-16 h-16" />
          <h2 className="text-lg font-semibold text-gray-900 mt-6">
            Владелец пока не добавил помещения
          </h2>
          <p className="mt-1 text-gray-500 max-w-[500px]">
            Пожалуйста, подождите, пока они будут добавлены, или свяжитесь с
            владельцем напрямую.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full lg:px-8">
      <PopoverGroup className="p-4 w-full max-w-[800px] mx-auto h-full text-center lg:px-8 lg:pb-4 lg:pt-0 gap-2 space-y-2">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="flex items-center justify-between w-full rounded-md"
            style={{ backgroundColor: room.color }}
          >
            <div className="w-full py-4 px-4">
              <div className="w-full max-w-[80%] flex flex-col text-left">
                <div className="flex gap-2">
                  <h2 className="font-semibold text-white line-clamp-3">
                    {room.name}
                  </h2>
                  <RoomStatusBadge
                    room={room}
                    includeTitle
                    onStatusChange={changeRoomStatus}
                  />
                </div>

                {room.last_cleaned_at && (
                  <p className="text-sm text-gray-100 flex flex-col sm:flex-row">
                    <span className="mr-1">Последняя уборка:</span>
                    <span>
                      {format(room.last_cleaned_at, 'd MMMM', { locale: ru })},{' '}
                      {format(
                        room.last_cleaned_at,
                        user.user_metadata.preferred_time_format ?? 'HH:mm'
                      )}
                    </span>
                  </p>
                )}
              </div>
            </div>
            <Popover className="relative h-full">
              <PopoverButton className="h-[60px] min-w-[52px] hover:cursor-pointer flex justify-center items-center">
                <EllipsisVerticalIcon className="w-5 h-5 text-white" />
              </PopoverButton>
              <PopoverPanel
                className="absolute z-10 bg-white rounded-md shadow-lg p-2 flex flex-col w-max text-sm"
                anchor={{
                  to: 'bottom end',
                  gap: -5,
                }}
              >
                <button
                  className="flex gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left rounded-md hover:cursor-pointer"
                  onClick={() => changeRoomStatus(room.id, 'cleaning')}
                >
                  <RectangleGroupIcon className="w-5 h-5" />
                  <span>Установить режим уборки</span>
                </button>
                <button
                  className="flex gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left rounded-md hover:cursor-pointer"
                  onClick={() => {
                    setSelectedRoomId(room.id);
                    setCommentModalOpen(true);
                  }}
                >
                  <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
                  <span>Оставить комментарий</span>
                </button>
                <button
                  className="flex gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left rounded-md hover:cursor-pointer"
                  onClick={() => {
                    setSelectedRoomId(room.id);
                    setCommentHistoryOpen(true);
                  }}
                >
                  <ClockIcon className="w-5 h-5" />
                  <span>Открыть историю комментариев</span>
                </button>
              </PopoverPanel>
            </Popover>
          </div>
        ))}
      </PopoverGroup>

      {commentModalOpen && (
        <Modal
          isOpen={commentModalOpen}
          onClose={() => setCommentModalOpen(false)}
          className="max-w-[500px]"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addComment();
            }}
            className="relative p-6 sm:p-7 text-sm sm:text-base"
          >
            <div className="flex justify-between items-center gap-2 sm:gap-12">
              <h2 className="sm:text-lg font-semibold text-base flex items-center gap-2">
                Оставить комментарий
              </h2>
              <button
                type="button"
                className="hover:cursor-pointer"
                onClick={() => setCommentModalOpen(false)}
              >
                <XMarkIcon className="w-6 sm:w-7 h-6 sm:h-7" />
              </button>
            </div>

            <div className="mt-4">
              <label htmlFor="comment" className="sr-only">
                Комментарий
              </label>
              <textarea
                id="comment"
                name="comment"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md outline-none transition-all resize-none text-gray-900 placeholder-gray-400 h-[200px]"
                rows={4}
                placeholder="Введите ваш комментарий..."
                required
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md mr-2 hover:cursor-pointer"
                onClick={() => setCommentModalOpen(false)}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:cursor-pointer hover:bg-blue-600 focus-visible:ring-4 focus-visible:ring-blue-300 outline-none"
              >
                Отправить
              </button>
            </div>
          </form>
        </Modal>
      )}

      {commentHistoryOpen && (
        <CommentHistoryModal
          isOpen={commentHistoryOpen}
          onClose={() => setCommentHistoryOpen(false)}
          comments={comments}
          mutateComments={mutateComments}
          user={user}
          selectedRoomId={selectedRoomId}
        />
      )}
    </div>
  );
};

export default CleaningObjects;
