import { UserGroupIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

type Props = {
  cleaners: PublicUser[];
  addCleaner: (email: string) => void;
};

const CleanersInvite = ({ cleaners, addCleaner }: Props) => {
  const [email, setEmail] = useState('');

  return (
    <div
      className={`w-full mx-auto  ${cleaners.length ? '' : 'max-w-xl mb-12'}`}
    >
      {!cleaners.length && (
        <div className="flex flex-col items-center space-y-1">
          <UserGroupIcon className="h-10 w-10 text-gray-400" />
          <h2 className="text-lg font-semibold">Добавить уборщиков</h2>
          <p className="text-sm text-gray-500">
            Вы не добавили еще ни одного уборщика.
          </p>
        </div>
      )}

      <div
        className={`${
          cleaners.length ? '' : 'mt-6'
        } flex items-center gap-2 h-9 lg:h-10`}
      >
        <input
          type="email"
          placeholder="Введите электронную почту"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full h-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addCleaner(email);
              setEmail('');
            }
          }}
        />
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white p-2 flex justify-center items-center sm:px-4 sm:py-2 rounded-md text-sm font-medium hover:cursor-pointer h-full"
          onClick={() => {
            addCleaner(email);
            setEmail('');
          }}
        >
          <span className="hidden sm:block">Добавить</span>
          <PaperAirplaneIcon className="w-5 h-5 sm:hidden" />
        </button>
      </div>
    </div>
  );
};

export default CleanersInvite;
