import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import useSWR from 'swr';
import BookingModal from '@/components/BookingModal';
import RoomModal from '@/components/RoomModal';
import BookingInfoModal from '@/components/BookingInfoModal';
import RoomInfoModal from '@/components/RoomInfoModal';
import { useCallback, useMemo, useState } from 'react';
import {
  EllipsisHorizontalIcon,
  BuildingOfficeIcon,
  KeyIcon,
} from '@heroicons/react/24/solid';
import { get100DayRange } from '@/lib/dates';
import Head from 'next/head';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server-props';
import BookingsCalendar from '@/components/BookingsCalendar';
import EmptyBookingsCalendar from '@/components/EmptyBookingsCalendar';
import { fetcher } from '@/lib/fetcher';
import { toast } from 'react-toastify';
import Layout from '@/components/Layout';
import CleaningObjects from '@/components/CleaningObjects';
import useSWRInfinite from 'swr/infinite';
import { format, addDays, startOfDay } from 'date-fns';

const dateRange = get100DayRange();

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  // this is to prevent supabase from treating avito code as its own supabase auth flow code
  if (context.query.code)
    return {
      redirect: {
        destination: `/avitoCallback?avitoCode=${context.query.code}&avitoState=${context.query.state}`,
        permanent: false,
      },
    };

  const supabase = createClient(context);

  const userRes = await supabase.auth.getUser();

  if (userRes.error || !userRes.data) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  const roomsOwner =
    userRes.data.user.user_metadata.related_to ?? userRes.data.user.id;

  const [roomsRes, bookingsRes, tokenRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_URL}/api/users/${roomsOwner}/rooms`),
    fetch(
      `${process.env.NEXT_PUBLIC_URL}/api/users/${roomsOwner}/bookings/?start=${dateRange.start}&end=${dateRange.end}`
    ),
    fetch(
      `${process.env.NEXT_PUBLIC_URL}/api/avito/accessToken?user_id=${userRes.data.user.id}`
    ),
  ]);

  const [initialRooms, initialBookings, tokenData]: [
    Room[],
    Booking[],
    AvitoTokenData
  ] = await Promise.all([roomsRes.json(), bookingsRes.json(), tokenRes.json()]);

  return {
    props: {
      user: userRes.data.user,
      fallback: {
        [`/api/users/${roomsOwner}/rooms`]: initialRooms,
        [`/api/users/${userRes.data.user.id}/bookings/?start=${dateRange.start}&end=${dateRange.end}`]:
          [initialBookings],
      },
      tokenData: tokenRes.ok ? tokenData : {},
    },
  };
};

type Props = {
  user: User;
  tokenData: AvitoTokenData;
  fallback?: Record<string, unknown>;
};

export default function Home({ user, tokenData }: Props) {

  // current bookings are bookings from today and in the future
  // old bookings are bookings from the past
  // we use swr infinite to fetch bookings in pages of 100 days
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));

  const getCurrentBookingsKey = useCallback(
    (pageIndex: number, previousPageData: Booking[] | null) => {
      if (previousPageData && previousPageData.length === 0) return null; // reached end

      const start = addDays(selectedDate, pageIndex * 100);
      const end = addDays(start, 100);

      return `/api/users/${user.id}/bookings/?start=${format(
        start,
        'yyyy-MM-dd'
      )}&end=${format(end, 'yyyy-MM-dd')}`;
    },
    [user.id, selectedDate]
  );

  const getOldBookingsKey = useCallback(
    (pageIndex: number, previousPageData: Booking[] | null) => {
      if (previousPageData && previousPageData.length === 0) return null; // reached end

      const end = addDays(selectedDate, -pageIndex * 100);
      const start = addDays(end, -100);

      return `/api/users/${user.id}/bookings/?start=${format(
        start,
        'yyyy-MM-dd'
      )}&end=${format(end, 'yyyy-MM-dd')}`;
    },
    [user.id, selectedDate]
  );
  const {
    data: currentBookingsData,
    setSize: setCurrentBookingsSize,
    mutate: mutateBookings,
  } = useSWRInfinite<Booking[]>(getCurrentBookingsKey, fetcher, {
    parallel: true,
  });
  const { data: oldBookingsData, setSize: setOldBookingsSize } = useSWRInfinite<
    Booking[]
  >(getOldBookingsKey, fetcher, { parallel: true });

  const currentBookings = useMemo(
    () => (currentBookingsData ? currentBookingsData.flat() : []),
    [currentBookingsData]
  );
  const oldBookings = useMemo(
    () => (oldBookingsData ? oldBookingsData.flat() : []),
    [oldBookingsData]
  );

  const increaseSize = async (
    sizeIncrement: number,
    bookings: 'current' | 'old'
  ) => {
    if (bookings === 'current') {
      setCurrentBookingsSize((prev) => prev + sizeIncrement);
    } else if (bookings === 'old') {
      setOldBookingsSize((prev) => prev + sizeIncrement);
    }
  };

  const roomsOwner = user.user_metadata.related_to ?? user.id;
  const { data: rooms, mutate: mutateRooms } = useSWR<Room[]>(
    `/api/users/${roomsOwner}/rooms`,
    fetcher
  );

  const { data: comments, mutate: mutateComments } = useSWR<RoomComment[]>(
    `/api/users/${roomsOwner}/comments`,
    fetcher
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

  if (!rooms || !currentBookings) return <div>Loading...</div>;

  return (
    <>
      <Head>
        <title>
          {user.user_metadata.role === 'cleaner'
            ? 'Объекты уборки'
            : 'Календарь брони'}
        </title>
        <meta
          name="description"
          content={
            user.user_metadata.role === 'cleaner'
              ? 'Объекты уборки'
              : 'Календарь брони'
          }
        />
      </Head>
      <div
        onClick={() => {
          setMenuOpen(false);
        }}
      >
        <Layout
          user={user}
          title={
            user.user_metadata.role === 'cleaner'
              ? `Объекты уборки • ${rooms.length} объект${
                  rooms.length > 1 ? 'а' : ''
                }`
              : `Календарь брони • ${rooms.length} объект${
                  rooms.length > 1 ? 'а' : ''
                }`
          }
          mainClassName="bg-radial-[at_100%_20%] from-[#2980B9] to-[#6DD5FA]"
          titleClassName={`${
            user.user_metadata.role === 'cleaner' ? 'max-w-[800px]' : ''
          } text-white`}
        >
          {user.user_metadata.role === 'cleaner' ? (
            <CleaningObjects
              rooms={rooms}
              mutateRooms={mutateRooms}
              user={user}
              comments={comments ?? []}
              mutateComments={mutateComments}
            />
          ) : (
            <>
              {rooms.length > 0 ? (
                <BookingsCalendar
                  rooms={rooms}
                  currentBookings={currentBookings}
                  oldBookings={oldBookings}
                  toggleModal={toggleModal}
                  increaseSize={increaseSize}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                />
              ) : (
                <EmptyBookingsCalendar toggleModal={toggleModal} />
              )}
            </>
          )}
        </Layout>
      </div>

      <div>
        {user.user_metadata.role !== 'cleaner' && (
          <button
            className="flex z-10 fixed justify-center items-center bottom-5 right-5 bg-amber-300 rounded-full h-12 w-12 p-2 hover:cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
          >
            <EllipsisHorizontalIcon />
          </button>
        )}
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
              onClick={() => {
                if (rooms.length > 0) {
                  toggleModal('addBooking', {
                    checkIn: new Date(),
                    roomId: rooms[0].id,
                  });
                } else {
                  toast.error('Нет помещений для добавления брони.');
                }
              }}
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
            mutateBookings={mutateBookings}
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
            avitoIntegrated={Object.keys(tokenData).length !== 0}
          />
        )}
        {modals.bookingInfo && (
          <BookingInfoModal
            isOpen={modals.bookingInfo}
            onClose={() => {
              toggleModal('bookingInfo');
            }}
            onEditOpen={() => {
              toggleModal('bookingInfo');
              toggleModal('addBooking', modalData as Booking);
            }}
            booking={modalData as Booking}
            user={user}
            mutateBookings={mutateBookings}
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
            comments={comments ?? []}
            mutateComments={mutateComments}
          />
        )}
      </div>
    </>
  );
}
