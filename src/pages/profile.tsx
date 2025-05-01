import Layout from '@/components/Layout';
import { createClient } from '@/lib/supabase/server-props';
import { User } from '@supabase/supabase-js';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { createClient as createComponentClient } from '@/lib/supabase/component';
import { useRouter } from 'next/router';
import { dateFormats, timeFormats } from '@/lib/dates';
import FormatDropdown from '@/components/FormatDropdown';
import AvitoIntegration from '@/components/ProfileAvitoIntegration';
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/fetcher';
import RoomsLinks from '@/components/RoomsLinks';

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const supabase = createClient(context);
  const userRes = await supabase.auth.getUser();

  if (userRes.error || !userRes.data) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  const userId = userRes.data.user.id;

  const [avitoTokenRes, roomsRes] = await Promise.all([
    fetch(
      `${process.env.NEXT_PUBLIC_URL}/api/avito/accessToken?user_id=${userId}`
    ),
    fetch(
      `${process.env.NEXT_PUBLIC_URL}/api/users/${userId}/rooms?onlyFromAvito=true&sortOrder=descending`
    ),
  ]);

  const [avitoTokenData, rooms] = await Promise.all([
    avitoTokenRes.ok ? avitoTokenRes.json() : Promise.resolve({}),
    roomsRes.ok ? roomsRes.json() : Promise.resolve([]),
  ]);

  return {
    props: {
      user: userRes.data.user,
      fallback: {
        '/api/avito/accessToken': avitoTokenData,
        [`/api/users/${userId}/rooms?onlyFromAvito=true&sortOrder=descending`]:
          rooms,
      },
    },
  };
};

type Props = {
  user: User;
  fallback?: Record<string, unknown>;
};

