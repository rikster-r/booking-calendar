import { Geist } from 'next/font/google';
import { GetServerSideProps } from 'next';
import useSWR from 'swr';
import BookingModal from '@/components/BookingModal';
import RoomModal from '@/components/RoomModal';
import BookingInfoModal from '@/components/BookingInfoModal';
import { useState } from 'react';
import {
  EllipsisHorizontalIcon,
  BuildingOfficeIcon,
  KeyIcon,
} from '@heroicons/react/24/solid';
import { get30DayRange } from '@/lib/dates';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const dateRange = get30DayRange();

export const getServerSideProps: GetServerSideProps = async () => {
  const [roomsRes, bookingsRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_URL}/api/rooms`),
    fetch(
      `${process.env.NEXT_PUBLIC_URL}/api/bookings/?start=${dateRange.start}&end=${dateRange.end}`
    ),
  ]);

  const [initialRooms, initialBookings]: [Room[], Booking[]] =
    await Promise.all([roomsRes.json(), bookingsRes.json()]);

  return { props: { initialRooms, initialBookings } };
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

    return new Date(year, month, date + i);
  });

  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isBookingModalOpen, setBookingModalOpen] = useState(false);
  const [isRoomModalOpen, setRoomModalOpen] = useState(false);
  const [isRoomInfoModalOpen, setRoomInfoModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const { data: rooms, mutate: mutateRooms } = useSWR<Room[]>(
    '/api/rooms',
    fetcher,
    {
      fallbackData: initialRooms,
    }
  );
  const { data: bookings, mutate: mutateBookings } = useSWR<Booking[]>(
    `/api/bookings/?start=${dateRange.start}&end=${dateRange.end}`,
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

  const openBookingModal = (date: Date, roomId: number) => {
    setSelectedDate(date);
    setSelectedRoomId(roomId);
    setBookingModalOpen(true);
  };

  const openBookingInfoModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setRoomInfoModalOpen(true);
  };

  if (!rooms) return <div>Loading...</div>;

  // For months header rendering
  const seenMonths = new Set();

  return (
    <div
      className={`${geistSans.variable} min-h-screen p-2 pb-20 gap-16 sm:p-8 font-[family-name:var(--font-geist-sans)] flex relative`}
    >
      <main className="mx-auto w-full">
        <h1 className="text-2xl sm:text-4xl font-bold pb-4">Календарь брони</h1>
        <div className="p-2 sm:p-4 bg-gray-100 flex gap-2 w-full max-w-screen">
          <div className="flex flex-col gap-2 w-[100px]">
            <div className="text-lg font-bold h-[25px]">{currentYear}</div>
            <div className="h-[70px]"></div>
            {rooms.map((room) => (
              <>
                <div
                  className="bg-blue-700 text-white p-2 rounded-md text-center h-[50px] flex items-center justify-center"
                  key={room.id}
                >
                  {room.name}
                </div>
              </>
            ))}
          </div>
          <div className="grid grid-cols-[repeat(30,48px)] overflow-x-scroll gap-y-2 relative">
            {daysList.map((day, i) => {
              const month = day.toLocaleDateString(LOCALE, { month: 'long' });

              if (seenMonths.has(month)) {
                return <div className="w-[48px]" key={i}></div>;
              }

              seenMonths.add(month);
              return (
                <div className="text-lg font-bold capitalize h-[25px]" key={i}>
                  {month}
                </div>
              );
            })}
            {daysList.map((day, i) => (
              <div
                className="bg-gray-300 p-2 border-1 border-gray-400 rounded-md flex flex-col items-center justify-center h-[70px] w-[48px]"
                key={i}
              >
                <p>{day.toLocaleDateString(LOCALE, { day: 'numeric' })}</p>
                <p>
                  {day.toLocaleDateString(LOCALE, {
                    weekday: 'short',
                  })}
                </p>
              </div>
            ))}
            {rooms.map((room) =>
              daysList.map((day, dayIndex) => (
                <button
                  className="border-1 border-gray-400 p-2 rounded-md h-[50px] w-[48px] flex items-center justify-center"
                  onClick={() => {
                    openBookingModal(day, room.id);
                  }}
                  key={`${room.id}-${dayIndex}`}
                ></button>
              ))
            )}
            {bookings?.map((booking) => {
              const roomIndex = rooms.findIndex(
                (room) => room.id === booking.room_id
              );
              if (roomIndex === -1) return null;

              const checkInDate = new Date(booking.check_in);
              const checkOutDate = new Date(booking.check_out);

              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              yesterday.setHours(23, 59, 0, 0);

              const lastDay = daysList[daysList.length - 1];

              const hoursOffset = Math.max(
                0,
                (checkInDate.getTime() - yesterday.getTime()) / 36e5
              );
              const x = hoursOffset * 2;

              let hours =
                (checkOutDate.getTime() - checkInDate.getTime()) / 36e5;
              if (checkInDate < yesterday) {
                hours = (checkOutDate.getTime() - yesterday.getTime()) / 36e5;
              } else if (checkOutDate > lastDay) {
                hours = (lastDay.getTime() - checkInDate.getTime()) / 36e5 + 24;
              }

              const width = hours * 2;

              // 25px - months header, 8px - gap, 70px - days header, 8px - gap
              const y = 25 + 8 + 70 + 8 + roomIndex * (50 + 8);

              const borderRadius = `${
                checkInDate <= yesterday ? '0' : '1rem'
              } ${checkOutDate >= lastDay ? '0' : '1rem'} ${
                checkOutDate >= lastDay ? '0' : '1rem'
              } ${checkInDate <= yesterday ? '0' : '1rem'}`;

              return (
                <div
                  key={booking.id}
                  className="bg-red-400 p-2 h-[50px] flex items-center justify-center absolute"
                  style={{
                    top: `${y}px`,
                    left: `${x}px`,
                    width: `${width}px`,
                    borderRadius,
                  }}
                  onClick={() => openBookingInfoModal(booking)}
                >
                  {booking.client_name}
                </div>
              );
            })}
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
              onClick={() => openBookingModal(today, rooms[0].id)}
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
          selectedDate={selectedDate}
          selectedRoomId={selectedRoomId}
        />
        <RoomModal
          isOpen={isRoomModalOpen}
          onClose={() => setRoomModalOpen(false)}
          addRoom={addRoom}
        />
        <BookingInfoModal
          isOpen={isRoomInfoModalOpen}
          onClose={() => setRoomInfoModalOpen(false)}
          booking={selectedBooking}
        />
      </div>
    </div>
  );
}
