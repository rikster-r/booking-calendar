import Modal from '@/components/Modal';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
};

const RoomInfoModal = ({ isOpen, onClose, room }: Props) => {
  if (!room) return null;

  const deleteRoom = async () => {
    const res = await fetch(`/api/rooms/${room.id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      // onClose here is also supposed to mutate rooms
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-2xl font-bold mb-4">Информация о комнате:</h2>
      <div className="mb-2">
        <span className="font-semibold">Название:</span> {room.name}
      </div>
      <div className="mt-4 flex justify-end flex-col gap-2 sm:flex-row">
        <button
          onClick={deleteRoom}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 hover:cursor-pointer"
        >
          Удалить комнату
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 hover:cursor-pointer"
        >
          Закрыть
        </button>
      </div>
    </Modal>
  );
};

export default RoomInfoModal;
