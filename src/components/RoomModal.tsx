import Modal from '@/components/Modal';
import { useEffect, useState } from 'react';
import { PaintBrushIcon } from '@heroicons/react/24/solid';
import { hexColors } from '@/lib/colors';

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
  const [isColorPickerVisible, setColorPickerVisible] = useState(false);
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
    setColorPickerVisible(false);
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
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form
        onSubmit={handleSubmit}
        // basically like a backdrop
        onClick={() => setColorPickerVisible(false)}
      >
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

        <div className="mt-2 relative">
          <div className="flex items-center">
            <PaintBrushIcon className="w-4 h-4 mr-1" />
            <label className="text-gray-700 font-medium">Цвет дисплея</label>
          </div>
          <button
            type="button"
            onClick={(e) => {
              // to not propagate to backdrop(the modal itself)
              e.stopPropagation();
              setColorPickerVisible((prev) => !prev);
            }}
            className="w-full mt-1 p-2 border rounded-md hover:cursor-pointer text-white z-30"
            style={{ backgroundColor: formData.color }}
          >
            {formData.color}
          </button>
          {isColorPickerVisible && (
            <div className="grid grid-cols-9 absolute top-20 w-full gap-1 bg-white p-2 rounded-md">
              {hexColors.map((color) => (
                <button
                  type="button"
                  style={{ backgroundColor: color }}
                  key={color}
                  className="aspect-square rounded-md hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-blue-500"
                  onClick={() => changePickedColor(color)}
                ></button>
              ))}
            </div>
          )}
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
