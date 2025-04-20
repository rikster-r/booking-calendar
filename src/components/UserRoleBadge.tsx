import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

type Props = {
  role: string | undefined;
  onRoleChange: (role: string) => Promise<void>;
};

type roleType = 'admin' | 'client' | 'cleaner';

const UserRoleBadge = ({ role, onRoleChange }: Props) => {
  if (!role || !['admin', 'client', 'cleaner'].includes(role)) return null;

  const roleStyles = {
    admin: 'bg-blue-100 text-blue-700',
    client: 'bg-green-100 text-green-700',
    cleaner: 'bg-purple-100 text-purple-700',
  };

  const roleTitles = {
    admin: 'Администратор',
    client: 'Клиент',
    cleaner: 'Уборщик',
  };

  const roleActions: Record<roleType, string> = {
    admin: 'Назначить администратором',
    client: 'Назначить клиентом',
    cleaner: 'Назначить уборщиком',
  };

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <PopoverButton
            className={`${
              roleStyles[role as roleType]
            } px-2 py-1 rounded text-xs font-medium w-max flex items-center hover:cursor-pointer focus:outline-none`}
          >
            {roleTitles[role as roleType]}
            <ChevronDownIcon
              className={`h-4 w-4 ml-1 ${open ? 'rotate-180' : ''}`}
            />
          </PopoverButton>
          <PopoverPanel className="absolute z-20 mt-2 w-max rounded-lg shadow-lg bg-white ring-1 ring-gray-200 text-sm p-2">
            {['admin', 'client', 'cleaner']
              .filter((r) => r !== role)
              .map((r) => (
                <button
                  key={r}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left rounded-md hover:cursor-pointer"
                  onClick={() => onRoleChange(r)}
                >
                  {roleActions[r as roleType]}
                </button>
              ))}
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
};

export default UserRoleBadge;
