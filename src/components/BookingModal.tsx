import Modal from '@/components/Modal';
import { useEffect, useState } from 'react';
import { PhoneIcon, EnvelopeIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { getNextDay, isBeforeByDay } from '@/lib/dates';
import {
  format,
  differenceInCalendarDays,
  addDays,
  differenceInDays,
  isEqual,
} from 'date-fns';
import DateTimePicker from '@/components/DateTimePicker';
import { toast } from 'react-toastify';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  bookingData:
    | Booking
    | {
        checkIn: Date;
        roomId: number;
      };
};

// this component is used for both updates and creations of booking
const BookingModal = ({ isOpen, onClose, rooms, bookingData }: Props) => {
  // workaround for typescript reasons
  function hasId(booking: unknown): booking is { id: unknown } {
    return !!booking && typeof booking === 'object' && 'id' in booking;
  }

  const initial: BookingInput = hasId(bookingData)
    ? {
        roomId: bookingData.room_id,
        clientName: bookingData.client_name,
        clientPhone: bookingData.client_phone,
        clientEmail: bookingData.client_email,
        adultsCount: bookingData.adults_count,
        childrenCount: bookingData.children_count,
        doorCode: bookingData.door_code,
        additionalInfo: bookingData.additional_info,
        dailyPrice: bookingData.daily_price,
        paid: bookingData.paid,
        checkIn: new Date(bookingData.check_in),
        checkOut: new Date(bookingData.check_out),
      }
    : {
        roomId: bookingData.roomId,
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        adultsCount: 1,
        childrenCount: 0,
        doorCode: 0,
        additionalInfo: '',
        dailyPrice: 0,
        paid: false,
        checkIn: bookingData.checkIn,
        checkOut: getNextDay(bookingData.checkIn),
      };
  const [formData, setFormData] = useState(initial);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData(initial);
    }
  }, [isOpen]);

  useEffect(() => {
    if (hasId(bookingData)) {
      setFormData({
        roomId: bookingData.room_id,
        clientName: bookingData.client_name,
        clientPhone: bookingData.client_phone,
        clientEmail: bookingData.client_email,
        adultsCount: bookingData.adults_count,
        childrenCount: bookingData.children_count,
        doorCode: bookingData.door_code,
        additionalInfo: bookingData.additional_info,
        dailyPrice: bookingData.daily_price,
        paid: bookingData.paid,
        checkIn: new Date(bookingData.check_in),
        checkOut: new Date(bookingData.check_out),
      });
    } else {
      setFormData({
        roomId: bookingData.roomId,
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        adultsCount: 1,
        childrenCount: 0,
        doorCode: 0,
        additionalInfo: '',
        dailyPrice: 0,
        paid: false,
        checkIn: bookingData.checkIn,
        checkOut: getNextDay(bookingData.checkIn),
      });
    }
  }, [bookingData]);

  if (!bookingData) return;

  const handleChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  > = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // stringify date with respect to timezone
  const formatDateTimeLocal = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000; // Offset in milliseconds
    const localISO = new Date(date.getTime() - offset)
      .toISOString()
      .slice(0, 16);
    return localISO;
  };

  const saveBooking = async (data: BookingInput) => {
    const method = hasId(bookingData) ? 'PUT' : 'POST';
    const url = hasId(bookingData)
      ? `/api/bookings/${bookingData.id}`
      : '/api/bookings';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        checkIn: formatDateTimeLocal(data.checkIn),
        checkOut: formatDateTimeLocal(data.checkOut),
      }),
    });

    if (res.ok) {
      toast.success(
        hasId(bookingData) ? 'Бронь обновлена.' : 'Бронь добавлена.'
      );
      onClose();
    } else {
      const errorData = await res.json();
      toast.error(
        errorData.error ||
          `Ошибка при ${
            hasId(bookingData) ? 'обновлении' : 'добавлении'
          } брони.`
      );
    }
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    await saveBooking(formData);
    setIsSubmitting(false);
  };

  const setPaidStatus: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    setFormData((prev) => ({ ...prev, paid: e.target.value === 'true' }));
  };

  const isTimeSlotFree = async (checkIn: Date, checkOut: Date) => {
    try {
      const res = await fetch('/api/bookings/validateTimeslot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: hasId(bookingData) ? bookingData.id : undefined,
          room_id: formData.roomId,
          check_in: formatDateTimeLocal(checkIn),
          check_out: formatDateTimeLocal(checkOut),
        }),
      });

      return res.ok;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return false;
    }
  };

  const setCheckIn = async (date: Date) => {
    if (date > formData.checkOut) {
      const duration = differenceInDays(formData.checkOut, formData.checkIn);
      setFormData((prev) => ({
        ...prev,
        checkIn: date,
        checkOut: addDays(date, duration),
      }));
      return;
    }
    if (isBeforeByDay(date, new Date())) {
      toast.error('Нельзя добавить бронь для уже прошедших дней.');
      return;
    }
    if (isEqual(date, formData.checkOut)) {
      toast.error('Нельзя поставить приезд на то же время, что и выезд');
      return;
    }
    const slotFree = await isTimeSlotFree(date, formData.checkOut);
    if (!slotFree) {
      toast.error('Временной слот уже занят другой бронью.');
      return;
    }

    setFormData((prev) => ({ ...prev, checkIn: date }));
  };

  const setCheckOut = async (date: Date) => {
    if (date < formData.checkIn) {
      toast.error('Нельзя установить выезд раньше приезда.');
      return;
    }
    if (isEqual(date, formData.checkIn)) {
      toast.error('Нельзя поставить выезд на то же время, что и приезд');
      return;
    }
    const slotFree = await isTimeSlotFree(formData.checkIn, date);
    if (!slotFree) {
      toast.error('Временной слот уже занят другой бронью.');
      return;
    }

    setFormData((prev) => ({ ...prev, checkOut: date }));
  };

  const changeDaysBooked: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const num = parseInt(e.target.value, 10);
    if (isNaN(num)) return;

    setCheckOut(addDays(formData.checkIn, num));
  };

  const setCheckInTime: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const [hours, minutes] = e.target.value.split(':').map(Number);
    setFormData((prev) => {
      const copy = new Date(prev.checkIn);
      copy.setHours(hours, minutes, 0, 0);
      return { ...prev, checkIn: copy };
    });
  };

  const setCheckOutTime: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const [hours, minutes] = e.target.value.split(':').map(Number);
    setFormData((prev) => {
      const copy = new Date(prev.checkOut);
      copy.setHours(hours, minutes, 0, 0);
      return { ...prev, checkOut: copy };
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 sm:p-7 text-sm sm:text-base"
      >
        <div className="flex justify-between items-center">
          <h2 className="sm:text-lg font-semibold text-base flex items-center gap-2">
            📌 Бронирование
          </h2>
          <button
            type="button"
            className="hover:cursor-pointer"
            onClick={onClose}
          >
            <XMarkIcon className="w-6 sm:w-7 h-6 sm:h-7" />
          </button>
        </div>

        {/* Room Info */}
        <div className="mt-3">
          <label className="text-gray-700 font-medium">Помещение</label>
          <select
            name="roomId"
            id="roomId"
            value={formData.roomId}
            className="flex items-center w-full border rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px] border-gray-500 mt-1"
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
        <div className="mt-3 flex gap-2 w-full">
          <div className="w-full">
            <label className="text-gray-700">Взр.</label>
            <input
              type="number"
              name="adultsCount"
              value={formData.adultsCount}
              onChange={handleChange}
              className="flex items-center w-full border rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px] border-gray-500 mt-1"
              required
            />
          </div>
          <div className="w-full">
            <label className="text-gray-700">Дети</label>
            <input
              type="number"
              name="childrenCount"
              value={formData.childrenCount}
              onChange={handleChange}
              className="flex items-center w-full border rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px] border-gray-500 mt-1"
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
            className="flex items-center w-full border rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px] border-gray-500 mt-1 "
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
            className="flex items-center w-full border rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 resize-none h-[100px] border-gray-500 mt-1"
          />
        </div>

        <hr className="my-5 text-gray-400" />

        {/* Finance */}
        <div className="mt-6">
          <h2 className="sm:text-lg font-semibold flex items-center">
            $ Финансы
          </h2>

          <div className="flex gap-3 mt-3">
            <div className="w-full">
              <label className="text-gray-700">За сутки</label>
              <div className="flex items-center w-full border rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 border-gray-500 mt-1">
                <input
                  type="number"
                  name="dailyPrice"
                  className="w-full outline-none bg-transparent "
                  value={formData.dailyPrice}
                  onChange={handleChange}
                />
                <span className="ml-2 text-gray-500">RUB</span>
              </div>
            </div>
            <div className="w-full">
              <label className="text-gray-700">Количество дней</label>
              <input
                type="number"
                className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 border-gray-500 mt-1"
                value={differenceInCalendarDays(
                  formData.checkOut,
                  formData.checkIn
                )}
                onChange={changeDaysBooked}
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="text-gray-700 font-medium">Статус оплаты</label>
            <select
              name="paid"
              value={formData.paid ? 'true' : 'false'}
              className="flex items-center w-full border rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px] border-gray-500 mt-1"
              onChange={setPaidStatus}
              required
            >
              <option value="false" defaultChecked>
                Не оплачено
              </option>
              <option value="true">Оплачено</option>
            </select>
          </div>

          <div className="mt-3">
            <label className="text-gray-700 font-semibold ">
              Итого за пребывание -{' '}
              {(
                Number(formData.dailyPrice) *
                differenceInCalendarDays(formData.checkOut, formData.checkIn)
              ).toLocaleString('ru', { minimumFractionDigits: 2 })}{' '}
              руб.
            </label>
          </div>
        </div>

        <hr className="my-5 text-gray-400" />

        {/* Client Info */}
        <div className="mt-6 rounded-md">
          <h3 className="font-semibold flex items-center gap-2 sm:text-lg">
            👤 Клиент
          </h3>
          <div className="mt-3">
            <label className="text-gray-700">Имя</label>
            <input
              type="text"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              className="flex items-center w-full border rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px] border-gray-500 mt-1"
              required
            />
          </div>
          <div className="mt-3">
            <label className="text-gray-700">Телефон</label>
            <div className="relative">
              <input
                type="tel"
                name="clientPhone"
                value={formData.clientPhone}
                onChange={handleChange}
                className="flex items-center w-full border rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px] pl-10 border-gray-500 mt-1"
                required
              />
              <PhoneIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div className="mt-3">
            <label className="text-gray-700">Электронный адрес</label>
            <div className="relative">
              <input
                type="email"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleChange}
                className="flex items-center w-full border rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px] pl-10 border-gray-500 mt-1"
              />
              <EnvelopeIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="mt-4 w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 hover:cursor-pointer focus-visible:ring-4 focus-visible:ring-blue-300 outline-none"
          disabled={isSubmitting}
        >
          Сохранить бронирование
        </button>
      </form>
    </Modal>
  );
};

export default BookingModal;
