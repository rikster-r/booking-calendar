import { useEffect, useState } from 'react';
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { toast } from 'react-toastify';

type FormatOption = {
  example: string;
  format: string;
};

type FormatDropdownProps = {
  userId: string;
  type: 'date' | 'time';
  initialFormat: string;
  formats: FormatOption[];
};

export default function FormatDropdown({
  userId,
  type,
  initialFormat,
  formats,
}: FormatDropdownProps) {
  const [selectedFormat, setSelectedFormat] = useState<FormatOption>(
    formats.find((f) => f.format === initialFormat) || formats[0]
  );

  const updateFormat = async (format: string) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        [`preferred_${type}_format`]: format,
      }),
    });

    if (!res.ok) {
      toast.error(
        `Не удалось изменить формат ${type === 'date' ? 'даты' : 'времени'}`
      );
    }
  };

  useEffect(() => {
    updateFormat(selectedFormat.format);
  }, [selectedFormat]);

  return (
    <div className="py-4 ">
      <h3 className="text-sm font-medium text-gray-500 mb-1">
        Формат {type === 'date' ? 'даты' : 'времени'}
      </h3>
      <Listbox value={selectedFormat} onChange={setSelectedFormat}>
        <ListboxButton className="relative cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left shadow-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm w-full max-w-120">
          <span className="block truncate">{selectedFormat.example}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
          </span>
        </ListboxButton>

        <ListboxOptions
          className="absolute mt-1 max-h-60 w-(--button-width) overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
          anchor={{ to: 'top start', gap: 8 }}
        >
          {formats.map((option) => (
            <ListboxOption
              key={option.format}
              className="relative cursor-default select-none py-2 pl-10 pr-4 hover:cursor-pointer data-focus:bg-blue-100 data-focus:text-blue-900 text-gray-900"
              value={option}
            >
              {({ selected }) => (
                <>
                  <span
                    className={`block truncate ${
                      selected ? 'font-medium' : 'font-normal'
                    }`}
                  >
                    {option.example}
                  </span>
                  {selected && (
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  )}
                </>
              )}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
    </div>
  );
}
