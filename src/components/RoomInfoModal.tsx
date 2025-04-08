import Modal from '@/components/Modal';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { User } from '@supabase/supabase-js';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onEditOpen: () => void;
  room: Room | null;
  user: User;
};

const RoomInfoModal = ({ isOpen, onClose, onEditOpen, room, user }: Props) => {
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

  const deleteRoom = async () => {
    const res = await fetch(`/api/${user.id}/rooms/${room.id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      // onClose here is also supposed to mutate rooms
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="bg-white p-6 sm:p-7 text-sm sm:text-base">
        <div className="flex items-center mb-4 gap-2 ">
          <h2 className="sm:text-lg font-semibold text-base">
            {room.name.slice(0, 40)}
            {room.name.length > 40 && '...'}
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
        </div>
        <div className="mt-6 flex gap-2 justify-end">
          <button
            className="outline-none text-red-500  hover:text-red-700 focus-visible:ring-4 focus-visible:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 hover:cursor-pointer"
            onClick={deleteRoom}
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
  );
};

export default RoomInfoModal;
