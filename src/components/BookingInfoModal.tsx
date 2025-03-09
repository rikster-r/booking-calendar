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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-2xl font-bold mb-4">Информация о брони</h2>
      <div className="mb-2">
        <span className="font-semibold">Имя:</span> {booking.client_name}
      </div>
      <div className="mb-2">
        <span className="font-semibold">Фамилия/Фирма:</span>{' '}
        {booking.client_surname}
      </div>
      <div className="mb-2">
        <span className="font-semibold">Электронный адрес:</span>{' '}
        {booking.client_email}
      </div>
      <div className="mb-2">
        <span className="font-semibold">Телефон:</span> {booking.client_phone}
      </div>
      <div className="mb-2">
        <span className="font-semibold mr-1">Приезд</span>
        {check_in.toLocaleDateString()} {check_in.toLocaleTimeString()}
      </div>
      <div className="mb-2">
        <span className="font-semibold mr-1">Выезд:</span>
        {check_out.toLocaleDateString()} {check_out.toLocaleTimeString()}
      </div>
      <div className="mb-2">
        <span className="font-semibold">Гости:</span> {booking.adults_count}{' '}
        взрослых, {booking.children_count} детей
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 hover:cursor-pointer"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default BookingInfoModal;
