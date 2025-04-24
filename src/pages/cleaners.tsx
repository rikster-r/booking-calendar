import Layout from '@/components/Layout';
import Head from 'next/head';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { createClient } from '@/lib/supabase/server-props';
import { User } from '@supabase/supabase-js';
import CleanersInvite from '@/components/CleanersInvite';
import { fetcher } from '@/lib/fetcher';
import useSWR from 'swr';
import { toast } from 'react-toastify';
import { UserCircleIcon, LinkSlashIcon } from '@heroicons/react/24/outline';
import { OnlineUsersContext } from '@/context/OnlineUsersContext';
import { useContext } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const supabase = createClient(context);
  const userRes = await supabase.auth.getUser();

  if (userRes.error || !userRes.data) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  const [cleanersRes, roomsRes] = await Promise.all([
    fetch(
      `${process.env.NEXT_PUBLIC_URL}/api/users/${userRes.data.user.id}/cleaners`
    ),
    fetch(`${process.env.NEXT_PUBLIC_URL}/api/${userRes.data.user.id}/rooms`),
  ]);

  if (cleanersRes.ok) {
    const [initialCleaners, initialRooms] = await Promise.all([
      cleanersRes.json(),
      roomsRes.json(),
    ]);
    return {
      props: { user: userRes.data.user, initialCleaners, initialRooms },
    };
  } else {
    return { props: { user: userRes.data.user } };
  }
};

type Props = {
  user: User;
  initialCleaners?: PublicUser[];
  initialRooms?: Room[];
};

const Cleaners = ({ user, initialCleaners, initialRooms }: Props) => {
  const { data: cleaners, mutate: mutateCleaners } = useSWR<PublicUser[]>(
    `/api/users/${user.id}/cleaners`,
    fetcher,
    { fallbackData: initialCleaners }
  );
  const { data: rooms } = useSWR<Room[]>(`/api/${user.id}/rooms`, fetcher, {
    fallbackData: initialRooms,
  });
  const onlineUserIds = useContext(OnlineUsersContext);

  if (!cleaners || !rooms) return <></>;

  const addCleaner = async (email: string) => {
    const res = await fetch(`/api/users/${user.id}/cleaners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      mutateCleaners();
    } else {
      toast.error('Не удалось добавить уборщика');
    }
  };

  const unlinkCleaner = async (cleanerId: string) => {
    const res = await fetch(`/api/users/${cleanerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ related_to: null }),
    });

    if (res.ok) {
      mutateCleaners();
    } else {
      toast.error('Не удалось удалить уборщика');
    }
  };

  function getLastCleanedDateByUser(userId: string): string | null {
    let latestDate: string | null = null;

    for (const room of rooms ?? []) {
      if (room.last_cleaned_user?.id === userId && room.last_cleaned_at) {
        if (
          !latestDate ||
          new Date(room.last_cleaned_at) > new Date(latestDate)
        ) {
          latestDate = room.last_cleaned_at;
        }
      }
    }

    return latestDate;
  }

  return (
    <>
      <Head>
        <title>Список уборщиков</title>
        <meta name="description" content="Календарь брони" />
      </Head>
      <Layout user={user} title="Уборщики" titleClassName="max-w-[1600px]">
        <div className="lg:px-8 h-full">
          <div
            className={`px-4 py-6 bg-white rounded-t-xl gap-2 lg:gap-4 overflow-hidden lg:p-8 w-full max-w-[1600px] mx-auto h-full ${
              cleaners.length ? '' : 'flex flex-col justify-center items-center'
            }`}
          >
            {cleaners.length > 0 && (
              <div className="flex justify-between items-center mb-4 text-sm lg:text-base">
                <div className="flex items-center gap-4">
                  <p>
                    <span className="text-gray-500">Всего уборщиков: </span>
                    {cleaners.length}
                  </p>
                </div>
              </div>
            )}
            <CleanersInvite cleaners={cleaners} addCleaner={addCleaner} />
            {cleaners.length > 0 && (
              <div className="overflow-auto rounded-lg text-xs lg:text-sm h-full mt-4">
                <table className="min-w-full text-left text-nowrap">
                  <thead className="bg-gray-50 text-gray-700 text-left">
                    <tr className="uppercase">
                      <th className="pr-4 pl-8 py-4">Уборщик</th>
                      <th className="px-4 py-4">Статус</th>
                      <th className="px-4 py-4 text-center">
                        Последняя уборка
                      </th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {/* Sample Row */}
                    {cleaners.map((cleaner) => (
                      <tr key={cleaner.id} className={`relative w-full`}>
                        <td className="pl-8 pr-4 py-3 flex items-center gap-2 ">
                          <div className="flex items-center gap-2">
                            {/* todo */}
                            <div>
                              <UserCircleIcon className="w-7 h-7" />
                            </div>
                            <div>
                              <p className="text-xs lg:text-sm">
                                <strong className="block font-medium">
                                  {cleaner.first_name} {cleaner.last_name}
                                </strong>
                                <span className="text-gray-600">
                                  {cleaner.email || cleaner.email}
                                </span>
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {onlineUserIds.includes(cleaner.id) ? (
                            <span className="text-green-500 font-medium">
                              ● В сети
                            </span>
                          ) : (
                            <span className="text-gray-400 font-medium">
                              ● Не в сети
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {(() => {
                            const lastCleaned = getLastCleanedDateByUser(
                              cleaner.id
                            );
                            return lastCleaned
                              ? `${format(
                                  lastCleaned,
                                  user.user_metadata.preferred_date_format ??
                                    'd MMMM yyyy',
                                  { locale: ru }
                                )}, ${format(
                                  lastCleaned,
                                  user.user_metadata.preferred_time_format ??
                                    'HH:mm'
                                )}`
                              : '-';
                          })()}
                        </td>
                        <td>
                          <button
                            className="hover:cursor-pointer hover:text-red-500 min-w-9 lg:min-w-10 min-h-9 lg:min-h-10 flex justify-center items-center"
                            onClick={() => unlinkCleaner(cleaner.id)}
                          >
                            <LinkSlashIcon className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Cleaners;
