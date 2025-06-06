import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { fetcher } from '@/lib/fetcher';
import { createClient } from '@/lib/supabase/server-props';
import { User } from '@supabase/supabase-js';
import useSWR from 'swr';
import {
  UserCircleIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import UserRoleBadge from '@/components/UserRoleBadge';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useState, useContext, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { toast } from 'react-toastify';
import AddUserModal from '@/components/AddUserModal';
import { OnlineUsersContext } from '@/context/OnlineUsersContext';
import Layout from '@/components/Layout';
import Pagination from '@/components/Pagination';

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const supabase = createClient(context);

  const userRes = await supabase.auth.getUser();

  if (userRes.error || !userRes.data) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  if (userRes.data.user.user_metadata.role !== 'admin') {
    return { redirect: { destination: '/', permanent: false } };
  }

  return {
    props: {
      user: userRes.data.user,
    },
  };
};

type Props = {
  user: User;
  fallback?: Record<string, unknown>;
};

type UsersData = {
  total: number;
  users: PublicUser[];
};

const AdminPanel = ({ user }: Props) => {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const {
    data,
    mutate: mutateUsers,
    isLoading,
  } = useSWR<UsersData>(
    searchQuery
      ? `/api/users?search=${encodeURIComponent(
          searchQuery
        )}&page=${page}&pageSize=${pageSize}`
      : `/api/users?page=${page}&pageSize=${pageSize}`,
    fetcher,
    {
      keepPreviousData: true,
    }
  );
  const users = useMemo(() => (data ? data.users : []), [data]);
  const userCount = useMemo(() => (data ? data.total : 0), [data]);
  const [selectedUsers, setSelectedUsers] = useState<PublicUser[]>([]);
  const [deleteHovered, setDeleteHovered] = useState(false);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);

  const onlineUserIds = useContext(OnlineUsersContext);

  useEffect(() => {
    if (!users) return;
    setSelectedUsers((prevSelected) =>
      prevSelected.filter((user) => users.some((u) => u.id === user.id))
    );
  }, [users]);

  if (isLoading && searchQuery.trim() === '') {
    return (
      <>
        <Head>
          <title>Панель администратора</title>
          <meta name="description" content="Календарь брони" />
        </Head>
        <Layout
          user={user}
          title="Панель администратора"
          titleClassName="max-w-[1600px]"
        >
          <div className="lg:px-8 h-full">
            <div className="rounded-xl animate-pulse max-w-[1600px] px-4 py-6 bg-white rounded-t-xl gap-2 lg:gap-4 overflow-hidden lg:p-8 w-full mx-auto h-full">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="mb-4 flex">
                <div className="h-9 w-40 bg-gray-200 rounded" />
                <div className="h-9 w-10 bg-gray-200 rounded ml-auto" />
              </div>
              <div className="overflow-auto rounded-lg no-scrollbar">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr className="uppercase">
                      <th className="px-4 py-3">
                        <div className="h-4 w-4 bg-gray-200 rounded" />
                      </th>
                      <th className="px-4 py-4">
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                      </th>
                      <th className="px-4 py-4">
                        <div className="h-4 w-20 bg-gray-200 rounded" />
                      </th>
                      <th className="px-4 py-4">
                        <div className="h-4 w-16 bg-gray-200 rounded" />
                      </th>
                      <th className="px-4 py-4">
                        <div className="h-4 w-28 bg-gray-200 rounded" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {[...Array(5)].map((_, i) => (
                      <tr key={i} className="w-full">
                        <td className="px-4 py-3">
                          <div className="h-4 w-4 bg-gray-200 rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gray-200 rounded-full" />
                            <div>
                              <div className="h-3 w-24 bg-gray-200 rounded mb-1" />
                              <div className="h-2 w-32 bg-gray-200 rounded" />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-3 w-16 bg-gray-200 rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-3 w-10 bg-gray-200 rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-3 w-28 bg-gray-200 rounded" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Layout>
      </>
    );
  }

  if (users.length === 0 && searchQuery.trim() === '') {
    return (
      <>
        <Head>
          <title>Панель администратора</title>
          <meta name="description" content="Календарь брони" />
        </Head>
        <Layout
          user={user}
          title="Панель администратора"
          titleClassName="max-w-[1600px]"
        >
          <div className="lg:px-8 h-full">
            <div className="p-4 bg-white rounded-t-xl flex justify-center items-center w-full max-w-[1600px] mx-auto h-full flex-col text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-10 h-10"
              >
                <path d="M10,13C9.65,13.59 9.36,14.24 9.19,14.93C6.5,15.16 3.9,16.42 3.9,17V18.1H9.2C9.37,18.78 9.65,19.42 10,20H2V17C2,14.34 7.33,13 10,13M10,4A4,4 0 0,1 14,8C14,8.91 13.69,9.75 13.18,10.43C12.32,10.75 11.55,11.26 10.91,11.9L10,12A4,4 0 0,1 6,8A4,4 0 0,1 10,4M10,5.9A2.1,2.1 0 0,0 7.9,8A2.1,2.1 0 0,0 10,10.1A2.1,2.1 0 0,0 12.1,8A2.1,2.1 0 0,0 10,5.9M15.5,12C18,12 20,14 20,16.5C20,17.38 19.75,18.21 19.31,18.9L22.39,22L21,23.39L17.88,20.32C17.19,20.75 16.37,21 15.5,21C13,21 11,19 11,16.5C11,14 13,12 15.5,12M15.5,14A2.5,2.5 0 0,0 13,16.5A2.5,2.5 0 0,0 15.5,19A2.5,2.5 0 0,0 18,16.5A2.5,2.5 0 0,0 15.5,14Z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900 mt-2">
                Пользователи не найдены
              </h2>
              <p className="text-sm text-gray-500">
                Добавьте пользователей в систему, чтобы начать управлять.
              </p>
              <button
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-xl shadow hover:bg-blue-600 transition hover:cursor-pointer"
                onClick={() => setAddUserModalOpen(true)}
              >
                Добавить пользователя
              </button>
            </div>
          </div>
        </Layout>
        <AddUserModal
          isOpen={addUserModalOpen}
          onClose={() => {
            mutateUsers();
            setAddUserModalOpen(false);
          }}
        />
      </>
    );
  }

  const toggleSelectedUser = (user: PublicUser) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u.id === user.id);
      if (isSelected) {
        return prev.filter((u) => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const toggleAllSelectedUsers = () => {
    setSelectedUsers((prev) => {
      const toggled = prev.length === users.length;
      if (toggled) {
        return [];
      } else {
        return users;
      }
    });
  };

  const deleteSelectedUsers = async () => {
    if (selectedUsers.length === 0) return;
    const ids = selectedUsers.map((user) => user.id);
    const res = await fetch(`/api/users`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });
    if (res.ok) {
      setSelectedUsers([]);
      mutateUsers();
    } else {
      toast.error('Не удалось удалить выбранных пользователей');
    }
  };

  const changeRole = async (userId: string, role: string) => {
    // Optimistic update: change the role locally before sending the request
    mutateUsers(
      (currentData) => {
        if (!currentData) return currentData;
        return {
          ...currentData,
          users: currentData.users.map((user) =>
            user.id === userId ? { ...user, role } : user
          ),
        };
      },
      false // Avoid revalidation
    );

    const res = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });

    if (!res.ok) {
      toast.error('Не удалось изменить роль. Попробуйте еще раз.');
    }

    // Revalidate
    mutateUsers();
  };

  return (
    <>
      <Head>
        <title>Панель администратора</title>
        <meta name="description" content="Календарь брони" />
      </Head>
      <Layout
        user={user}
        title="Панель администратора"
        titleClassName="max-w-[1600px]"
      >
        <div className="lg:px-8 h-full">
          <div className="px-4 py-6 bg-white rounded-t-xl gap-2 lg:gap-4 overflow-hidden lg:p-8 w-full max-w-[1600px] mx-auto h-full">
            <div className="flex justify-between items-center mb-4 text-sm lg:text-base">
              <div className="flex items-center gap-4">
                <p>
                  <span className="text-gray-500">Все пользователи: </span>
                  {userCount}
                </p>
                {!searchQuery.trim() && (
                  <p>
                    <span className="text-gray-500">
                      Пользователей онлайн:{' '}
                    </span>
                    {onlineUserIds ? onlineUserIds.length : 0}
                  </p>
                )}
              </div>
            </div>
            <div className="mb-4 flex items-center">
              <div className="relative w-full h-9 lg:h-10">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                  <MagnifyingGlassIcon
                    className="w-5 h-5 text-gray-500"
                    aria-hidden="true"
                  />
                </div>
                <input
                  type="search"
                  id="search"
                  className="block w-full pr-4 pl-10 h-full text-sm text-gray-900 border border-gray-300 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 rounded-md"
                  placeholder="Поиск пользователей"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  required
                />
              </div>
              <button
                className="font-medium bg-blue-500 text-white rounded-md text-xs lg:text-sm hover:cursor-pointer hover:bg-blue-600 ml-2 min-w-9 lg:min-w-10 min-h-9 lg:min-h-10 flex justify-center items-center"
                onClick={() => setAddUserModalOpen(true)}
              >
                <PlusIcon className="w-5 h-5" />
              </button>
              <button
                className="border-2 border-gray-100 rounded text-sm font-medium hover:cursor-pointer hover:border-red-300 group flex justify-center items-center ml-2 min-w-9 lg:min-w-10 min-h-9 lg:min-h-10"
                onMouseEnter={() => setDeleteHovered(true)}
                onMouseLeave={() => setDeleteHovered(false)}
                onClick={deleteSelectedUsers}
              >
                <TrashIcon className="w-5 h-5 group-hover:stroke-red-500" />
              </button>
            </div>
            {users.length ? (
              <div className="rounded-lg text-xs lg:text-sm h-full">
                <div className={`w-full overflow-x-auto no-scrollbar`}>
                  <table className="w-full text-left text-nowrap mb-4">
                    <thead className="bg-gray-50 text-gray-700">
                      <tr className="uppercase">
                        <th className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.length === users.length}
                            onChange={toggleAllSelectedUsers}
                          />
                        </th>
                        <th className="px-4 py-4">Пользователь</th>
                        <th className="px-4 py-4">Роль</th>
                        <th className="px-4 py-4">Статус</th>
                        <th className="px-4 py-4">Последний заход</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                      {/* Sample Row */}
                      {users.map((filteredUser) => (
                        <tr
                          key={filteredUser.id}
                          className={`${
                            deleteHovered &&
                            selectedUsers.some((u) => u.id === filteredUser.id)
                              ? 'bg-red-400'
                              : ''
                          } relative w-full`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(filteredUser)}
                              onChange={() => toggleSelectedUser(filteredUser)}
                            />
                          </td>
                          <td className="px-4 py-3 flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              {/* todo */}
                              <div>
                                <UserCircleIcon className="w-7 h-7" />
                              </div>
                              <div>
                                <p className="text-xs lg:text-sm">
                                  <strong className="block font-medium">
                                    {filteredUser.first_name}{' '}
                                    {filteredUser.last_name}
                                  </strong>
                                  <span className="text-gray-600">
                                    {filteredUser.email || filteredUser.email}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <UserRoleBadge
                              role={filteredUser.role}
                              onRoleChange={(role: string) =>
                                changeRole(filteredUser.id, role)
                              }
                            />
                          </td>
                          <td className="px-4 py-3">
                            {onlineUserIds.includes(filteredUser.id) ? (
                              <span className="text-green-500 font-medium">
                                ● В сети
                              </span>
                            ) : (
                              <span className="text-gray-400 font-medium">
                                ● Не в сети
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {filteredUser.last_sign_in_at
                              ? `${format(
                                  filteredUser.last_sign_in_at,
                                  user.user_metadata.preferred_date_format ??
                                    'd MMMM yyyy',
                                  { locale: ru }
                                )}, ${format(
                                  filteredUser.last_sign_in_at,
                                  user.user_metadata.preferred_time_format ??
                                    'HH:mm'
                                )}`
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={page}
                  setPage={setPage}
                  itemsPerPage={pageSize}
                  totalItems={userCount ? userCount : 0}
                />
              </div>
            ) : (
              <h2 className="text-base text-gray-500 mt-6">
                По вашему запросу пользователи не найдены.
              </h2>
            )}
          </div>
        </div>
      </Layout>

      <AddUserModal
        isOpen={addUserModalOpen}
        onClose={() => {
          mutateUsers();
          setAddUserModalOpen(false);
        }}
      />
    </>
  );
};

export default AdminPanel;
