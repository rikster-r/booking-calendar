import {
  PaperAirplaneIcon,
  HomeIcon,
  MinusCircleIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { KeyedMutator } from 'swr';

type Props = {
  user: User;
  rooms?: Room[];
  mutateRooms: KeyedMutator<Room[]>;
};

const RoomsLinks = ({ user, rooms, mutateRooms }: Props) => {
  const [inputLink, setInputLink] = useState('');

  const addRoomByLink = async (link: string) => {
    const res = await fetch(`/api/users/${user.id}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avitoLink: link }),
    });

    if (res.ok) {
      mutateRooms();
      setInputLink('');
    } else {
      toast.error('Не удалось добавить помещение. Попробуйте еще раз.');
    }
  };

  const deleteRoom = async (roomId: number) => {
    const res = await fetch(`/api/users/${user.id}/rooms/${roomId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      mutateRooms();
    } else {
      toast.error('Не удалось удалить помещение. Попробуйте еще раз.');
    }
  };

  return (
    <div className="py-4 mt-10">
      <h2 className="font-medium text-gray-900 mb-1">Помещения с Авито</h2>
      <div className="flex gap-2 mt-1">
        <input
          type="search"
          id="search"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full h-full"
          placeholder="Введите ссылку на помещение"
          value={inputLink}
          onChange={(e) => setInputLink(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addRoomByLink(inputLink);
            }
          }}
        />
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white p-2 flex justify-center items-center sm:px-4 sm:py-2 rounded-md text-sm font-medium hover:cursor-pointer h-full"
          onClick={() => addRoomByLink(inputLink)}
        >
          <span className="hidden sm:block">Добавить</span>
          <PaperAirplaneIcon className="w-5 h-5 sm:hidden" />
        </button>
      </div>
      {rooms && rooms.length !== 0 && (
        <ul className="mt-4 border border-gray-300 rounded-md shadow-sm">
          {rooms.map((room, index) => (
            <li
              key={room.id}
              className={`flex items-center gap-4 px-4 py-3 ${
                index !== 0 ? 'border-t border-gray-300' : ''
              }`}
            >
              <HomeIcon className="w-6 h-6 text-blue-500" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">
                  {room.name}
                </h3>
                <Link
                  href={room.avito_link ?? '/'}
                  className="text-sm text-gray-500 line-clamp-1 max-w-[200px] sm:max-w-[400px] xl:max-w-[600px] hover:underline"
                >
                  {room.avito_link}
                </Link>
              </div>
              <button
                className="text-red-500 hover:text-red-600 focus:outline-none hover:cursor-pointer"
                onClick={() => deleteRoom(room.id)}
              >
                <MinusCircleIcon className="w-6 h-6" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RoomsLinks;
