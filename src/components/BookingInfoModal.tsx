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
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/solid';
import Image from 'next/image';
import Telegram from '@/assets/telegram.svg';
import Whatsapp from '@/assets/whatsapp.svg';
import { ru } from 'date-fns/locale';
import { User } from '@supabase/supabase-js';
import { type BookingPaidStatusPayload } from '@/hooks/useBookings';
import { toast } from 'react-toastify';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react';

type Booking = {
  id: number;
  room_id: number;
  client_name: string;
  client_phone: string;
  additional_client_phones: string[] | null;
  client_email: string;
  adults_count: number;
  children_count: number;
  door_code: string | null;
  additional_info: string;
  daily_price: number;
  paid: boolean;
  check_in: string | Date;
  check_out: string | Date;
  created_at: string;
  room?: Room;
  avito_id: number | null;
  user_id: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onEditOpen: () => void;
  onDeleteConfirmOpen: () => void;
  booking: Booking; // booking currently opened in modal
  setBooking: (booking: Booking) => void; // set booking currently opened in modal
  user: User;
  updateBooking: (
    booking: BookingInput | BookingPaidStatusPayload
  ) => Promise<Booking>; // update booking in db and swr
};

const BookingInfoModal = ({
  isOpen,
  onClose,
  booking,
  setBooking,
  onEditOpen,
  onDeleteConfirmOpen,
  user,
  updateBooking,
}: Props) => {
  if (!booking) return null;
  if (!booking.client_name) return null;

  const togglePaidStatus = async () => {
    try {
      const updatedBooking = await updateBooking({
        id: booking.id,
        paid: !booking.paid,
      });
      setBooking(updatedBooking);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Ошибка при обновлении статуса оплаты'
      );
    }
  };

  const formatPhoneNumber = (phone: string) => {
    const cleanPhone = phone.trim();
    return cleanPhone.startsWith('8') ? '+7' + cleanPhone.slice(1) : cleanPhone;
  };

  const getPhoneLinks = (phone: string) => {
    const formattedPhone = formatPhoneNumber(phone);
    const cleanPhone = formattedPhone.replace(/\D/g, '');
    return {
      whatsapp: `https://wa.me/${cleanPhone}`,
      telegram: `https://t.me/${cleanPhone}`,
    };
  };

  const checkIn = new Date(booking.check_in);
  const checkOut = new Date(booking.check_out);
  const nights = differenceInCalendarDays(checkOut, checkIn);
  const totalPrice = nights * booking.daily_price;

  const allPhones = [
    booking.client_phone,
    ...(booking.additional_client_phones || []),
  ];
  const hasAdditionalPhones =
    booking.additional_client_phones &&
    booking.additional_client_phones.length > 0;

  return (
    <>
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
              <button
                className={`cursor-pointer px-3 py-1 rounded-full text-sm text-nowrap w-max ${
                  booking.paid
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
                onClick={togglePaidStatus}
              >
                {booking.paid ? 'Оплачено' : 'Не оплачено'}
              </button>
            </div>
            <button className="hover:cursor-pointer ml-auto" onClick={onClose}>
              <XMarkIcon className="w-6 sm:w-7 h-6 sm:h-7" />
            </button>
          </div>

          <hr className="my-5 text-gray-400" />

          <div className="space-y-3">
            {/* Phone Numbers Section */}
            {!hasAdditionalPhones ? (
              // Single phone - show as before with separate Telegram and WhatsApp links
              <>
                <div className="flex items-center gap-2 text-gray-700">
                  <PhoneIcon className="w-5 h-5" />
                  <span>{formatPhoneNumber(booking.client_phone)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Image src={Telegram} alt="" className="w-6 h-6" />
                  <a
                    href={getPhoneLinks(booking.client_phone).telegram}
                    className="text-blue-500 hover:underline"
                  >
                    Telegram
                  </a>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Image src={Whatsapp} alt="" className="w-6 h-6" />
                  <a
                    href={getPhoneLinks(booking.client_phone).whatsapp}
                    className="text-green-500 hover:underline"
                  >
                    WhatsApp
                  </a>
                </div>
              </>
            ) : (
              // Multiple phones - use Disclosure for each
              <div className="space-y-2">
                {allPhones.map((phone, index) => (
                  <Disclosure key={index}>
                    {({ open }) => (
                      <div className="border border-gray-200 rounded-lg">
                        <DisclosureButton className="cursor-pointer flex w-full justify-between items-center px-4 py-3 text-left font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75">
                          <div className="flex items-center gap-2">
                            <PhoneIcon className="w-5 h-5" />
                            <span>{formatPhoneNumber(phone)}</span>
                          </div>
                          {open ? (
                            <ChevronUpIcon className="w-5 h-5" />
                          ) : (
                            <ChevronDownIcon className="w-5 h-5" />
                          )}
                        </DisclosureButton>
                        <DisclosurePanel className="px-4 py-2 text-base">
                          <div className="flex gap-4">
                            <a
                              href={getPhoneLinks(phone).telegram}
                              className="flex items-center gap-1 text-blue-500 hover:underline"
                            >
                              <Image
                                src={Telegram}
                                alt="Telegram"
                                className="w-5 h-5"
                              />
                              <span>Telegram</span>
                            </a>
                            <a
                              href={getPhoneLinks(phone).whatsapp}
                              className="flex items-center gap-1 text-green-500 hover:underline"
                            >
                              <Image
                                src={Whatsapp}
                                alt="WhatsApp"
                                className="w-5 h-5"
                              />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </DisclosurePanel>
                      </div>
                    )}
                  </Disclosure>
                ))}
              </div>
            )}

            {booking.client_email && (
              <div className="flex items-center gap-2 text-gray-700">
                <EnvelopeIcon className="w-5 h-5" />
                <span>{booking.client_email}</span>
              </div>
            )}

            <hr className="my-5 text-gray-400" />

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

            {booking.door_code !== null && (
              <div className="flex items-center gap-2 text-gray-700">
                <KeyIcon className="w-5 h-5" />
                <span>Код двери: {booking.door_code}</span>
              </div>
            )}

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
                <span className="font-semibold">
                  Дополнительная информация:
                </span>
                <span>{booking.additional_info}</span>
              </div>
            )}
          </div>
          <div className="mt-6 flex gap-2 justify-end">
            <button
              className="focus:outline-none text-red-500  hover:text-red-700 focus-visible:ring-4 focus-visible:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 hover:cursor-pointer"
              onClick={onDeleteConfirmOpen}
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
    </>
  );
};

export default BookingInfoModal;
