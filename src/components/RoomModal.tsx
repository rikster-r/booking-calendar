import Modal from '@/components/Modal';
import { useState } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const RoomModal = ({ isOpen, onClose }: Props) => {
  const initial = {
    name: '',
  };
  const [formData, setFormData] = useState(initial);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addRoom = async (data: RoomInput) => {
    setIsSubmitting(true);
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      // TODO
    }
    setIsSubmitting(false);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    await addRoom(formData);
    onClose();
    setFormData(initial);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          🏠 Добавить помещение
        </h2>

        <div className="mt-2">
          <label className="text-gray-700 font-medium">Название</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded-md"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:cursor-pointer"
            disabled={isSubmitting}
          >
            Добавить
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RoomModal;
