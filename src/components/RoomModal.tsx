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
  roomData?: Room;
};

const RoomModal = ({ isOpen, onClose, roomData }: Props) => {
  const initial: RoomInput = roomData
    ? {
        name: roomData.name,
        status: roomData.status,
        color: roomData.color,
      }
    : {
        name: '',
        status: 'ready',
        color: hexColors[5],
      };
  const [formData, setFormData] = useState(initial);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const statuses = {
    ready: 'Готово к заселению',
    'not ready': 'Не готово к заселению',
    cleaning: 'Уборка',
  };

  useEffect(() => {
    if (!isOpen) {
      setFormData(initial);
    }
  }, [isOpen]);

  const handleChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement
  > = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const changePickedColor = (color: string) => {
    setFormData((prev) => ({ ...prev, color }));
  };

  const saveRoom = async (data: RoomInput) => {
    const method = roomData ? 'PUT' : 'POST';
    const url = roomData ? `/api/rooms/${roomData.id}` : '/api/rooms';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success(roomData ? 'Помещение обновлено' : 'Помещение добавлено');
      onClose();
    } else {
      const errorData = await res.json();
      toast.error(
        errorData.error ||
          `Ошибка при ${roomData ? 'обновлении' : 'добавлении'} помещения.`
      );
    }
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    await saveRoom(formData);
    setIsSubmitting(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <form
        onSubmit={handleSubmit}
        className="relative p-6 sm:p-7 text-sm sm:text-base"
      >
        <div className="flex justify-between items-center gap-2 sm:gap-12">
          <h2 className="sm:text-lg font-semibold text-base flex items-center gap-2">
            {roomData ? 'Изменить' : 'Добавить'} помещение
          </h2>
          <button
            type="button"
            className="hover:cursor-pointer"
            onClick={onClose}
          >
            <XMarkIcon className="w-6 sm:w-7 h-6 sm:h-7" />
          </button>
        </div>

        <div className="mt-3">
          <label className="font-medium text-gray-700">Название</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 flex items-center w-full border border-gray-500 rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px]"
            required
          />
        </div>

        <div className="mt-3">
          <label className="text-gray-700 font-medium">Статус</label>
          <select
            name="status"
            value={formData.status}
            className="mt-1 flex items-center w-full border rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px] border-gray-500"
            onChange={handleChange}
            required
          >
            {Object.keys(statuses).map((status) => (
              <option value={status} key={status} className="">
                {statuses[status as keyof typeof statuses]}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 relative">
          <div className="flex items-center">
            <PaintBrushIcon className="w-4 h-4 mr-1 fill-gray-700" />
            <label className="text-gray-700 font-medium">Цвет дисплея</label>
          </div>
          <Popover className="relative">
            <PopoverButton
              className="w-full mt-1 p-2 border border-gray-500 rounded-md text-white hover:cursor-pointer flex items-center px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px]"
              style={{ backgroundColor: formData.color }}
            >
              {formData.color}
            </PopoverButton>
            <PopoverPanel
              className="grid grid-cols-8 fixed w-[300px] gap-1 bg-white p-2 rounded-md inset-x-auto shadow-xl"
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
            className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:cursor-pointer hover:bg-blue-600 focus-visible:ring-4 focus-visible:ring-blue-300 outline-none"
            disabled={isSubmitting}
          >
            {roomData ? 'Сохранить' : 'Добавить'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RoomModal;
