import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Popover,
  PopoverButton,
  PopoverPanel,
} from '@headlessui/react';
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  UserIcon,
  CalendarIcon,
  TableCellsIcon,
  ArrowLeftStartOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/component';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

type Props = {
  user: User;
  buttonClassName?: string;
};

const Sidebar = ({ user, buttonClassName }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen((prev) => !prev);

  return (
    <>
      <div className="lg:hidden">
        <button
          onClick={toggleSidebar}
          className={`${buttonClassName} rounded hover:cursor-pointer p-4`}
          aria-label="Открыть боковую панель"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>

        <Dialog open={isOpen} onClose={toggleSidebar} className="relative z-50">
          <DialogBackdrop className="fixed inset-0 bg-gray-900/60" />

          <DialogPanel className="fixed inset-y-0 left-0 bg-white w-72 lg:w-80 min-h-screen flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-400 bg-white">
              <button
                className="ml-auto hover:cursor-pointer p-4"
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
  const supabase = createClient();
  const router = useRouter();

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error('Не удалось выйти из аккаунта. Попробуйте еще раз.');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="flex h-screen flex-col border-e border-gray-100 bg-white w-72 lg:w-80 text-sm">
      <div className="px-2">
        <ul className="mt-4 space-y-1">
          <li className="rounded-lg hover:bg-gray-100 w-full hover:cursor-pointer">
            <Link
              href="/"
              className="rounded-lg text-gray-700 font-semibold flex items-center gap-2 px-4 py-3"
            >
              <CalendarIcon className="w-5 h-5" />
              <span>Календарь</span>
            </Link>
          </li>
          <li className="rounded-lg hover:bg-gray-100 w-full hover:cursor-pointer">
            <Link
              href="/profile"
              className="rounded-lg text-gray-700 font-semibold flex items-center gap-2 px-4 py-3"
            >
              <UserIcon className="w-5 h-5" />
              <span>Профиль</span>
            </Link>
          </li>
          {user.user_metadata.role === 'admin' && (
            <li className="rounded-lg hover:bg-gray-100 w-full hover:cursor-pointer">
              <Link
                href="/adminPanel"
                className="rounded-lg text-gray-700 font-semibold flex items-center gap-2 px-4 py-3"
              >
                <TableCellsIcon className="w-5 h-5" />
                <span>Панель администратора</span>
              </Link>
            </li>
          )}
        </ul>
      </div>

      <Popover className="mt-auto inset-x-0 bottom-0 border-t border-gray-400 p-2 relative w-full">
        <PopoverButton className="flex items-center gap-2 px-3 py-2 hover:cursor-pointer text-left hover:bg-gray-100 rounded-lg w-full">
          {/* todo */}
          <div>
            <UserCircleIcon className="w-7 h-7" />
          </div>

          <div>
            <p className="text-xs lg:text-sm">
              <strong className="block font-medium">
                {user.user_metadata.first_name} {user.user_metadata.last_name}
              </strong>

              <span> {user.email} </span>
            </p>
          </div>
        </PopoverButton>
        <PopoverPanel
          anchor="bottom"
          className="absolute z-20 w-70 lg:w-76 rounded-xl shadow-lg bg-white ring-1 ring-gray-200 text-sm p-2"
        >
          <button
            className="rounded-lg hover:bg-gray-100 w-full font-semibold flex items-center gap-2 px-4 py-3 text-red-600 hover:cursor-pointer"
            onClick={signOut}
          >
            <ArrowLeftStartOnRectangleIcon className="w-5 h-5" />
            <span>Выйти из аккаунта</span>
          </button>
        </PopoverPanel>
      </Popover>
    </div>
  );
};

export default Sidebar;