const Profile = ({ user: initialUser }: Props) => {
  const {
    data: avitoTokenData,
    isLoading: isTokenLoading,
    mutate: mutateAvitoTokenData,
  } = useSWR<AvitoTokenData>(`/api/avito/accessToken`, fetcher, {
    onError(err, key) {
      // Clear the cache manually on error
      mutate(key, null, false); // false = don't revalidate
    },
  });
  const { data: rooms, mutate: mutateRooms } = useSWR<Room[]>(
    `/api/users/${initialUser.id}/rooms?onlyFromAvito=true&sortOrder=descending`,
    fetcher
  );

  const [activeField, setActiveField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<User>(initialUser);
  const router = useRouter();
  const code = router.query.code;
  const supabase = createComponentClient();

  useEffect(() => {
    if (code) setActiveField('password');
  }, [code]);

  useEffect(() => {
    if (router.query.error === 'expired') {
      toast.error('Срок действия ссылки истёк. Пожалуйста, запросите новую.');
    }

    if (router.query.error === 'token') {
      toast.error(
        'Не удалось добавить интеграцию. Пожалуйста, попробуйте ещё раз.'
      );
    }
  }, []);

  const handleMetadataSave = async (field: string, value: string) => {
    setActiveField(null);

    // Optimistically update the UI
    // Using optimistic updates because this is a simple change
    const previousUser = user;
    setUser((prev) => ({
      ...prev,
      user_metadata: {
        ...prev.user_metadata,
        [field]: value,
      },
    }));

    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ [field]: value }),
    });

    if (res.ok) {
      // Revalidate
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        setUser(data.user);
      }
    } else {
      // Revert to previous user state on error
      setUser(previousUser);
      toast.error('Не удалось обновить данные.');
    }
  };

  const handleEmailSave = async (value: string) => {
    setIsSubmitting(true);
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: value }),
    });

    setIsSubmitting(false);
    if (res.ok) {
      toast.info(`Подтверждение было отправлено на почту ${value}`);
    } else {
      const error = await res.json();
      toast.error(error.error || 'Ошибка сервера - не удалось обновить email.');
    }
  };

  const handlePasswordChange = async (value: string) => {
    if (code) {
      const { data, error } = await supabase.auth.updateUser({
        password: value,
      });

      if (!error) {
        setUser(data.user);
        toast.success('Пароль успешно изменен.');
        setActiveField(null);
      } else {
        if (
          error.message ===
          'New password should be different from the old password.'
        ) {
          toast.error('Новый пароль должен отличаться от старого.');
        } else {
          toast.error('Ошибка сервера - не удалось обновить пароль.');
        }
      }
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(
        user.email as string,
        {
          redirectTo: `${process.env.NEXT_PUBLIC_URL}/profile`,
        }
      );
      if (error) {
        const timeLeft = parseInt(error.message.match(/\d+/)?.[0] || '1', 10);
        toast.error(
          error.code === 'over_email_send_rate_limit'
            ? `Подождите ${timeLeft} секунд${
                timeLeft === 1 ? 'у' : ''
              } перед следующей попыткой.`
            : 'Произошла ошибка сервера. Попробуйте еще раз.'
        );
      } else {
        toast.info(
          `Подтверждение смены пароля было отправлено на почту ${user.email}`
        );
      }
    }
  };

  const handleSave = async (field: string, value: string) => {
    // exit if no changes made
    if (
      (field === 'email' && user[field as keyof User] === value) ||
      (field !== 'email' &&
        (user.user_metadata[field] === value ||
          user[field as keyof User] === value))
    ) {
      setActiveField(null);
      return;
    }

    if (
      (field === 'password' && code && value.trim() === '') ||
      (field !== 'password' && value.trim() === '')
    ) {
      return;
    }

    if (field === 'email') {
      handleEmailSave(value);
    } else if (field === 'password') {
      handlePasswordChange(value);
    } else {
      handleMetadataSave(field, value);
    }
  };

  const handleCancel = () => {
    setActiveField(null);
  };

  return (
    <>
      <Head>
        <title>Настройки профиля</title>
        <meta name="description" content="Настройки профиля" />
      </Head>
      <Layout
        user={user}
        title="Настройки профиля"
        titleClassName="max-w-[800px]"
      >
        <div className="lg:px-8 lg:pb-8">
          <div className="px-4 rounded-t-xl lg:rounded-xl gap-2 sm:gap-4 overflow-hidden sm:px-8 sm:pt-2 sm:pb-4 w-full max-w-[800px] mx-auto h-full bg-white">
            {/* Personal Information Section */}
            <div className="">
              <div className="py-4 border-b border-gray-200">
                <h2 className="font-medium text-gray-900 mb-1">
                  Личная информация
                </h2>
                <p className="text-sm text-gray-600">
                  Редактирование персональной информации.
                </p>
              </div>

              <EditableRow
                label="Имя"
                value={user.user_metadata.first_name}
                fieldKey="first_name"
                activeField={activeField}
                setActiveField={setActiveField}
                onSave={handleSave}
                onCancel={handleCancel}
              />

              <EditableRow
                label="Фамилия"
                value={user.user_metadata.last_name}
                fieldKey="last_name"
                activeField={activeField}
                setActiveField={setActiveField}
                onSave={handleSave}
                onCancel={handleCancel}
              />

              <EditableRow
                label="Электронная почта"
                value={user.email as string}
                fieldKey="email"
                activeField={activeField}
                setActiveField={setActiveField}
                onSave={handleSave}
                onCancel={handleCancel}
                isSubmitting={isSubmitting}
              />

              {code ? (
                <EditableRow
                  label="Пароль"
                  value=""
                  fieldKey="password"
                  activeField={activeField}
                  setActiveField={setActiveField}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              ) : (
                <div
                  className={`flex items-start sm:items-center justify-between py-4 border-b border-gray-200`}
                >
                  <div className="w-full sm:w-auto">
                    <h3 className="text-sm font-medium text-gray-500">
                      Пароль
                    </h3>
                  </div>

                  <button
                    className="mt-2 sm:mt-0 text-sm font-medium text-blue-600 hover:text-blue-500 hover:cursor-pointer"
                    onClick={() => handleSave('password', '')}
                  >
                    Изменить
                  </button>
                </div>
              )}
            </div>

            {/* Integrations Section */}
            {user.user_metadata.role !== 'cleaner' && (
              <AvitoIntegration
                tokenData={avitoTokenData}
                isLoading={isTokenLoading}
                mutateTokenData={mutateAvitoTokenData}
              />
            )}

            {user.user_metadata.role !== 'cleaner' &&
              avitoTokenData &&
              Object.keys(avitoTokenData).length !== 0 && (
                <RoomsLinks
                  user={user}
                  rooms={rooms}
                  mutateRooms={mutateRooms}
                />
              )}

            {/* Preferences Section */}
            {user.user_metadata.role !== 'cleaner' && (
              <div className="my-10 lg:mt-10 lg:mb-0">
                <div className="py-4 border-b border-gray-200">
                  <h2 className="font-medium text-gray-900 mb-1">
                    Настройки календаря
                  </h2>
                  <p className="text-sm text-gray-600">
                    Управление параметрами отображения и функций.
                  </p>
                </div>

                <FormatDropdown
                  userId={user.id}
                  type="date"
                  formats={dateFormats}
                  initialFormat={user.user_metadata.preferred_date_format}
                />
                <FormatDropdown
                  userId={user.id}
                  type="time"
                  formats={timeFormats}
                  initialFormat={user.user_metadata.preferred_time_format}
                />
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
};

type EditableRowProps = {
  label: string;
  value: string;
  fieldKey: string;
  activeField: string | null;
  setActiveField: React.Dispatch<React.SetStateAction<string | null>>;
  onSave: (field: string, value: string) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
};

const EditableRow = ({
  label,
  value,
  fieldKey,
  activeField,
  setActiveField,
  onSave,
  onCancel,
  isSubmitting,
}: EditableRowProps) => {
  const isEditing = activeField === fieldKey;
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value); // reset when user changes value outside
  }, [value]);

  return (
    <div
      className={`flex ${
        isEditing ? 'flex-col' : 'flex-row'
      } sm:flex-row items-start sm:items-center justify-between py-4 border-b border-gray-200`}
    >
      <div className="w-full sm:w-auto">
        <h3 className="text-sm font-medium text-gray-500">{label}</h3>
        {!isEditing ? (
          <p className="mt-1 text-sm text-gray-900">{value}</p>
        ) : (
          <div className="relative w-full mt-2 sm:mt-1 ">
            <input
              className={`${
                isSubmitting ? 'pl-8 pr-4' : 'px-4'
              } text-sm border border-gray-300 rounded py-2 text-gray-900 w-full sm:w-[400px]`}
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSave(fieldKey, tempValue);
                }
                if (e.key === 'Escape') {
                  setTempValue(value);
                  onCancel();
                }
              }}
              autoFocus
            />

            {isSubmitting && (
              <div
                role="status"
                className={`flex absolute inset-y-0 start-0 items-center ps-3 pointer-events-none py-2`}
              >
                <svg
                  aria-hidden="true"
                  className="w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
                <span className="sr-only">Загрузка...</span>
              </div>
            )}
          </div>
        )}
      </div>
      {!isEditing ? (
        <button
          className="mt-2 sm:mt-0 text-sm font-medium text-blue-600 hover:text-blue-500 hover:cursor-pointer"
          onClick={() => setActiveField(fieldKey)}
        >
          Изменить
        </button>
      ) : (
        <div className="flex gap-4 mt-2 sm:mt-0">
          <div>
            <button
              onClick={() => onSave(fieldKey, tempValue)}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:cursor-pointer"
            >
              Сохранить
            </button>
          </div>
          <button
            onClick={() => {
              setTempValue(value);
              onCancel();
            }}
            className="text-sm text-gray-500 hover:text-gray-400 hover:cursor-pointer"
          >
            Отмена
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;
