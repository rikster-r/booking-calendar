import { useCallback, useMemo, useEffect } from 'react';
import useSWRInfinite from 'swr/infinite';
import { format, addDays, differenceInCalendarDays } from 'date-fns';
import { toast } from 'react-toastify';
import { fetcher } from '@/lib/fetcher';
import { formatDateTimeLocal } from '@/lib/dates';

interface UseBookingsProps {
  userId: string;
  selectedDate: Date;
  // baseline date
  // bookings after it are current, before it are old
}

export type BookingPaidStatusPayload = {
  id: number;
  paid: boolean;
};

export const useBookings = ({ userId, selectedDate }: UseBookingsProps) => {
  const getCurrentBookingsKey = useCallback(
    (pageIndex: number, previousPageData: Booking[] | null) => {
      if (previousPageData && previousPageData.length === 0) return null; // reached end

      const start = addDays(selectedDate, pageIndex * 100);
      const end = addDays(start, 100);

      return `/api/users/${userId}/bookings/?start=${format(
        start,
        'yyyy-MM-dd'
      )}&end=${format(end, 'yyyy-MM-dd')}`;
    },
    [userId, selectedDate]
  );

  const getOldBookingsKey = useCallback(
    (pageIndex: number, previousPageData: Booking[] | null) => {
      if (previousPageData && previousPageData.length === 0) return null; // reached end

      const end = addDays(selectedDate, pageIndex * -100);
      const start = addDays(end, -100);

      return `/api/users/${userId}/bookings/?start=${format(
        start,
        'yyyy-MM-dd'
      )}&end=${format(end, 'yyyy-MM-dd')}`;
    },
    [userId, selectedDate]
  );

  const {
    data: currentBookingsData,
    setSize: setCurrentBookingsSize,
    mutate: mutateCurrentBookings,
    error: currentBookingsError,
  } = useSWRInfinite<Booking[]>(getCurrentBookingsKey, fetcher, {
    parallel: true,
    keepPreviousData: true,
  });

  const {
    data: oldBookingsData,
    setSize: setOldBookingsSize,
    mutate: mutateOldBookings,
    error: oldBookingsError,
  } = useSWRInfinite<Booking[]>(getOldBookingsKey, fetcher, {
    parallel: true,
    keepPreviousData: true,
  });

  const currentBookings = useMemo(
    () => (currentBookingsData ? currentBookingsData.flat() : []),
    [currentBookingsData]
  );

  const oldBookings = useMemo(
    () => (oldBookingsData ? oldBookingsData.flat() : []),
    [oldBookingsData]
  );

  const isLoading = !currentBookingsData && !oldBookingsData;
  const error = currentBookingsError || oldBookingsError;

  useEffect(() => {
    if (currentBookingsError) {
      toast.error(currentBookingsError);
    }
    if (oldBookingsError) {
      toast.error(oldBookingsError);
    }
  }, [currentBookingsError, oldBookingsError]);

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

  const getPageIndexForBooking = (checkOut: Date | string) => {
    const checkOutDate =
      typeof checkOut === 'string' ? new Date(checkOut) : checkOut;
    const daysDifference = differenceInCalendarDays(checkOutDate, selectedDate);
    // If the difference is negative, it means the booking is before the selected date
    if (daysDifference < 0) {
      return Math.ceil(Math.abs(daysDifference) / 100) - 1;
    }

    // Calculate the page index by dividing the difference by the range (100 days per page)
    return Math.floor(daysDifference / 100);
  };

  const isBookingOld = (checkOut: Date | string) => {
    const checkOutDate =
      typeof checkOut === 'string' ? new Date(checkOut) : checkOut;
    return differenceInCalendarDays(checkOutDate, selectedDate) < 0;
  };

  const addBooking = async (booking: BookingInput): Promise<Booking> => {
    const checkIn = formatDateTimeLocal(booking.checkIn);
    const checkOut = formatDateTimeLocal(booking.checkOut);
    const res = await fetch(`/api/users/${userId}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...booking,
        checkIn,
        checkOut,
      }),
    });

    if (res.ok) {
      const newBooking: Booking = await res.json();
      const pageIndex = getPageIndexForBooking(newBooking.check_out);
      if (isBookingOld(newBooking.check_out)) {
        // If the booking is before the selected date, add it to old bookings
        mutateOldBookings((data) => {
          if (!data) return data;
          const newData = [...data];
          newData[pageIndex] = [newBooking, ...(newData[pageIndex] || [])];
          return newData;
        });
      } else {
        // Otherwise, add it to current bookings
        mutateCurrentBookings((data) => {
          if (!data) return data;
          const newData = [...data];
          newData[pageIndex] = [newBooking, ...(newData[pageIndex] || [])];
          return newData;
        });
      }

      return newBooking;
    } else {
      const error = await res.json();
      console.log(error);
      throw new Error(error ? error.error : 'Ошибка добавления брони');
    }
  };

  const updateBooking = async (
    booking: BookingInput | BookingPaidStatusPayload
  ): Promise<Booking> => {
    const res = await fetch(`/api/users/${userId}/bookings/${booking.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...booking,
        ...('checkIn' in booking && {
          checkIn: formatDateTimeLocal(booking.checkIn),
        }),
        ...('checkOut' in booking && {
          checkOut: formatDateTimeLocal(booking.checkOut),
        }),
      }),
    });

    if (res.ok) {
      const newBooking: Booking = await res.json();
      const pageIndex = getPageIndexForBooking(newBooking.check_out);
      if (isBookingOld(newBooking.check_out)) {
        // If the booking is before the selected date, update it in old bookings
        mutateOldBookings((data) => {
          if (!data) return data;
          const newData = [...data];
          newData[pageIndex] = newData[pageIndex].map((b) =>
            b.id === newBooking.id ? newBooking : b
          );
          return newData;
        });
      } else {
        // Otherwise, update it in current bookings
        mutateCurrentBookings((data) => {
          if (!data) return data;
          const newData = [...data];
          newData[pageIndex] = newData[pageIndex].map((b) =>
            b.id === newBooking.id ? newBooking : b
          );
          return newData;
        });
      }

      return newBooking;
    } else {
      const error = await res.json();
      throw new Error(error ? error.error : 'Ошибка обновления брони');
    }
  };

  const deleteBooking = async (booking: Booking) => {
    const res = await fetch(`/api/users/${userId}/bookings/${booking.id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      const pageIndex = getPageIndexForBooking(booking.check_out);
      if (isBookingOld(booking.check_out)) {
        // If the booking is before the selected date, remove it from old bookings
        mutateOldBookings((data) => {
          if (!data) return data;
          const newData = [...data];
          newData[pageIndex] = newData[pageIndex].filter(
            (b) => b.id !== booking.id
          );
          return newData;
        });
      } else {
        // Otherwise, remove it from current bookings
        mutateCurrentBookings((data) => {
          if (!data) return data;
          const newData = [...data];
          newData[pageIndex] = newData[pageIndex].filter(
            (b) => b.id !== booking.id
          );
          return newData;
        });
        toast.success('Бронь успешно удалена');
      }
    } else {
      const error = await res.json();
      toast.error(error ? error.error : 'Ошибка удаления брони');
    }
  };

  // Generic mutate function that can update both current and old bookings
  const mutateBookings = useCallback(
    (updater: (data: Booking[][] | undefined) => Booking[][] | undefined) => {
      mutateCurrentBookings(updater);
      mutateOldBookings(updater);
    },
    [mutateCurrentBookings, mutateOldBookings]
  );

  return {
    currentBookings,
    oldBookings,
    currentBookingsData,
    oldBookingsData,
    mutateCurrentBookings,
    mutateOldBookings,
    mutateBookings,
    increaseSize,
    addBooking,
    updateBooking,
    deleteBooking,
    isLoading,
    error,
  };
};
