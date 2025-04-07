import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  UserIcon,
  CalendarIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { useState } from 'react';

type Props = {
  user: User;
};

const Sidebar = ({ user }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  // Function to toggle sidebar visibility
  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      <div className="lg:hidden">
        <button
          onClick={toggleSidebar}
          className="text-white rounded hover:cursor-pointer p-4"
          aria-label="Открыть боковую панель"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>

        <Dialog open={isOpen} onClose={toggleSidebar} className="relative z-50">
          <DialogBackdrop className="fixed inset-0 bg-gray-900/60" />

          <DialogPanel
            className="fixed inset-y-0 left-0 bg-white w-72 min-h-screen flex flex-col"
            style={{
              transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
            }}
          >
            <div className="flex items-center justify-between border-b border-gray-400 bg-white p-4">
              <button
                className="ml-auto hover:cursor-pointer"
                aria-label="Закрыть боковую панель"
                onClick={toggleSidebar}
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <SidebarContent user={user} />
          </DialogPanel>
        </Dialog>
      </div>
      <div className="hidden lg:block lg:fixed lg:top-0 left-0">
        <SidebarContent user={user} />
      </div>
    </>
  );
};

export const SidebarContent = ({ user }: Props) => {
  return (
    <div className="flex h-screen flex-col border-e border-gray-100 bg-white w-72 text-sm sm:text-md">
      <div className="px-2">
        <ul className="mt-6 space-y-1">
          <li className="flex items-center gap-2 rounded-lg px-4 py-3 hover:bg-gray-100 w-full hover:cursor-pointer">
            <CalendarIcon className="w-5 h-5" />
            <Link
              href="/"
              className="block rounded-lg  text-gray-700 font-semibold"
            >
              Календарь
            </Link>
          </li>
          <li className="flex items-center gap-2 rounded-lg px-4 py-3 hover:bg-gray-100 w-full hover:cursor-pointer">
            <UserIcon className="w-5 h-5" />
            <Link
              href="/profile"
              className="block rounded-lg text-gray-700 font-semibold"
            >
              Профиль
            </Link>
          </li>
          <li className="flex items-center gap-2 rounded-lg px-4 py-3 hover:bg-gray-100 w-full hover:cursor-pointer">
            <TableCellsIcon className="w-5 h-5" />
            <Link
              href="/adminPanel"
              className="block rounded-lg text-gray-700 font-semibold"
            >
              Панель администратора
            </Link>
          </li>
        </ul>
      </div>

      <div className="mt-auto inset-x-0 bottom-0 border-t border-gray-400">
        <div className="flex items-center gap-2 bg-white p-4">
          {/* todo */}
          <div>
            <UserCircleIcon className="w-7 h-7" />
          </div>

          <div>
            <p className="text-xs">
              <strong className="block font-medium">
                {user.user_metadata.first_name} {user.user_metadata.last_name}
              </strong>

              <span> {user.user_metadata.email} </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
