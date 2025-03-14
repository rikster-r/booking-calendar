import Modal from '@/components/Modal';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
};

const BookingInfoModal = ({ isOpen, onClose, booking }: Props) => {
  if (!booking) return null;

  const check_in = new Date(booking.check_in);
  const check_out = new Date(booking.check_out);

  const deleteBooking = async () => {
    const res = await fetch(`/api/bookings/${booking.id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      // onClose here is also supposed to mutate rooms
      onClose();
    }
  };

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
        <span className="font-semibold">Телефон:</span> {booking.client_phone}
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
        <span className="font-semibold">Код двери:</span> {booking.door_code}
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
      <div className="mt-4 flex justify-end flex-row gap-2">
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
