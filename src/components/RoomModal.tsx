import Modal from '@/components/Modal';
import { useEffect, useState } from 'react';
import { PaintBrushIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { hexColors } from '@/lib/colors';
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  CloseButton,
} from '@headlessui/react';
import { toast } from 'react-toastify';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const RoomModal = ({ isOpen, onClose }: Props) => {
  const initial: RoomInput = {
    name: '',
    color: hexColors[5],
  };
  const [formData, setFormData] = useState(initial);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData(initial);
    }
  }, [isOpen]);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const changePickedColor = (color: string) => {
    setFormData((prev) => ({ ...prev, color }));
  };

  const addRoom = async (data: RoomInput) => {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success('Комната добавлена.');
      onClose();
    } else {
      const errorData = await res.json();
      toast.error(errorData.error || 'Ошибка при добавлении комнаты.');
    }
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    await addRoom(formData);
    setIsSubmitting(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            🏠 Добавить помещение
          </h2>
          <button
            type="button"
            className="hover:cursor-pointer"
            onClick={onClose}
          >
            <XMarkIcon className="w-7 h-7" />
          </button>
        </div>

        <div className="mt-2">
          <label className="text-gray-700 font-medium">Название</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded-md"
            required
          />
        </div>

        <div className="mt-2 relative">
          <div className="flex items-center">
            <PaintBrushIcon className="w-4 h-4 mr-1" />
            <label className="text-gray-700 font-medium">Цвет дисплея</label>
          </div>
          <Popover className="relative">
            <PopoverButton
              className="w-full mt-1 p-2 border rounded-md text-white hover:cursor-pointer"
              style={{ backgroundColor: formData.color }}
            >
              {formData.color}
            </PopoverButton>
            <PopoverPanel
              className="grid grid-cols-9 fixed w-[300px] gap-1 bg-white p-2 rounded-md inset-x-auto shadow-xl"
              anchor="top"
            >
              {hexColors.map((color) => (
                <CloseButton
                  key={color}
                  type="button"
                  style={{ backgroundColor: color }}
                  className="aspect-square rounded-md hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-blue-500"
                  onClick={() => changePickedColor(color)}
                ></CloseButton>
              ))}
            </PopoverPanel>
          </Popover>
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
