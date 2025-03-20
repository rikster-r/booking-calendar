import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import DatePicker from 'react-datepicker';
import { ru } from 'date-fns/locale/ru';

type Props = {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  startDate?: Date;
  timeValue: string;
  onTimeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const DateTimePicker = ({
  selectedDate,
  onDateChange,
  startDate,
  timeValue,
  onTimeChange,
}: Props) => {
  return (
    <div className="flex mt-1 gap-2">
      <div className="relative w-[60%] sm:w-[70%]">
        <DatePicker
          selected={selectedDate}
          onChange={(date) => onDateChange(date as Date)}
          selectsStart
          startDate={startDate}
          locale={ru}
          dateFormat={'dd.MM.yyyy'}
          customInput={
            <input
              type="text"
              className="flex items-center w-full border rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px] border-gray-500"
              required
              onBlur={(e) => onDateChange(new Date(e.target.value))}
            />
          }
          popperPlacement="bottom-start"
          renderCustomHeader={({
            date,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled,
          }) => (
            <div className="flex items-center justify-between px-2 py-2">
              <button
                onClick={decreaseMonth}
                disabled={prevMonthButtonDisabled}
                type="button"
                className={`inline-flex p-1 text-sm font-medium text-gray-700 hover:bg-gray-50 outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-blue-500 hover:cursor-pointer rounded ${
                  prevMonthButtonDisabled ? 'cursor-not-allowed opacity-50' : ''
                }`}
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <span className="w-full text-center capitalize font-bold">
                {new Intl.DateTimeFormat('ru-RU', {
                  month: 'long',
                  year: 'numeric',
                })
                  .format(date)
                  .slice(0, -2)}
              </span>
              <button
                onClick={increaseMonth}
                disabled={nextMonthButtonDisabled}
                type="button"
                className={`inline-flex p-1 text-sm font-medium text-gray-700 hover:bg-gray-50 outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-blue-500 hover:cursor-pointer rounded ${
                  nextMonthButtonDisabled ? 'cursor-not-allowed opacity-50' : ''
                }`}
              >
                <ChevronRightIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}
        />
      </div>
      <input
        type="time"
        value={timeValue}
        className="flex items-center border rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px] w-[40%] sm:w-[30%] text-center border-gray-500"
        onChange={onTimeChange}
        required
      />
    </div>
  );
};

export default DateTimePicker;
