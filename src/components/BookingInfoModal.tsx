import Modal from '@/components/Modal';
import { differenceInCalendarDays, format } from 'date-fns';
import {
  UserIcon,
  CreditCardIcon,
  EnvelopeIcon,
  KeyIcon,
  CalendarDaysIcon,
  PhoneIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import Image from 'next/image';
import Telegram from '@/assets/telegram.svg';
import Whatsapp from '@/assets/whatsapp.svg';
import { ru } from 'date-fns/locale';
import { User } from '@supabase/supabase-js';
import { formatPhone } from '@/lib/formatPhone';
import { SWRInfiniteKeyedMutator } from 'swr/infinite';
import { getPageIndexForBooking } from '@/lib/dates';
import { toast } from 'react-toastify';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onEditOpen: () => void;
  booking: Booking;
  user: User;
  mutateBookings: SWRInfiniteKeyedMutator<Booking[][]>;
};

const BookingInfoModal = ({
  isOpen,
  onClose,
  booking,
  onEditOpen,
  user,
  mutateBookings,
}: Props) => {
  if (!booking) return null;
  if (!booking.client_name) return null;

  const checkIn = new Date(booking.check_in);
  const checkOut = new Date(booking.check_out);
  const nights = differenceInCalendarDays(checkOut, checkIn);
  const totalPrice = nights * booking.daily_price;

  const deleteBooking = async () => {
    const res = await fetch(`/api/users/${user.id}/bookings/${booking.id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const pageIndex = getPageIndexForBooking(booking.check_in);
      mutateBookings((data) => {
        if (!data) return data;
        const newData = [...data];
        newData[pageIndex] = newData[pageIndex].filter(
          (b) => b.id !== booking.id
        );
        return newData;
      });
      toast.success('Бронь успешно удалена');
      onClose();
    } else {
      const error = await res.json();
      toast.error(error ? error.error : 'Ошибка удаления брони');
    }
  };

  let phone = booking.client_phone.trim();
  if (phone.startsWith('8')) phone = '+7' + phone.slice(1);
  const whatsappLink = `https://wa.me/${phone.replace(/\D/g, '')}`;
  const telegramLink = `https://t.me/${phone.replace(/\D/g, '')}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px]">
      <div className="bg-white p-6 sm:p-7 text-sm sm:text-base">
        <div className="flex items-center mb-4 gap-2 ">
          <div
            className={`flex sm:flex-row gap-2 ${
              booking.client_name.length > 10 ? 'flex-col' : 'flex-row'
            }`}
          >
            <h2 className="sm:text-lg font-semibold text-base">
              {booking.client_name.slice(0, 20)}
              {booking.client_name.length > 20 && '...'}
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-sm text-nowrap w-max ${
                booking.paid
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {booking.paid ? 'Оплачено' : 'Не оплачено'}
            </span>
          </div>
          <button className="hover:cursor-pointer ml-auto" onClick={onClose}>
            <XMarkIcon className="w-6 sm:w-7 h-6 sm:h-7" />
          </button>
        </div>

        <hr className="my-5 text-gray-400" />

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-700">
            <PhoneIcon className="w-5 h-5" />
            <span>{formatPhone(booking.client_phone)}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <Image src={Telegram} alt="" className="w-6 h-6" />
            <a href={telegramLink} className="text-blue-500 hover:underline">
              Telegram
            </a>
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <Image src={Whatsapp} alt="" className="w-6 h-6" />
            <a href={whatsappLink} className="text-green-500 hover:underline">
              WhatsApp
            </a>
          </div>

          <hr className="my-5 text-gray-400" />

          {booking.client_email && (
            <div className="flex items-center gap-2 text-gray-700">
              <EnvelopeIcon className="w-5 h-5" />
              <span>{booking.client_email}</span>
            </div>
          )}

          <div className="flex items-start gap-2 text-gray-700">
            <CalendarDaysIcon className="w-5 h-5" />
            <div className="flex flex-col gap-1">
              <div className="flex flex-col gap-1 sm:flex-row">
                <span>
                  {format(
                    checkIn,
                    user.user_metadata.preferred_date_format ?? 'd MMMM yyyy',
                    { locale: ru }
                  )}
                  ,{' '}
                  {format(
                    checkIn,
                    user.user_metadata.preferred_time_format ?? 'HH:mm'
                  )}
                </span>
                <span className="sm:block hidden"> - </span>
                <span>
                  {format(
                    checkOut,
                    user.user_metadata.preferred_date_format ?? 'd MMMM yyyy',
                    { locale: ru }
                  )}
                  ,{' '}
                  {format(
                    checkOut,
                    user.user_metadata.preferred_time_format ?? 'HH:mm'
                  )}
                </span>
              </div>
              <span>
                {nights} сут{nights > 1 ? 'ок' : 'ки'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <UserIcon className="w-5 h-5" />
            <span>
              {booking.adults_count} взросл
              {booking.adults_count > 1 ? 'ых' : 'ый'}
              {booking.children_count > 0 &&
                `, ${booking.children_count} ребен${
                  booking.children_count > 1 ? 'ка' : 'ок'
                }`}
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <KeyIcon className="w-5 h-5" />
            <span>Код двери: {booking.door_code}</span>
          </div>

          <div className="flex gap-2 text-gray-700 items-start">
            <CreditCardIcon className="w-5 h-5" />
            <div className="flex flex-col gap-1">
              <span>
                {booking.daily_price.toLocaleString('ru-RU', {
                  minimumFractionDigits: 2,
                })}{' '}
                руб. - за сутки
              </span>
              <span>
                {totalPrice.toLocaleString('ru-RU', {
                  minimumFractionDigits: 2,
                })}{' '}
                руб. - всего
              </span>
            </div>
          </div>

          {booking.additional_info && (
            <div className="mb-2 flex flex-col max-w-[500px] text-gray-700">
              <span className="font-semibold">Дополнительная информация:</span>
              <span>{booking.additional_info}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          <button
            className="focus:outline-none text-red-500  hover:text-red-700 focus-visible:ring-4 focus-visible:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 hover:cursor-pointer"
            onClick={deleteBooking}
          >
            Удалить
          </button>
          <button
            className="focus:outline-none text-white bg-orange-400 hover:bg-orange-500 focus-visible:ring-4 focus-visible:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 hover:cursor-pointer"
            onClick={onEditOpen}
          >
            Редактировать
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BookingInfoModal;
