import { Inter } from 'next/font/google';
import { GetServerSideProps } from 'next';
import useSWR from 'swr';
import BookingModal from '@/components/BookingModal';
import RoomModal from '@/components/RoomModal';
import BookingInfoModal from '@/components/BookingInfoModal';
import RoomInfoModal from '@/components/RoomInfoModal';
import { useState } from 'react';
import {
  EllipsisHorizontalIcon,
  BuildingOfficeIcon,
  KeyIcon,
} from '@heroicons/react/24/solid';
import { get30DayRange } from '@/lib/dates';
import RoomStatusBadge from '@/components/RoomStatusBadge';
import useWindowWidth from '@/hooks/useWindowWidth';
import Head from 'next/head';

const inter = Inter({
  weight: ['300', '400', '500', '600', '700', '800'],
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

export default function Home({ initialRooms, initialBookings }: Props) {
  const LOCALE = 'ru-RU';
  const today = new Date();
  const currentYear = today.toLocaleDateString(LOCALE, { year: 'numeric' });

  const daysList = Array.from({ length: 30 }, (_, i) => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const date = today.getDate();

    return new Date(year, month, date + i);
  });

  const { data: rooms, mutate: mutateRooms } = useSWR<Room[]>(
    '/api/rooms',
    fetcher,
    { fallbackData: initialRooms }
  );
  const { data: bookings, mutate: mutateBookings } = useSWR<Booking[]>(
    `/api/bookings/?start=${dateRange.start}&end=${dateRange.end}`,
    fetcher,
    { fallbackData: initialBookings }
  );

  const [isMenuOpen, setMenuOpen] = useState(false);
  const [modals, setModals] = useState({
    addBooking: false,
    addRoom: false,
    bookingInfo: false,
    roomInfo: false,
  });
  const [modalData, setModalData] = useState<
    Record<string, unknown> | undefined
  >();
  const windowWidth = useWindowWidth() > 640;
  const bigScreen = windowWidth;

  // Helper function to toggle modals
  const toggleModal = (
    modal: keyof typeof modals,
    data?: Record<string, unknown> | undefined
  ) => {
    setModals((prev) => ({ ...prev, [modal]: !prev[modal] }));
    setModalData(data);
  };

  if (!rooms) return <div>Loading...</div>;

  // For months header rendering
  const seenMonths = new Set();

  return (
    <>
      <Head>
        <title>Календарь брони</title>
        <meta name="description" content="Календарь брони" />
      </Head>
      <div
        className={`${inter.className} min-h-screen sm:p-8 flex relative 
    bg-radial-[at_100%_20%] from-[#2980B9] to-[#6DD5FA]`}
        onClick={() => {
          setMenuOpen(false);
        }}
      >
        <main className="mx-auto w-full max-w-7xl">
          <h1 className="text-2xl sm:text-4xl font-extrabold pb-4 sm:pb-6 pt-4 px-4 text-white">
            Календарь брони
          </h1>
          <div className="py-4 bg-white rounded-xl flex gap-2 sm:gap-4 w-full overflow-hidden pl-2 sm:p-8">
            <div className="flex flex-col gap-2 sm:gap-3 w-max">
              <div className="text-md sm:text-xl font-semibold h-[25px] sm:h-[30px] text-gray-800">
                {currentYear}
              </div>
              <div className="h-[60px] sm:h-[80px]"></div>
              {rooms.map((room) => (
                <button
                  style={{ backgroundColor: room.color }}
                  className="text-white p-2 sm:p-3 rounded-lg text-center h-[45px] sm:h-[55px] flex items-center justify-center shadow-sm hover:shadow-md transition text-xs sm:text-sm gap-1 sm:min-w-[150px]"
                  onClick={() => toggleModal('roomInfo', room)}
                  key={room.id}
                >
                  <span className="font-bold">
                    {room.name.slice(0, 20)}
                    {room.name.length > 20 && '...'}
                  </span>
                  <span>
                    <RoomStatusBadge status={room.status} />
                  </span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-[repeat(30,40px)] sm:grid-cols-[repeat(30,50px)] overflow-x-auto gap-y-2 sm:gap-y-3 relative">
              {daysList.map((day) => {
                const month = day.toLocaleDateString(LOCALE, { month: 'long' });
                if (seenMonths.has(month))
                  return (
                    <div
                      className="w-[40px] sm:w-[50px] h-[25px] sm:h-[30px]"
                      key={day.getTime()}
                    ></div>
                  );
                seenMonths.add(month);
                return (
                  <div
                    className="text-md sm:text-lg font-medium capitalize h-[25px] sm:h-[30px] text-gray-700"
                    key={day.getTime()}
                  >
                    {month}
                  </div>
                );
              })}
              {daysList.map((day) => (
                <div
                  className="bg-gray-200 p-2 sm:p-3 border border-gray-300 rounded-lg flex flex-col items-center justify-center h-[60px] sm:h-[80px] w-[40px] sm:w-[50px]"
                  key={day.toISOString()}
                >
                  <p className="text-base sm:text-lg font-semibold text-gray-900">
                    {day.toLocaleDateString(LOCALE, { day: 'numeric' })}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {day.toLocaleDateString(LOCALE, { weekday: 'short' })}
                  </p>
                </div>
              ))}
              {rooms.map((room) =>
                daysList.map((day, dayIndex) => (
                  <button
                    className="border border-gray-300 p-2 h-[45px] sm:h-[55px] w-[40px] sm:w-[50px] flex items-center justify-center bg-white hover:bg-gray-100 transition"
                    onClick={() =>
                      toggleModal('addBooking', {
                        checkIn: day,
                        roomId: room.id,
                      })
                    }
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
                const hourPixelRate = bigScreen ? 50 / 24 : 40 / 24;

                // if the checkIn earlier than yesterday than no offset by x
                const hoursOffset = Math.max(
                  0,
                  (checkInDate.getTime() - yesterday.getTime()) / 36e5
                );
                const x = hoursOffset * hourPixelRate;

                let hours =
                  (checkOutDate.getTime() - checkInDate.getTime()) / 36e5;
                if (checkInDate < yesterday) {
                  hours = (checkOutDate.getTime() - yesterday.getTime()) / 36e5;
                } else if (checkOutDate > lastDay) {
                  hours =
                    (lastDay.getTime() - checkInDate.getTime()) / 36e5 + 24;
                }
                const width = hours * hourPixelRate;

                const y = bigScreen
                  ? 30 + 12 + 80 + 12 + roomIndex * (55 + 12)
                  : 25 + 8 + 60 + 8 + roomIndex * (45 + 8);

                const borderRadius = `${
                  checkInDate <= yesterday ? '0' : '1rem'
                } 
                ${checkOutDate >= lastDay ? '0' : '1rem'} 
                ${checkOutDate >= lastDay ? '0' : '1rem'} 
                ${checkInDate <= yesterday ? '0' : '1rem'}`;

                return (
                  <div
                    key={booking.id}
                    className={`${
                      booking.paid ? 'bg-blue-500' : 'bg-red-500'
                    } text-white p-2 h-[45px] sm:h-[55px] flex items-center justify-center absolute truncate shadow-lg rounded-lg text-xs sm:text-sm`}
                    style={{
                      top: `${y}px`,
                      left: `${x}px`,
                      width: `${width}px`,
                      borderRadius,
                    }}
                    onClick={() => toggleModal('bookingInfo', booking)}
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
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
          >
            <EllipsisHorizontalIcon />
          </button>
          {/*
          DO NOT CHANGE MENU TO MODAL
          MODAL HAS SHADED BACKDROP WHICH IS NOT NEEDED IN MENU
          */}
          {isMenuOpen && (
            <div className="bg-white fixed bottom-18 sm:bottom-20 right-5 z-20 shadow-lg rounded-lg text-sm sm:text-base">
              <button
                className="flex items-center gap-2 focus-visible:bg-gray-100 px-6 py-4 sm:py-4 hover:cursor-pointer hover:bg-gray-100 w-full"
                onClick={() => toggleModal('addRoom')}
              >
                <BuildingOfficeIcon className="w-5 sm:w-6 h-5 sm:h-6" />
                <p>Добавить комнату</p>
              </button>
              <button
                className="flex items-center gap-2 focus-visible:bg-gray-100 px-6 py-4  hover:cursor-pointer hover:bg-gray-100 w-full"
                onClick={() =>
                  toggleModal('addBooking', {
                    checkIn: new Date(),
                    roomId: rooms[0].id,
                  })
                }
              >
                <KeyIcon className="w-5 sm:w-6 h-5 sm:h-6" />
                <p>Забронировать </p>
              </button>
            </div>
          )}
          {modals.addBooking && (
            <BookingModal
              isOpen={modals.addBooking}
              onClose={() => {
                toggleModal('addBooking');
                mutateBookings();
              }}
              rooms={rooms}
              bookingData={
                modalData as
                  | Booking
                  | {
                      checkIn: Date;
                      roomId: number;
                    }
              }
            />
          )}
          {modals.addRoom && (
            <RoomModal
              isOpen={modals.addRoom}
              onClose={() => {
                toggleModal('addRoom');
                mutateRooms();
              }}
              roomData={modalData as Room}
            />
          )}
          {modals.bookingInfo && (
            <BookingInfoModal
              isOpen={modals.bookingInfo}
              onClose={() => {
                toggleModal('bookingInfo');
                mutateBookings();
              }}
              onEditOpen={() => {
                toggleModal('bookingInfo');
                toggleModal('addBooking', modalData as Booking);
              }}
              booking={modalData as Booking}
            />
          )}
          {modals.roomInfo && (
            <RoomInfoModal
              isOpen={modals.roomInfo}
              onClose={() => {
                toggleModal('roomInfo');
                mutateRooms();
                mutateBookings();
              }}
              onEditOpen={() => {
                toggleModal('roomInfo');
                toggleModal('addRoom', modalData as Room);
              }}
              room={modalData as Room}
            />
          )}
        </div>
      </div>
    </>
  );
}
