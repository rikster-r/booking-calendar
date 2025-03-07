import { Geist } from 'next/font/google';
import { GetServerSideProps } from 'next';
import useSWR from 'swr';
import BookingModal from '@/components/BookingModal';
import RoomModal from '@/components/RoomModal';
import { useState } from 'react';
import {
  EllipsisHorizontalIcon,
  BuildingOfficeIcon,
  KeyIcon,
} from '@heroicons/react/24/solid';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const getServerSideProps: GetServerSideProps = async () => {
  let res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/rooms`);
  const initialRooms: Room[] = await res.json();
  res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/bookings`);
  const initialBookings: Booking[] = await res.json();

  return {
    props: { initialRooms, initialBookings },
  };
};

type Props = {
  initialRooms: Room[];
  initialBookings: Booking[];
};

export default function Home({ initialRooms }: Props) {
  const LOCALE = 'ru-RU';
  const today = new Date();
  const currentYear = today.toLocaleDateString('ru-RU', { year: 'numeric' });

  const daysList = Array.from({ length: 30 }, (_, i) => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const date = today.getDate();

    const day = new Date(year, month - 1, date + i);
    return [
      day.toLocaleDateString(LOCALE, { day: 'numeric' }),
      day.toLocaleDateString(LOCALE, {
        weekday: 'short',
      }),
    ];
  });

  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isBookingModalOpen, setBookingModalOpen] = useState(false);
  const [isRoomModalOpen, setRoomModalOpen] = useState(false);

  const { data: rooms, mutate: mutateRooms } = useSWR<Room[]>(
    '/api/rooms',
    fetcher,
    {
      fallbackData: initialRooms,
    }
  );
  const { data: bookings, mutate: mutateBookings } = useSWR<Booking[]>(
    '/api/bookings',
    fetcher
  );

  const addRoom = async (data: RoomInput) => {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      mutateRooms();
    }
  };

  const addBooking = async (data: BookingInput) => {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      mutateBookings();
    }
  };

  if (!rooms) return <div>Loading...</div>;

  return (
    <div
      className={`${geistSans.variable} min-h-screen p-2 pb-20 gap-16 sm:p-8 font-[family-name:var(--font-geist-sans)] flex relative`}
    >
      <main className="mx-auto">
        <h1 className="text-2xl sm:text-4xl font-bold pb-4">Календарь брони</h1>
        <div className="p-2 sm:p-4 bg-gray-100 flex gap-2 w-full max-w-screen">
          <div className="flex flex-col gap-2 w-[100px]">
            <div className="text-lg font-bold h-[70px]">{currentYear}</div>
            {rooms.map((room) => (
              <div
                className="bg-blue-700 text-white p-2 rounded-md text-center h-[50px] flex items-center justify-center"
                key={room.id}
              >
                {room.name}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[repeat(30,50px)] gap-2 overflow-x-scroll">
            {daysList.map(([day, weekday], i) => (
              <div
                className="bg-gray-300 p-2 rounded-md flex flex-col items-center justify-center h-[70px] w-[50px]"
                key={i}
              >
                <p>{day}</p>
                <p>{weekday}</p>
              </div>
            ))}
            {Array.from({ length: 30 * rooms.length }).map((_, i) => (
              <div
                className="bg-gray-300 p-2 rounded-md h-[50px] w-[50px] flex items-center justify-center"
                key={i}
              ></div>
            ))}
          </div>
        </div>
      </main>
      <div>
        <button
          className="flex z-10 fixed justify-center items-center bottom-5 right-5 bg-amber-300 rounded-full h-12 w-12 p-2 hover:cursor-pointer"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <EllipsisHorizontalIcon />
        </button>
        {isMenuOpen && (
          <div className="bg-white fixed bottom-20 right-5 z-20 shadow-lg rounded-lg">
            <button
              className="flex items-center gap-2 rounded-md transition focus-visible:bg-gray-100 px-6 py-4 hover:cursor-pointer hover:bg-gray-100 w-full"
              onClick={() => setRoomModalOpen(true)}
            >
              <BuildingOfficeIcon className="w-6 h-6" />
              <p>Добавить комнату</p>
            </button>
            <button
              className="flex items-center gap-2 rounded-md transition focus-visible:bg-gray-100 px-6 py-4 hover:cursor-pointer hover:bg-gray-100 w-full"
              onClick={() => setBookingModalOpen(true)}
            >
              <KeyIcon className="w-6 h-6" />
              <p>Забронировать </p>
            </button>
          </div>
        )}
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          addBooking={addBooking}
          rooms={rooms}
        />
        <RoomModal
          isOpen={isRoomModalOpen}
          onClose={() => setRoomModalOpen(false)}
          addRoom={addRoom}
        />
      </div>
    </div>
  );
}
