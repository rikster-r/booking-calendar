import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import useWindowWidth from '@/hooks/useWindowWidth';
import { addDays, startOfDay } from 'date-fns';
import CalendarDatePicker from './CalendarDatePicker';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KeyedMutator } from 'swr';
import SortableRoomItem from './SortableRoom';
import { User } from '@supabase/supabase-js';
import { toast } from 'react-toastify';

const LOCALE = 'ru-RU';
const PAST_DAYS = 100;
const FUTURE_DAYS = 100;

type Props = {
  user: User;
  rooms: Room[];
  mutateRooms: KeyedMutator<Room[]>;
  currentBookings: Booking[];
  oldBookings: Booking[];
  toggleModal: (
    modal: 'addBooking' | 'addRoom' | 'bookingInfo' | 'roomInfo',
    data?: Record<string, unknown>
  ) => void;
  increaseSize: (
    sizeIncrement: number,
    bookings: 'current' | 'old'
  ) => Promise<void>;
  selectedDate: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
};

const BookingsCalendar = ({
  user,
  rooms,
  mutateRooms,
  oldBookings,
  currentBookings,
  toggleModal,
  increaseSize,
  setSelectedDate,
}: Props) => {
  const today = startOfDay(new Date());
  const [dateInView, setDateInView] = useState(new Date());
  const windowWidth = useWindowWidth();
  const bigScreen = windowWidth > 1024;
  const cellWidth = bigScreen ? 45 : 38;
  const maxNameLength = bigScreen ? 20 : 10;
  // includes the months, the day cells and gap between
  const topOffset = bigScreen ? 25 + 8 + 70 + 8 : 4 + 60 + 8;
  const hourPixel = cellWidth / 24;

  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingPrepend = useRef<{
    oldScrollWidth: number;
    oldScrollLeft: number;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // drag only activates after 8px movement
        tolerance: 500
      },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rooms.findIndex((r) => r.id === active.id);
    const newIndex = rooms.findIndex((r) => r.id === over.id);
    const newItems = arrayMove(rooms, oldIndex, newIndex);

    const reorderedRooms = newItems.map((room, index) => ({
      ...room,
      order: index,
    }));

    // Оптимистичное обновление
    mutateRooms(
      async () => {
        const res = await fetch(`/api/users/${user.id}/rooms/order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rooms: reorderedRooms.map(({ id, order }) => ({
              id,
              order,
            })),
          }),
        });

        if (!res.ok) {
          toast.error('Ошибка при изменении порядка комнат');
          throw new Error('Ошибка при изменении порядка комнат');
        }

        return reorderedRooms;
      },
      {
        optimisticData: reorderedRooms,
        rollbackOnError: true,
        populateCache: true,
        revalidate: false,
      }
    );
  };

  const [daysList, setDaysList] = useState(() => {
    const past = Array.from({ length: PAST_DAYS }, (_, i) =>
      addDays(today, -(PAST_DAYS - i))
    );
    const future = Array.from({ length: FUTURE_DAYS }, (_, i) =>
      addDays(today, i + 1)
    );
    return [...past, today, ...future];
  });

  const scrollToToday = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollLeft = PAST_DAYS * cellWidth;
  }, [cellWidth]);

  const handleDateChange = (date: Date) => {
    const newDate = startOfDay(date);
    setSelectedDate(newDate);

    // Rebuild daysList centered around the selected date
    const past = Array.from({ length: PAST_DAYS }, (_, i) =>
      addDays(newDate, -(PAST_DAYS - i))
    );
    const future = Array.from({ length: FUTURE_DAYS }, (_, i) =>
      addDays(newDate, i + 1)
    );
    const newDaysList = [...past, newDate, ...future];
    setDaysList(newDaysList);
    setDateInView(newDate);

    // Scroll to the selected date
    setTimeout(() => scrollToToday(), 0);
  };

  useLayoutEffect(() => {
    scrollToToday();
  }, [cellWidth, scrollToToday]);

  const loadMoreDaysToRight = () =>
    setDaysList((prev) => {
      const last = prev[prev.length - 1];
      const more = Array.from({ length: FUTURE_DAYS }, (_, i) =>
        addDays(last, i + 1)
      );
      return [...prev, ...more];
    });

  const loadMoreDaysToLeft = () =>
    setDaysList((prev) => {
      const container = scrollRef.current;
      if (!container) return prev;

      pendingPrepend.current = {
        oldScrollWidth: container.scrollWidth,
        oldScrollLeft: container.scrollLeft,
      };

      const first = prev[0];
      const more = Array.from({ length: PAST_DAYS }, (_, i) =>
        addDays(first, -(PAST_DAYS - i))
      );

      return [...more, ...prev];
    });

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container || !pendingPrepend.current) return;

    const { oldScrollWidth, oldScrollLeft } = pendingPrepend.current;
    container.scrollLeft =
      oldScrollLeft + (container.scrollWidth - oldScrollWidth);

    pendingPrepend.current = null;
  }, [daysList]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const onScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      if (scrollLeft < 2000) {
        loadMoreDaysToLeft();
        increaseSize(1, 'old');
      }
      if (scrollLeft + clientWidth >= scrollWidth - 2000) {
        loadMoreDaysToRight();
        increaseSize(1, 'current');
      }

      const index = Math.floor(scrollLeft / cellWidth);
      const visibleDate = daysList[index];
      if (visibleDate) setDateInView(visibleDate);
    };

    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, [daysList, cellWidth, increaseSize]);

  return (
    <div className="lg:px-8 h-full">
      <div className="py-4 bg-white rounded-t-xl gap-2 lg:gap-4 overflow-hidden pl-2 lg:p-8 w-full max-w-max mx-auto h-full text-sm">
        <div className="flex ml-auto w-max gap-x-2 mr-2 mb-2">
          <button
            className="rounded-full bg-gray-100 px-4 py-2 cursor-pointer text-black text-sm text-center"
            onClick={() => handleDateChange(today)}
          >
            <span className="mr-2">Сегодня</span>
          </button>
          <CalendarDatePicker
            selectedDate={dateInView}
            onDateChange={handleDateChange}
            startDate={dateInView}
          />
        </div>

        <div className="flex gap-2 lg:gap-4 oveflow-hidden">
          <div className="flex-col gap-y-1 flex">
            <div className="text-sm lg:text-base font-semibold h-[20px] lg:h-[25px] text-gray-800 hidden lg:block">
              {dateInView.toLocaleDateString(LOCALE, {
                month: 'long',
                year: 'numeric',
              })}
            </div>

            <div className="h-[60px] lg:h-[70px] my-1 font-semibold">
              <p className=""></p>
              {!bigScreen &&
                dateInView
                  .toLocaleDateString(LOCALE, {
                    month: 'long',
                    year: 'numeric',
                  })
                  .slice(0, 1)
                  .toUpperCase() +
                  dateInView
                    .toLocaleDateString(LOCALE, {
                      month: 'long',
                      year: 'numeric',
                    })
                    .slice(1)}
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={rooms}
                strategy={verticalListSortingStrategy}
              >
                {rooms.map((room) => (
                  <SortableRoomItem
                    key={room.id}
                    room={room}
                    onClick={() => toggleModal('roomInfo', room)}
                    maxNameLength={maxNameLength}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
          <div
            ref={scrollRef}
            className="grid overflow-x-auto relative content-start gap-y-1 no-scrollbar"
            style={{
              gridTemplateColumns: `repeat(${daysList.length}, ${cellWidth}px)`,
            }}
          >
            {daysList.map((day, index) => {
              const prev = daysList[index - 1];
              const isNewMonth = !prev || day.getMonth() !== prev.getMonth();
              return (
                <div
                  key={day.getTime()}
                  className={`h-[20px] lg:h-[25px] hidden lg:block ${
                    isNewMonth
                      ? 'text-sm lg:text-base font-medium capitalize text-gray-700'
                      : ''
                  }`}
                >
                  {isNewMonth &&
                    day.toLocaleDateString(LOCALE, { month: 'long' })}
                </div>
              );
            })}
            {daysList.map((day) => {
              return (
                <div
                  key={day.getTime()}
                  className={`p-2 border rounded-lg flex flex-col items-center justify-center h-[60px] lg:h-[70px] w-full my-1 bg-gray-200 border-gray-300 text-gray-900`}
                >
                  <p className="text-sm lg:text-base font-semibold">
                    {day.toLocaleDateString(LOCALE, { day: 'numeric' })}
                  </p>
                  <p className="text-[10px] lg:text-xs">
                    {day.toLocaleDateString(LOCALE, { weekday: 'short' })}
                  </p>
                </div>
              );
            })}
            {rooms.map((room) =>
              daysList.map((day) => {
                return (
                  <button
                    key={`${room.id}-${day.getTime()}`}
                    className={`border p-2 h-[38px] lg:h-[45px] w-full flex items-center justify-center transition 
                      bg-white border-gray-300 hover:bg-gray-100`}
                    onClick={() =>
                      toggleModal('addBooking', {
                        checkIn: day,
                        roomId: room.id,
                      })
                    }
                  />
                );
              })
            )}
            {/* Current day line */}
            {
              <div
                className="absolute bg-indigo-700 w-[2px]"
                style={{
                  top: `${topOffset}px`,
                  left: `${
                    ((today.getTime() - daysList[0].getTime()) / 36e5) *
                      (cellWidth / 24) +
                    cellWidth / 2
                  }px`,
                  height: `calc(100% - ${topOffset}px)`,
                }}
              ></div>
            }
            {/* Bookings */}
            {oldBookings?.map((booking) => {
              const roomIndex = rooms.findIndex(
                (room) => room.id === booking.room_id
              );
              if (roomIndex === -1) return null;
              const checkIn = new Date(booking.check_in);
              const checkOut = new Date(booking.check_out);
              const first = daysList[0];
              const last = daysList[daysList.length - 1];
              const hoursOffset = (checkIn.getTime() - first.getTime()) / 36e5;
              const x = Math.max(0, hoursOffset * hourPixel);
              let duration = (checkOut.getTime() - checkIn.getTime()) / 36e5;
              if (checkIn < first) {
                duration = (checkOut.getTime() - first.getTime()) / 36e5;
              }
              if (checkOut > last) duration += 24;
              const width = duration * hourPixel;
              const y = topOffset + roomIndex * (cellWidth + 4);
              return (
                <button
                  key={booking.id}
                  className={`absolute truncate shadow-lg rounded-lg text-xs lg:text-sm text-white p-2 h-[38px] lg:h-[45px] flex items-center justify-center ${
                    booking.paid ? 'bg-blue-500' : 'bg-red-500'
                  }`}
                  style={{
                    top: `${y}px`,
                    left: `${x}px`,
                    width: `${width}px`,
                    borderRadius: '4rem',
                  }}
                  onClick={() => toggleModal('bookingInfo', booking)}
                >
                  {booking.client_name}
                </button>
              );
            })}
            {currentBookings?.map((booking) => {
              const roomIndex = rooms.findIndex(
                (room) => room.id === booking.room_id
              );
              if (roomIndex === -1) return null;
              const checkIn = new Date(booking.check_in);
              const checkOut = new Date(booking.check_out);
              const first = daysList[0];
              const last = daysList[daysList.length - 1];
              const hoursOffset = (checkIn.getTime() - first.getTime()) / 36e5;
              const x = Math.max(0, hoursOffset * hourPixel);
              let duration = (checkOut.getTime() - checkIn.getTime()) / 36e5;
              if (checkIn < first)
                duration = (checkOut.getTime() - first.getTime()) / 36e5;
              if (checkOut > last) duration += 24;
              const width = duration * hourPixel;
              const y = topOffset + roomIndex * (cellWidth + 4);
              return (
                <button
                  key={booking.id}
                  className={`absolute truncate shadow-lg rounded-lg text-xs lg:text-sm text-white p-2 h-[38px] lg:h-[45px] flex items-center justify-center ${
                    booking.paid ? 'bg-blue-500' : 'bg-red-500'
                  }`}
                  style={{
                    top: `${y}px`,
                    left: `${x}px`,
                    width: `${width}px`,
                    borderRadius: '4rem',
                  }}
                  onClick={() => toggleModal('bookingInfo', booking)}
                >
                  {booking.client_name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingsCalendar;
