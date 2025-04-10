import { GetServerSideProps, GetServerSidePropsContext } from 'next';
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
import Head from 'next/head';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server-props';
import BookingsCalendar from '@/components/BookingsCalendar';
import Sidebar from '@/components/Sidebar';
import EmptyBookingsCalendar from '@/components/EmptyBookingsCalendar';
import { fetcher } from '@/lib/fetcher';

const dateRange = get30DayRange();

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const supabase = createClient(context);

  const userRes = await supabase.auth.getUser();

  if (userRes.error || !userRes.data) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  const [roomsRes, bookingsRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_URL}/api/${userRes.data.user.id}/rooms`),
    fetch(
      `${process.env.NEXT_PUBLIC_URL}/api/${userRes.data.user.id}/bookings/?start=${dateRange.start}&end=${dateRange.end}`
    ),
  ]);

  const [initialRooms, initialBookings]: [Room[], Booking[]] =
    await Promise.all([roomsRes.json(), bookingsRes.json()]);

  return { props: { initialRooms, initialBookings, user: userRes.data.user } };
};

type Props = {
  initialRooms: Room[];
  initialBookings: Booking[];
  user: User;
};

export default function Home({ initialRooms, initialBookings, user }: Props) {
  const { data: rooms, mutate: mutateRooms } = useSWR<Room[]>(
    `/api/${user.id}/rooms`,
    fetcher,
    { fallbackData: initialRooms }
  );
  const { data: bookings, mutate: mutateBookings } = useSWR<Booking[]>(
    `/api/${user.id}/bookings/?start=${dateRange.start}&end=${dateRange.end}`,
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

  // Helper function to toggle modals
  const toggleModal = (
    modal: keyof typeof modals,
    data?: Record<string, unknown> | undefined
  ) => {
    setModals((prev) => ({ ...prev, [modal]: !prev[modal] }));
    setModalData(data);
  };

  if (!rooms || !bookings) return <div>Loading...</div>;

  return (
    <>
      <Head>
        <title>Календарь брони</title>
        <meta name="description" content="Календарь брони" />
      </Head>
      <div
        className="min-h-screen flex relative"
        onClick={() => {
          setMenuOpen(false);
        }}
      >
        <main className="mx-auto w-full lg:w-[calc(100%-320px)] bg-radial-[at_100%_20%] from-[#2980B9] to-[#6DD5FA] lg:ml-80 flex flex-col">
          <div className="flex items-center">
            <Sidebar user={user} />
            <div className="w-full max-w-[1800px] mx-auto">
              <h1 className="text-xl font-bold pb-4 lg:pb-6 pt-4 text-white lg:pl-8 text-left lg:mt-4">
                Календарь брони
              </h1>
            </div>
          </div>

          {rooms.length > 0 ? (
            <BookingsCalendar
              rooms={rooms}
              bookings={bookings}
              toggleModal={toggleModal}
            />
          ) : (
            <EmptyBookingsCalendar toggleModal={toggleModal} />
          )}
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
            <div className="bg-white fixed bottom-18 lg:bottom-20 right-5 z-20 shadow-lg rounded-lg text-sm lg:text-base">
              <button
                className="flex items-center gap-2 focus-visible:bg-gray-100 px-6 py-4 lg:py-4 hover:cursor-pointer hover:bg-gray-100 w-full"
                onClick={() => toggleModal('addRoom')}
              >
                <BuildingOfficeIcon className="w-5 lg:w-6 h-5 lg:h-6" />
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
                <KeyIcon className="w-5 lg:w-6 h-5 lg:h-6" />
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
              user={user}
            />
          )}
          {modals.addRoom && (
            <RoomModal
              isOpen={modals.addRoom}
              onClose={() => {
                toggleModal('addRoom');
                mutateRooms();
              }}
              user={user}
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
              user={user}
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
              user={user}
            />
          )}
        </div>
      </div>
    </>
  );
}
