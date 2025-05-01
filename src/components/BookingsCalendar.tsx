import React, { useEffect, useRef } from 'react';
import RoomStatusBadge from './RoomStatusBadge';
import useWindowWidth from '@/hooks/useWindowWidth';
import { addDays } from 'date-fns';
import { useState } from 'react';

const LOCALE = 'ru-RU';

type Props = {
  rooms: Room[];
  bookings: Booking[];
  toggleModal: (
    modal: 'addBooking' | 'addRoom' | 'bookingInfo' | 'roomInfo',
    data?: Record<string, unknown> | undefined
  ) => void;
  setBookingsSize: (
    size: number | ((_size: number) => number)
  ) => Promise<Booking[][] | undefined>;
};

const BookingsCalendar = ({
  rooms,
  bookings,
  toggleModal,
  setBookingsSize,
}: Props) => {
  const today = new Date();
  const [dateInView, setDateInView] = useState(today);
  const windowWidth = useWindowWidth();
  const bigScreen = windowWidth > 1024;
  const maxNameLength = bigScreen ? 20 : 10;

  const [daysList, setDaysList] = useState<Date[]>(() => {
    // Today starts at current time, other dates are at 00:00 for convenience
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    return [
      today,
      ...Array.from({ length: 99 }, (_, i) => addDays(startOfDay, i + 1)),
    ];
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadMoreDays = async () => {
    setDaysList((prev) => {
      const lastDate = prev[prev.length - 1];
      const newDays = Array.from({ length: 100 }, (_, i) =>
        addDays(lastDate, i + 1)
      );
      return [...prev, ...newDays];
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const nearEnd = scrollLeft + clientWidth >= scrollWidth - 2000;

      if (nearEnd) {
        loadMoreDays();
        setBookingsSize((size) => size + 3);
      }
    };

    const ref = scrollRef.current;
    if (!ref) return;
    ref.addEventListener('scroll', handleScroll);
    return () => ref.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const calculateLeftMostCellMonth = () => {
      if (scrollRef.current) {
        const { scrollLeft } = scrollRef.current;
        const cellWidth = bigScreen ? 45 : 38;
        const leftMostCellIndex = Math.floor(scrollLeft / cellWidth);
        const leftMostCellDate = daysList[leftMostCellIndex];
        if (leftMostCellDate) {
          setDateInView(leftMostCellDate);
        }
      }
    };

    const ref = scrollRef.current;
    if (!ref) return;
    ref.addEventListener('scroll', calculateLeftMostCellMonth);
    return () => ref.removeEventListener('scroll', calculateLeftMostCellMonth);
  }, [daysList, bigScreen]);

  return (
    <div className="lg:px-8 h-full">
      <div className="py-4 bg-white rounded-t-xl flex gap-2 lg:gap-4 overflow-hidden pl-2 lg:p-8 w-full max-w-max mx-auto h-full text-sm">
        <div className="flex flex-col gap-y-1">
          <div className="text-sm lg:text-base font-semibold h-[20px] lg:h-[25px] text-gray-800">
            {dateInView.toLocaleDateString(LOCALE, {
              month: 'long',
              year: 'numeric',
            })}
          </div>
          <div className="h-[60px] lg:h-[70px] my-1"></div>
          {rooms.map((room) => (
            <button
              style={{ backgroundColor: room.color }}
              className="text-white p-2 lg:p-3 rounded-lg text-center h-[38px] lg:h-[45px] flex items-center justify-center shadow-md text-[10px] lg:text-xs gap-1 w-[120px] lg:w-[180px]"
              onClick={() => toggleModal('roomInfo', room)}
              key={room.id}
            >
              <span className="font-semibold text-nowrap">
                {room.name.slice(0, maxNameLength)}
                {room.name.length > maxNameLength && '...'}
              </span>
              <span>
                <RoomStatusBadge room={room} />
              </span>
            </button>
          ))}
        </div>
        <div
          ref={scrollRef}
          className="grid overflow-x-auto relative content-start gap-y-1"
          style={{
            gridTemplateColumns: `repeat(${daysList.length}, ${
              bigScreen ? '45px' : '38px'
            })`,
          }}
        >
          {daysList.map((day, index) => {
            const month = day.toLocaleDateString(LOCALE, { month: 'long' });
            const isFirstOfMonth =
              index === 0 || day.getMonth() !== daysList[index - 1].getMonth();
            return isFirstOfMonth ? (
              <div
                className="text-sm lg:text-base font-medium capitalize h-[20px] lg:h-[25px] text-gray-700"
                key={day.getTime()}
              >
                {month}
              </div>
            ) : (
              <div
                className="w-full h-[20px] lg:h-[25px]"
                key={day.getTime()}
              ></div>
            );
          })}
          {daysList.map((day) => (
            <div
              className="bg-gray-200 p-2 border border-gray-300 rounded-lg flex flex-col items-center justify-center h-[60px] lg:h-[70px] w-full my-1"
              key={day.getTime()}
            >
              <p className="text-sm lg:text-base font-semibold text-gray-900">
                {day.toLocaleDateString(LOCALE, { day: 'numeric' })}
              </p>
              <p className="text-[10px] lg:text-xs text-gray-500">
                {day.toLocaleDateString(LOCALE, { weekday: 'short' })}
              </p>
            </div>
          ))}
          {rooms.map((room) =>
            daysList.map((day) => {
              return (
                <button
                  className="border border-gray-300 p-2 h-[38px] lg:h-[45px] w-full flex items-center justify-center bg-white hover:bg-gray-100 transition"
                  onClick={() =>
                    toggleModal('addBooking', {
                      checkIn: day,
                      roomId: room.id,
                    })
                  }
                  key={`${room.id}-${day.getTime()}`}
                ></button>
              );
            })
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
            const hourPixelRate = bigScreen ? 45 / 24 : 38 / 24;
            const hoursOffset = Math.max(
              0,
              (checkInDate.getTime() - yesterday.getTime()) / 36e5
            );
            const x = hoursOffset * hourPixelRate;
            let hours = (checkOutDate.getTime() - checkInDate.getTime()) / 36e5;
            if (checkInDate < yesterday) {
              hours = (checkOutDate.getTime() - yesterday.getTime()) / 36e5;
            } else if (checkOutDate > lastDay) {
              hours = (lastDay.getTime() - checkInDate.getTime()) / 36e5 + 24;
            }
            const width = hours * hourPixelRate;
            const y = bigScreen
              ? 25 + 8 + 70 + 8 + roomIndex * (45 + 4)
              : 20 + 8 + 60 + 8 + roomIndex * (38 + 4);
            const borderRadius = `${checkInDate <= yesterday ? '0' : '1rem'}
              ${checkOutDate >= lastDay ? '0' : '1rem'}
              ${checkOutDate >= lastDay ? '0' : '1rem'}
              ${checkInDate <= yesterday ? '0' : '1rem'}`;
            return (
              <div
                key={booking.id}
                className={`${
                  booking.paid ? 'bg-blue-500' : 'bg-red-500'
                } text-white p-2 h-[38px] lg:h-[45px] flex items-center justify-center absolute truncate shadow-lg rounded-lg text-xs lg:text-sm`}
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
    </div>
  );
};

export default BookingsCalendar;
