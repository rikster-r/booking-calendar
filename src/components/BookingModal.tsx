import Modal from '@/components/Modal';
import { useEffect, useState } from 'react';
import { PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/solid';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  addBooking: (data: BookingInput) => Promise<void>;
  rooms: Room[];
  selectedDate: Date | null;
  selectedRoomId: number | null;
};

const BookingModal = ({
  isOpen,
  onClose,
  addBooking,
  rooms,
  selectedDate,
  selectedRoomId,
}: Props) => {
  const formatDateTimeLocal = (date: Date | null) => {
    if (!date) return '';
    const offset = date.getTimezoneOffset() * 60000; // Offset in milliseconds
    const localISO = new Date(date.getTime() - offset).toISOString().slice(0, 16);
    return localISO;
  };
  
  const [formData, setFormData] = useState(() => ({
    roomId: selectedRoomId ?? (rooms.length > 0 ? rooms[0].id : 0),
    clientName: '',
    clientSurname: '',
    clientPhone: '',
    clientEmail: '',
    adultsCount: 0,
    childrenCount: 0,
    checkIn: formatDateTimeLocal(selectedDate),
    checkOut: '',
  }));
  
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      roomId: selectedRoomId ?? (rooms.length > 0 ? rooms[0].id : 0),
      checkIn: formatDateTimeLocal(selectedDate),
    }));
  }, [selectedRoomId, selectedDate, rooms]);

  const handleChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement
  > = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    onClose();
    await addBooking(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          📌 Бронирование
        </h2>

        {/* Room Info */}
        <div className="mt-2">
          <label className="text-gray-700 font-medium">Помещение</label>
          <select
            name="roomId"
            id="roomId"
            value={formData.roomId}
            className="w-full mt-1 p-2 border rounded-md"
            onChange={handleChange}
          >
            {rooms.map((room) => (
              <option value={room.id} key={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </div>

        {/* Check-in & Check-out */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <label className="text-gray-700">Приезд</label>
            <input
              type="datetime-local"
              name="checkIn"
              value={formData.checkIn}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="text-gray-700">Выезд</label>
            <input
              type="datetime-local"
              name="checkOut"
              value={formData.checkOut}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>

        {/* Adults & Children Count */}
        <div className="mt-3 flex gap-4">
          <div>
            <label className="text-gray-700">Взр.</label>
            <input
              type="number"
              name="adultsCount"
              value={formData.adultsCount}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="text-gray-700">Дети</label>
            <input
              type="number"
              name="childrenCount"
              value={formData.childrenCount}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>

        {/* Client Info */}
        <div className="mt-4 p-3 bg-gray-100 rounded-md">
          <h3 className="font-medium flex items-center gap-2">👤 Клиент</h3>
          <div className="mt-2">
            <label className="text-gray-700">Имя</label>
            <input
              type="text"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="mt-2">
            <label className="text-gray-700">Фамилия/Фирма</label>
            <input
              type="text"
              name="clientSurname"
              value={formData.clientSurname}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="mt-2">
            <label className="text-gray-700">Телефон</label>
            <div className="relative">
              <input
                type="tel"
                name="clientPhone"
                value={formData.clientPhone}
                onChange={handleChange}
                className="w-full p-2 border rounded-md pl-10"
              />
              <PhoneIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div className="mt-2">
            <label className="text-gray-700">Электронный адрес</label>
            <div className="relative">
              <input
                type="email"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleChange}
                className="w-full p-2 border rounded-md pl-10"
              />
              <EnvelopeIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="mt-4 w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 hover:cursor-pointer"
        >
          Сохранить бронирование
        </button>
      </form>
    </Modal>
  );
};

export default BookingModal;
