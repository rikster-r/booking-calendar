import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import DatePicker from 'react-datepicker';
import { ru } from 'date-fns/locale/ru';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

type Props = {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  startDate?: Date;
};

const DateTimePicker = ({ selectedDate, onDateChange, startDate }: Props) => {
  return (
    <div className="flex gap-2">
      <div className="relative w-[60%] sm:w-[70%]">
        <DatePicker
          selected={selectedDate}
          onChange={(date) => onDateChange(date as Date)}
          selectsStart
          startDate={startDate}
          locale={ru}
          dateFormat={'dd.MM.yyyy'}
          customInput={
            <button className="inline-flex items-center rounded-full bg-gray-100 px-4 py-2 cursor-pointer text-black">
              <span className="mr-2">
                {selectedDate.toLocaleDateString('ru-RU')}
              </span>
              <ChevronDownIcon className="w-4 h-4 text-black" />
            </button>
          }
          popperPlacement="bottom-start"
          renderCustomHeader={({
            date,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled,
          }) => (
            <div className="flex items-center justify-between px-2 py-2 ml-auto">
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
    </div>
  );
};

export default DateTimePicker;
