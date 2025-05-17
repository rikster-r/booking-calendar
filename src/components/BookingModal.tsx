import Modal from '@/components/Modal';
import { useEffect, useMemo, useState } from 'react';
import { PhoneIcon, EnvelopeIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { getNextDay, getPageIndexForBooking, isBeforeByDay } from '@/lib/dates';
import {
  format,
  differenceInCalendarDays,
  addDays,
  differenceInDays,
  isEqual,
} from 'date-fns';
import DateTimePicker from '@/components/DateTimePicker';
import { toast } from 'react-toastify';
import { User } from '@supabase/supabase-js';
import { formatPhone, unformatPhone } from '@/lib/formatPhone';
import { SWRInfiniteKeyedMutator } from 'swr/infinite';

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
  user: User;
  mutateBookings: SWRInfiniteKeyedMutator<Booking[][]>;
};

// this component is used for both updates and creations of booking
const BookingModal = ({
  isOpen,
  onClose,
  rooms,
  bookingData,
  user,
  mutateBookings,
}: Props) => {
  // workaround for typescript reasons
  function hasId(booking: unknown): booking is { id: unknown } {
    return !!booking && typeof booking === 'object' && 'id' in booking;
  }

  const initial: BookingInput = useMemo(
    () =>
      hasId(bookingData)
        ? {
            roomId: bookingData.room_id,
            clientName: bookingData.client_name,
            clientPhone: formatPhone(bookingData.client_phone),
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
            clientPhone: '+7 ',
            clientEmail: '',
            adultsCount: 1,
            childrenCount: 0,
            doorCode: null,
            additionalInfo: '',
            dailyPrice: 0,
            paid: false,
            checkIn: bookingData.checkIn,
            checkOut: getNextDay(bookingData.checkIn),
          },
    [bookingData]
  );
  const [formData, setFormData] = useState(initial);
  // states for input fields, not used in the db
  const [days, setDays] = useState<string>(
    String(differenceInCalendarDays(formData.checkOut, formData.checkIn))
  );
  const [totalPrice, setTotalPrice] = useState<string>(
    String(Math.trunc(Number(formData.dailyPrice) * Number(days)))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData(initial);
    }
  }, [initial, isOpen]);

  useEffect(() => {
    const newDays = differenceInCalendarDays(
      formData.checkOut,
      formData.checkIn
    );
    setDays(String(newDays));
    setTotalPrice(
      String(Math.trunc(Number(formData.dailyPrice) * Number(newDays)))
    );
  }, [formData.checkIn, formData.checkOut]);

  if (!bookingData) return;

  const handleChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  > = (e) => {
    if (
      e.target.name === 'dailyPrice' ||
      e.target.name === 'adultsCount' ||
      e.target.name === 'childrenCount'
    ) {
      // remove leading zeros
      const parsed = e.target.value.replace(/^0+/, '');
      const value = parsed === '' ? 0 : parsed;
      setFormData((prev) => ({
        ...prev,
        [e.target.name]: value,
      }));
      if (e.target.name === 'dailyPrice') {
        setTotalPrice(String(Math.trunc(Number(value) * Number(days))));
      }
      return;
    }
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhoneChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setFormData((prev) => ({
      ...prev,
      clientPhone: formatPhone(e.target.value),
    }));
  };

  // stringify date with respect to timezone
  const formatDateTimeLocal = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000; // Offset in milliseconds
    const localISO = new Date(date.getTime() - offset)
      .toISOString()
      .slice(0, 16);
    return localISO;
  };

  const setPaidStatus: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    setFormData((prev) => ({ ...prev, paid: e.target.value === 'true' }));
  };

  const isTimeSlotFree = async (checkIn: Date, checkOut: Date) => {
    try {
      const res = await fetch(
        `/api/users/${user.id}/bookings/validateTimeslot`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: hasId(bookingData) ? bookingData.id : undefined,
            room_id: formData.roomId,
            check_in: formatDateTimeLocal(checkIn),
            check_out: formatDateTimeLocal(checkOut),
          }),
        }
      );

      return res.ok;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return false;
    }
  };

  const setCheckInDate = async (date: Date) => {
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
      toast.error('Нельзя поставить заезд на то же время, что и выезд');
      return;
    }
    const slotFree = await isTimeSlotFree(date, formData.checkOut);
    if (!slotFree) {
      toast.error('Временной слот уже занят другой бронью.');
      return;
    }

    setFormData((prev) => ({ ...prev, checkIn: date }));
  };

  const setCheckOutDate = async (date: Date) => {
    if (date < formData.checkIn) {
      toast.error('Нельзя установить выезд раньше заезда.');
      return;
    }
    if (isEqual(date, formData.checkIn)) {
      toast.error('Нельзя поставить выезд на то же время, что и заезд');
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
    const num = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
    setDays(String(num));
    setTotalPrice(String(Math.trunc(Number(formData.dailyPrice) * num)));
    setFormData((prev) => ({
      ...prev,
      checkOut: num > 0 ? addDays(prev.checkIn, num) : prev.checkIn,
    }));
  };

  const changeTotalPrice: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const total = parseInt(e.target.value, 10) || 0;
    setTotalPrice(String(total));
    setFormData((prev) => ({
      ...prev,
      dailyPrice:
        total >= 0 ? Math.trunc(total / Number(days)) : prev.dailyPrice,
    }));
  };

  const setTime: (
    field: 'checkIn' | 'checkOut'
  ) => React.ChangeEventHandler<HTMLInputElement> = (field) => (e) => {
    if (e.target.value === '' || !e.target.value) return;
    const [hours, minutes] = e.target.value.split(':').map(Number);
    setFormData((prev) => {
      const copy = new Date(prev[field]);
      copy.setHours(hours, minutes, 0, 0);
      return { ...prev, [field]: copy };
    });
  };

  const setCheckInTime = setTime('checkIn');
  const setCheckOutTime = setTime('checkOut');

  const saveBooking = async (data: BookingInput) => {
    if (isEqual(data.checkIn, data.checkOut)) {
      toast.error('Нельзя установить выезд на то же время, что и заезд');
      return;
    }

    const method = hasId(bookingData) ? 'PUT' : 'POST';
    const url = hasId(bookingData)
      ? `/api/users/${user.id}/bookings/${bookingData.id}`
      : `/api/users/${user.id}/bookings`;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        clientPhone: unformatPhone(formData.clientPhone),
        checkIn: formatDateTimeLocal(data.checkIn),
        checkOut: formatDateTimeLocal(data.checkOut),
      }),
    });

    if (res.ok) {
      toast.success(
        hasId(bookingData) ? 'Бронь обновлена.' : 'Бронь добавлена.'
      );
      const newBooking = (await res.json()).booking as Booking;
      const pageIndex = getPageIndexForBooking(newBooking.check_out);

      mutateBookings((data) => {
        if (!data) return data;
        const newData = [...data];
        if (hasId(bookingData)) {
          const index = data[pageIndex].findIndex(
            (b) => b.id === bookingData.id
          );
          if (index === -1) return data;
          newData[pageIndex][index] = newBooking;
          return newData;
        } else {
          newData[pageIndex].push(newBooking);
          return newData;
        }
      });

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 sm:p-7 text-sm sm:text-base"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
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
          <label htmlFor="roomId" className="text-gray-700 font-medium">
            Помещение
          </label>
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
          <label htmlFor="checkIn" className="text-gray-700">
            Заезд
          </label>
          <DateTimePicker
            inputName="checkIn"
            onDateChange={setCheckInDate}
            selectedDate={formData.checkIn}
            startDate={formData.checkIn}
            timeValue={format(formData.checkIn, 'HH:mm')}
            onTimeChange={setCheckInTime}
          />
        </div>

        {/* Check-out */}
        <div className="mt-3">
          <label htmlFor="checkOut" className="text-gray-700">
            Выезд
          </label>
          <DateTimePicker
            inputName="checkOut"
            onDateChange={setCheckOutDate}
            selectedDate={formData.checkOut}
            startDate={formData.checkIn}
            timeValue={format(formData.checkOut, 'HH:mm')}
            onTimeChange={setCheckOutTime}
          />
        </div>

        {/* Adults & Children Count */}
        <div className="mt-3 flex gap-2 w-full">
          <div className="w-full">
            <label htmlFor="adultsCount" className="text-gray-700">
              Взрослые
            </label>
            <input
              type="number"
              name="adultsCount"
              id="adultsCount"
              value={formData.adultsCount}
              onChange={handleChange}
              onFocus={(e) => e.target.select()}
              className="flex items-center w-full border rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px] border-gray-500 mt-1"
              required
            />
          </div>
          <div className="w-full">
            <label htmlFor="childrenCount" className="text-gray-700">
              Дети
            </label>
            <input
              type="number"
              name="childrenCount"
              id="childrenCount"
              value={formData.childrenCount}
              onChange={handleChange}
              onFocus={(e) => e.target.select()}
              className="flex items-center w-full border rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px] border-gray-500 mt-1"
            />
          </div>
        </div>

        {/* Door Code */}
        <div className="mt-3">
          <label htmlFor="doorCode" className="text-gray-700">
            Код двери
          </label>
          <input
            type="text"
            name="doorCode"
            id="doorCode"
            value={formData.doorCode ?? ''}
            onChange={handleChange}
            className="flex items-center w-full border rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px] border-gray-500 mt-1"
          />
        </div>

        {/* Additional Info */}
        <div className="mt-3 mb-6">
          <label htmlFor="additionalInfo" className="text-gray-700">
            Дополнительная информация
          </label>
          <textarea
            name="additionalInfo"
            id="additionalInfo"
            value={formData.additionalInfo}
            onChange={handleChange}
            className="flex items-center w-full border rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 resize-none h-[100px] border-gray-500 mt-1"
          />
        </div>

        <hr className="my-5 text-gray-400" />

        {/* Finance */}
        <div className="mt-6 mb-6">
          <h2 className="text-base sm:text-lg font-semibold flex items-center">
            $ Финансы
          </h2>

          <div className="w-full mt-3">
            <label htmlFor="dailyPrice" className="text-gray-700">
              За сутки
            </label>
            <div className="flex items-center w-full border rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 border-gray-500 mt-1">
              <input
                type="number"
                name="dailyPrice"
                id="dailyPrice"
                className="w-full outline-none bg-transparent"
                value={formData.dailyPrice}
                onChange={handleChange}
              />
              <span className="ml-2 text-gray-500">RUB</span>
            </div>
          </div>
          <div className="w-full mt-3">
            <label htmlFor="daysBooked" className="text-gray-700">
              Количество дней
            </label>
            <input
              type="text"
              id="daysBooked"
              className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 border-gray-500 mt-1"
              value={days}
              onChange={changeDaysBooked}
            />
          </div>

          <div className="w-full mt-3">
            <label htmlFor="paid" className="text-gray-700 font-medium">
              Статус оплаты
            </label>
            <select
              name="paid"
              id="paid"
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

          <div className="w-full mt-3">
            <label htmlFor="totalPrice" className="text-gray-700">
              За пребывание
            </label>
            <div className="flex items-center w-full border rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 border-gray-500 mt-1">
              <input
                type="number"
                id="totalPrice"
                className="w-full outline-none bg-transparent"
                value={totalPrice}
                onChange={changeTotalPrice}
              />
              <span className="ml-2 text-gray-500">RUB</span>
            </div>
          </div>
        </div>

        <hr className="my-5 text-gray-400" />

        {/* Client Info */}
        <div className="mt-6 rounded-md">
          <h3 className="font-semibold flex items-center gap-2 text-base sm:text-lg">
            👤 Клиент
          </h3>
          <div className="mt-3">
            <label htmlFor="clientName" className="text-gray-700">
              Имя
            </label>
            <input
              type="text"
              name="clientName"
              id="clientName"
              value={formData.clientName}
              onChange={handleChange}
              className="flex items-center w-full border rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px] border-gray-500 mt-1"
              required
            />
          </div>
          <div className="mt-3">
            <label htmlFor="clientPhone" className="text-gray-700">
              Телефон
            </label>
            <div className="relative">
              <input
                type="tel"
                name="clientPhone"
                id="clientPhone"
                value={formData.clientPhone}
                onChange={handlePhoneChange}
                className="flex items-center w-full border rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px] pl-10 border-gray-500 mt-1"
                required
              />
              <PhoneIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div className="mt-3">
            <label htmlFor="clientEmail" className="text-gray-700">
              Электронный адрес
            </label>
            <div className="relative">
              <input
                type="email"
                name="clientEmail"
                id="clientEmail"
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
