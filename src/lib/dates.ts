import { addDays, format } from 'date-fns';

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


