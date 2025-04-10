import HouseSearch from '@/assets/house-search.svg';
import Image from 'next/image';

type Props = {
  toggleModal: (
    modal: 'addBooking' | 'addRoom' | 'bookingInfo' | 'roomInfo',
    data?: Record<string, unknown> | undefined
  ) => void;
};

const EmptyBookingsCalendar = ({ toggleModal }: Props) => {
  return (
    <div className="h-full w-full lg:px-8">
      <div className="p-4 bg-white rounded-t-xl flex justify-center items-center w-full max-w-[1800px] mx-auto h-full flex-col text-center">
        <Image src={HouseSearch} alt="" className="w-16 h-16" />
        <h2 className="text-lg font-semibold text-gray-900 mt-6">
          У вас пока нет помещений
        </h2>
        <p className="mt-1 text-gray-500">
          Добавьте своё первое помещение прямо сейчас.
        </p>
        <button
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-xl shadow hover:bg-blue-600 transition hover:cursor-pointer"
          onClick={() => toggleModal('addRoom')}
        >
          Добавить помещение
        </button>
      </div>
    </div>
  );
};

export default EmptyBookingsCalendar;
