import { addDays, format, isBefore, differenceInCalendarDays } from 'date-fns';

export function get100DayRange(start?: Date) {
  const today = start ?? new Date();
  const futureDate = addDays(today, 100); // Add 100 days

  // Format as YYYY-MM-DD
  return {
    start: format(today, 'yyyy-MM-dd'),
    end: format(futureDate, 'yyyy-MM-dd'),
  };
}

export const getNextDay = (date: Date) => addDays(date, 1);

// checks if day is earlier than other only by day, ignoring time
export const isBeforeByDay = (date1: Date, date2: Date) => {
  const date1WithoutTime = new Date(
    date1.getFullYear(),
    date1.getMonth(),
    date1.getDate()
  );
  const date2WithoutTime = new Date(
    date2.getFullYear(),
    date2.getMonth(),
    date2.getDate()
  );
  return isBefore(date1WithoutTime, date2WithoutTime);
};

export function formatDateForAvito(date: string) {
  return date.slice(0, 10);
}

// calculate pageindex for main page bookings gotten from useSWRInfinite
export const getPageIndexForBooking = (checkOut: Date | string) => {
  const checkInDate = typeof checkOut === 'string' ? new Date(checkOut) : checkOut;
  const daysDifference = differenceInCalendarDays(checkInDate, new Date());

  // Calculate the page index by dividing the difference by the range (100 days per page)
  return Math.floor(daysDifference / 100);
};

export const dateFormats = [
  { example: '24 апреля 2025', format: 'd MMMM yyyy' },
  { example: '24.04.2025', format: 'dd.MM.yyyy' },
  { example: '24/04/2025', format: 'dd/MM/yyyy' },
  { example: '04/24/2025', format: 'MM/dd/yyyy' },
  { example: '2025-04-24', format: 'yyyy-MM-dd' },
  { example: 'чт, 24 апр. 2025', format: 'eee, d MMM yyyy' },
];

export const timeFormats = [
  { example: '14:30', format: 'HH:mm' },
  { example: '02:30 PM', format: 'hh:mm a' },
  { example: '14:30:00', format: 'HH:mm:ss' },
];
