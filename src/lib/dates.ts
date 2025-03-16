import { addDays, format, isBefore } from 'date-fns';

export function get30DayRange() {
  const today = new Date();
  const futureDate = addDays(today, 30); // Add 30 days

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
