import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import Head from 'next/head';
import { createClient } from '@/lib/supabase/component';
import {
  ArrowRightIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

const supabase = createClient();

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [sessionCreated, setSessionCreated] = useState(false);

  useEffect(() => {
    const handleAuthRedirect = async () => {
      if (!window.location.hash) {
        router.push('/');
      }

      const hash = window.location.hash.substring(1); // Remove the '#' character
      const query = new URLSearchParams(hash);
      const access_token = query.get('access_token');
      const refresh_token = query.get('refresh_token');

      if (!access_token || !refresh_token) {
        router.push('/');
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (error) {
        console.error('Session error', error);
        setError(error.message);
        return;
      }

      setSessionCreated(true);
    };

    if (router.isReady) {
      handleAuthRedirect();
    }
  }, [router]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  });

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      setError('Пользователь не найден');
      return;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_URL}/api/users/${data.user.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
        }),
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      toast.error(errorData.error || 'Ошибка регистрации');
    } else {
      toast.success('Аккаунт успешно создан!');
      router.push('/');
    }
  };

  return (
    <>
      <Head>
        <title>Завершение входа в аккаунт</title>
        <meta name="description" content="Завершение входа в аккаунт" />
      </Head>
      <div className="bg-gray-100 flex justify-center items-center min-h-[100dvh] flex-col ">
        <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
          <div className="p-6 space-y-4 md:space-y-4 sm:p-8">
            {error && (
              <>
                <div className="flex justify-center items-center mb-2">
                  <ExclamationCircleIcon className="w-9 h-9 text-red-600" />
                </div>
                <h1 className="text-xl font-bold leading-tight tracking-tight text-red-600 md:text-2xl text-center mb-2">
                  Что-то пошло не так:
                </h1>
                <p className="text-center text-gray-700"> {error}</p>
                <div className="flex justify-center items-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-xl shadow hover:bg-blue-600 transition hover:cursor-pointer"
                  >
                    Вернуться на главную
                  </Link>
                </div>
              </>
            )}
            {sessionCreated && (
              <>
                <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-xl text-center mb-4">
                  Завершите создание аккаунта
                </h1>
                <form
                  className="space-y-4 md:space-y-6"
                  onSubmit={handleSubmit}
                >
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block mb-1 text-sm font-medium text-gray-900"
                    >
                      Имя
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="mt-1 flex items-center w-full border border-gray-200 shadow rounded-md px-3 py-3.5 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px]"
                      placeholder="Андрей"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block mb-1 text-sm font-medium text-gray-900"
                    >
                      Фамилия
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="mt-1 flex items-center w-full border border-gray-200 shadow rounded-md px-3 py-3.5 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px]"
                      placeholder="Петров"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:cursor-pointer hover:bg-blue-600 focus-visible:ring-4 focus-visible:ring-blue-300 outline-none w-full flex items-center justify-center"
                  >
                    <ArrowRightIcon className="w-5 h-5 invisible" />
                    <span className="mr-2">Завершить </span>
                    <ArrowRightIcon className="w-5 h-5" />
                  </button>
                </form>
              </>
            )}
            {!sessionCreated && (
              <>
                <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl text-center">
                  Завершение входа в аккаунт
                </h1>
                <p className="text-center text-gray-700">
                  Пожалуйста, подождите...
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
