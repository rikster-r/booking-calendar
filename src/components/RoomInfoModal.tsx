import Modal from '@/components/Modal';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import {
  ChatBubbleLeftEllipsisIcon,
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';
import useWindowWidth from '@/hooks/useWindowWidth';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Link from 'next/link';
import AvitoLogo from '@/assets/avitoLogo.svg';
import Image from 'next/image';
import { useState } from 'react';
import { KeyedMutator } from 'swr';
import CommentHistoryModal from './CommentHistoryModal';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onEditOpen: () => void;
  onDeleteConfirmOpen: () => void;
  room: Room | null;
  user: User;
  comments: RoomComment[];
  mutateComments: KeyedMutator<RoomComment[]>;
};

const RoomInfoModal = ({
  isOpen,
  onClose,
  onEditOpen,
  onDeleteConfirmOpen,
  room,
  user,
  comments,
  mutateComments,
}: Props) => {
  const [commentHistoryOpen, setCommentHistoryOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const windowWidth = useWindowWidth();
  const maxNameLength = windowWidth > 1024 ? 30 : 20;

  if (!room) return null;

  const statusMap = {
    ready: {
      text: 'Готово к заселению',
    },
    'not ready': {
      text: 'Не готово к заселению',
    },
    cleaning: {
      text: 'Идет уборка',
    },
  };

  const data = statusMap[room.status];

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
        <div className="bg-white p-6 sm:p-7 text-sm sm:text-base">
          <div className="flex items-center mb-4 gap-2 ">
            <h2 className="sm:text-lg font-semibold text-base">
              {room.name.slice(0, maxNameLength)}
              {room.name.length > maxNameLength && '...'}
            </h2>
            <button className="hover:cursor-pointer ml-auto" onClick={onClose}>
              <XMarkIcon className="w-6 sm:w-7 h-6 sm:h-7" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <InformationCircleIcon className="w-5 h-5" />
              <span>{data.text}</span>
            </div>

            {room.avito_link && (
              <div className="flex items-center gap-2 text-gray-700">
                <Image src={AvitoLogo} className="w-5 h-5" alt="Авито" />
                <span className="hover:underline">
                  <Link
                    href={room.avito_link}
                    target="_blank"
                    className="line-clamp-1"
                  >
                    {room.avito_link}
                  </Link>
                </span>
              </div>
            )}

            {room.last_cleaned_at && room.last_cleaned_user && (
              <>
                <div className="flex items-center gap-2 text-gray-700">
                  <ClockIcon className="w-5 h-5" />
                  <span>
                    Последняя уборка:{' '}
                    {format(
                      room.last_cleaned_at,
                      user.user_metadata.preferred_date_format ?? 'd MMMM',
                      { locale: ru }
                    )}
                    ,{' '}
                    {format(
                      room.last_cleaned_at,
                      user.user_metadata.preferred_time_format ?? 'HH:mm'
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <UserIcon className="w-5 h-5" />
                  <span>
                    Убрано: {room.last_cleaned_user?.first_name}{' '}
                    {room.last_cleaned_user?.last_name}
                  </span>
                </div>
              </>
            )}

            {/* New row for comment history */}
            <div
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:underline hover:cursor-pointer"
              onClick={() => {
                setCommentHistoryOpen(true);
                setSelectedRoomId(room.id);
              }}
            >
              <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
              <span>Комментарии</span>
            </div>
          </div>

          <div className="mt-6 flex gap-2 justify-end">
            <button
              className="outline-none text-red-500  hover:text-red-700 focus-visible:ring-4 focus-visible:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 hover:cursor-pointer"
              onClick={onDeleteConfirmOpen}
            >
              Удалить
            </button>
            <button
              className="outline-none text-white bg-orange-400 hover:bg-orange-500 focus-visible:ring-4 focus-visible:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 hover:cursor-pointer"
              onClick={onEditOpen}
            >
              Редактировать
            </button>
          </div>
        </div>
      </Modal>
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
    </>
  );
};

export default RoomInfoModal;
