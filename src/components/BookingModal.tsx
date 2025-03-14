import Modal from '@/components/Modal';
import { useEffect, useState } from 'react';
import { PhoneIcon, EnvelopeIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { getNextDay } from '@/lib/dates';
import { format } from 'date-fns';
import DateTimePicker from '@/components/DateTimePicker';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  selectedDate: Date;
  selectedRoomId: number;
};

const BookingModal = ({
  isOpen,
  onClose,
  rooms,
  selectedDate,
  selectedRoomId,
}: Props) => {
  const initial: BookingInput = {
    roomId: selectedRoomId,
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    adultsCount: 1,
    childrenCount: 0,
    doorCode: 0,
    additionalInfo: '',
    checkIn: selectedDate,
    checkOut: getNextDay(selectedDate),
  };
  const [formData, setFormData] = useState(initial);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData(initial);
    }
  }, [isOpen]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      roomId: selectedRoomId,
      checkIn: selectedDate,
      checkOut: getNextDay(selectedDate),
    }));
  }, [selectedDate, selectedRoomId]);

  const handleChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  > = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // stringify date with respect to timezone
  const formatDateTimeLocal = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000; // Offset in milliseconds
    const localISO = new Date(date.getTime() - offset)
      .toISOString()
      .slice(0, 16);
    return localISO;
  };

  const addBooking = async (data: BookingInput) => {
    setIsSubmitting(true);
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data, (key, value) => {
        if (key === 'checkIn' || key === 'checkOut') {
          return formatDateTimeLocal(data[key]);
        }
        return value;
      }),
    });

    if (res.ok) {
      // TODO
    }

    setIsSubmitting(false);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    await addBooking(formData);
    onClose();
  };

  const setCheckIn = (date: Date) => {
    // TODO add error popups
    if (date > formData.checkOut) return;
    if (date < new Date()) return;
    setFormData((prev) => ({ ...prev, checkIn: date }));
  };

  const setCheckOut = (date: Date) => {
    if (date < formData.checkIn) return;
    setFormData((prev) => ({ ...prev, checkOut: date }));
  };

  const setCheckInTime:
    | React.ChangeEventHandler<HTMLInputElement>
    | undefined = (e) => {
    const [hours, minutes] = e.target.value.split(':').map(Number);
    setFormData((prev) => {
      const copy = new Date(prev.checkIn);
      copy.setHours(hours, minutes, 0, 0);
      return { ...prev, checkIn: copy };
    });
  };

  const setCheckOutTime:
    | React.ChangeEventHandler<HTMLInputElement>
    | undefined = (e) => {
    const [hours, minutes] = e.target.value.split(':').map(Number);
    setFormData((prev) => {
      const copy = new Date(prev.checkOut);
      copy.setHours(hours, minutes, 0, 0);
      return { ...prev, checkOut: copy };
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            📌 Бронирование
          </h2>
          <button
            type="button"
            className="hover:cursor-pointer"
            onClick={onClose}
          >
            <XMarkIcon className="w-7 h-7" />
          </button>
        </div>

        {/* Room Info */}
        <div className="mt-3">
          <label className="text-gray-700 font-medium">Помещение</label>
          <select
            name="roomId"
            id="roomId"
            value={formData.roomId}
            className="w-full mt-1 p-2 border rounded-md"
            onChange={handleChange}
            required
          >
            {rooms.map((room) => (
              <option value={room.id} key={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </div>

        {/* Check-in */}
        <div className="mt-3">
          <label className="text-gray-700">Заезд</label>
          <DateTimePicker
            onDateChange={setCheckIn}
            selectedDate={formData.checkIn}
            startDate={formData.checkIn}
            timeValue={format(formData.checkIn, 'HH:mm')}
            onTimeChange={setCheckInTime}
          />
        </div>

        {/* Check-out */}
        <div className="mt-3">
          <label className="text-gray-700">Выезд</label>
          <DateTimePicker
            onDateChange={setCheckOut}
            selectedDate={formData.checkOut}
            startDate={formData.checkIn}
            timeValue={format(formData.checkOut, 'HH:mm')}
            onTimeChange={setCheckOutTime}
          />
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
              required
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

        {/* Door Code */}
        <div className="mt-3">
          <label className="text-gray-700">Код двери</label>
          <input
            type="text"
            name="doorCode"
            value={formData.doorCode}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        {/* Additional Info */}
        <div className="mt-3">
          <label className="text-gray-700">Дополнительная информация</label>
          <textarea
            name="additionalInfo"
            value={formData.additionalInfo}
            onChange={handleChange}
            className="w-full p-2 border rounded-md resize-none h-[100px]"
          />
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
              required
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
                required
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
          disabled={isSubmitting}
        >
          Сохранить бронирование
        </button>
      </form>
    </Modal>
  );
};

export default BookingModal;
