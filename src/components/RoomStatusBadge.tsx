import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

type Props = {
  room: Room;
  includeTitle?: boolean;
  customizable?: boolean;
  onStatusChange?: (roomId: number, status: string) => void;
};

type RoomStatusType = 'ready' | 'not ready' | 'cleaning';

const RoomStatusBadge = ({
  room,
  includeTitle,
  customizable,
  onStatusChange,
}: Props) => {
  const statusMap = {
    ready: {
      dotClassName: 'bg-green-500',
      titleClassName: 'bg-green-100 text-green-800 border border-green-300',
      title: 'Готово к заселению',
    },
    'not ready': {
      dotClassName: 'bg-red-500',
      titleClassName: 'bg-red-100 text-red-800 border border-red-300',
      title: 'Не готово к заселению',
    },
    cleaning: {
      dotClassName: 'bg-yellow-500',
      titleClassName: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      title: 'Идет уборка',
    },
  };

  const data = statusMap[room.status];

  if (customizable && onStatusChange) {
    return (
      <Popover className="relative">
        {({ open }) => (
          <>
            <PopoverButton
              className={`flex items-center gap-1 text-xs font-medium text-nowrap px-2 py-2 rounded-md shadow-md hover:cursor-pointer z-50 ${data.titleClassName}`}
            >
              {data.title}
              <ChevronDownIcon
                className={`h-4 w-4 ml-1 ${open ? 'rotate-180' : ''}`}
              />
            </PopoverButton>
            <PopoverPanel
              className="absolute z-10 bg-white rounded-md shadow-lg p-2"
              anchor="bottom end"
            >
              {['cleaning', 'ready'].map((s) => (
                <button
                  key={s}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left rounded-md hover:cursor-pointer"
                  onClick={() => onStatusChange(room.id, s)}
                >
                  {statusMap[s as RoomStatusType].title}
                </button>
              ))}
            </PopoverPanel>
          </>
        )}
      </Popover>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-lg text-xs text-white font-medium text-nowrap">
      {includeTitle ? (
        <div
          className={`px-2 py-1 rounded-full shadow-md ${data.titleClassName}`}
        >
          {data.title}
        </div>
      ) : (
        <div
          className={`w-2 h-2 rounded-full shadow-xl ring-2 ring-white ${data.dotClassName}`}
        ></div>
      )}
    </div>
  );
};

export default RoomStatusBadge;
