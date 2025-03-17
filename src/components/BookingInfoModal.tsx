import Modal from '@/components/Modal';
import { differenceInCalendarDays } from 'date-fns';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onEditOpen: () => void;
  booking: Booking | null;
};

const BookingInfoModal = ({ isOpen, onClose, booking, onEditOpen }: Props) => {
  if (!booking) return <></>;
  if (!booking.client_name) return <></>;

  const check_in = new Date(booking.check_in);
  const check_out = new Date(booking.check_out);

  const deleteBooking = async () => {
    const res = await fetch(`/api/bookings/${booking.id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      onClose();
    }
  };

  // Process phone number
  let phone = booking.client_phone.trim();
  if (phone.startsWith('8')) {
    phone = '+7' + phone.slice(1);
  }
  const whatsappLink = `https://wa.me/${phone.replace(/\D/g, '')}`;
  const telegramLink = `https://t.me/${phone.replace(/\D/g, '')}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-2xl font-bold mb-4">Информация о брони</h2>
      <div className="mb-2 max-w-[600px]">
        <span className="font-semibold">Имя:</span> {booking.client_name}
      </div>
      <div className="mb-2">
        <span className="font-semibold">Электронный адрес:</span>{' '}
        {booking.client_email ? booking.client_email : 'Не указан'}
      </div>
      <div className="mb-2">
        <span className="font-semibold">Телефон:</span> {phone}
      </div>
      <div className="mb-2 flex gap-2 flex-col">
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-600 hover:underline text-nowrap"
        >
          Связаться в WhatsApp
        </a>
        <a
          href={telegramLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-nowrap"
        >
          Связаться в Telegram
        </a>
      </div>
      <div className="mb-2">
        <span className="font-semibold">Код двери:</span> {booking.door_code}
      </div>
      <div className="mb-2">
        <span className="font-semibold mr-1">Приезд:</span>
        {check_in.toLocaleDateString()} {check_in.toLocaleTimeString()}
      </div>
      <div className="mb-2">
        <span className="font-semibold mr-1">Выезд:</span>
        {check_out.toLocaleDateString()} {check_out.toLocaleTimeString()}
      </div>
      <div className="mb-2">
        <span className="font-semibold">Всего суток:</span>{' '}
        {differenceInCalendarDays(check_out, check_in)}
      </div>
      <div className="mb-2">
        <span className="font-semibold">Цена за сутки:</span>{' '}
        {booking.daily_price.toLocaleString('ru', { minimumFractionDigits: 2 })}{' '}
        руб.
      </div>
      <div className="mb-2">
        <span className="font-semibold">За пребывание:</span>{' '}
        {(
          booking.daily_price * differenceInCalendarDays(check_out, check_in)
        ).toLocaleString('ru', { minimumFractionDigits: 2 })}{' '}
        руб., {booking.paid ? 'оплачено' : 'не оплачено'}
      </div>
      {booking.additional_info && (
        <div className="mb-2 flex flex-col max-w-[600px]">
          <span className="font-semibold">Дополнительная информация:</span>
          <span>{booking.additional_info}</span>
        </div>
      )}
      <div className="mb-2">
        <span className="font-semibold">Гости:</span> {booking.adults_count}{' '}
        взрослых, {booking.children_count} детей
      </div>
      <div className="mt-4 flex justify-end flex-col sm:flex-row gap-2">
        <button
          onClick={onEditOpen}
          className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 hover:cursor-pointer"
        >
          Редактировать
        </button>
        <button
          onClick={deleteBooking}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 hover:cursor-pointer"
        >
          Удалить бронь
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 hover:cursor-pointer"
        >
          Закрыть
        </button>
      </div>
    </Modal>
  );
};

export default BookingInfoModal;
