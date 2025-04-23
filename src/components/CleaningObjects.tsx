import RoomStatusBadge from './RoomStatusBadge';
import { User } from '@supabase/supabase-js';
import Handshake from '@/assets/handshake.svg';
import HouseSearch from '@/assets/house-search.svg';
import Image from 'next/image';
import { KeyedMutator } from 'swr';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'react-toastify';

type Props = {
  rooms: Room[];
  mutateRooms: KeyedMutator<Room[]>;
  user: User;
};

const CleaningObjects = ({ rooms, mutateRooms, user }: Props) => {
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
      `/api/${user.user_metadata.related_to}/rooms/${roomId}`,
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
      <div className="p-4 w-full max-w-[800px] mx-auto h-full text-center lg:px-8 lg:pb-4 lg:pt-0 gap-2 space-y-2">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="flex items-center justify-between py-4 w-full rounded-md px-4"
            style={{ backgroundColor: room.color }}
          >
            <div className="w-full">
              <div className="w-full max-w-[90%] flex flex-col text-left">
                <h2 className="font-semibold text-white line-clamp-3">
                  {room.name}
                </h2>
                {room.last_cleaned_at && (
                  <p className="text-sm text-gray-100 flex flex-col sm:flex-row">
                    <span>Последняя уборка:</span>
                    <span>
                      {format(room.last_cleaned_at, 'd MMMM, HH:mm', {
                        locale: ru,
                      })}
                    </span>
                  </p>
                )}
              </div>
            </div>
            <RoomStatusBadge
              room={room}
              customizable
              onStatusChange={changeRoomStatus}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CleaningObjects;
