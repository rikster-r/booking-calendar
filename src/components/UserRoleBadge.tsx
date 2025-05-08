import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import {
  useFloating,
  flip,
  shift,
  autoUpdate,
  offset,
  FloatingPortal,
} from '@floating-ui/react';

type Props = {
  role: string | undefined;
  onRoleChange: (role: string) => Promise<void>;
};

type roleType = 'admin' | 'client' | 'cleaner';

const UserRoleBadge = ({ role, onRoleChange }: Props) => {
  const { refs, floatingStyles } = useFloating({
    whileElementsMounted: autoUpdate,
    strategy: 'absolute',
    placement: 'bottom-start',
    middleware: [shift(), flip(), offset(8)],
  });
  const roleStyles = {
    admin: 'bg-blue-100 text-blue-700',
    client: 'bg-green-100 text-green-700',
    cleaner: 'bg-purple-100 text-purple-700',
  };

  const activeRoleStyles = {
    admin: 'bg-blue-200 text-blue-800 ring-1 ring-blue-800',
    client: 'bg-green-200 text-green-800 ring-1 ring-green-800',
    cleaner: 'bg-purple-200 text-purple-800 ring-1 ring-purple-800',
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
            ref={refs.setReference}
            className={`${
              open
                ? activeRoleStyles[role as roleType]
                : roleStyles[role as roleType]
            } px-2 py-1 rounded text-xs font-medium w-max flex items-center hover:cursor-pointer focus:outline-none`}
          >
            {roleTitles[role as roleType]}
            <ChevronDownIcon
              className={`h-4 w-4 ml-1 transition-transform ${
                open ? 'rotate-180' : ''
              }`}
            />
          </PopoverButton>
          {open && (
            <FloatingPortal>
              <PopoverPanel
                className={`absolute z-20  w-max rounded-lg shadow-lg bg-white ring-1 ring-gray-200 text-sm p-2`}
                ref={refs.setFloating}
                style={floatingStyles}
              >
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
            </FloatingPortal>
          )}
        </>
      )}
    </Popover>
  );
};

export default UserRoleBadge;
