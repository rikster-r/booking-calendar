import Link from 'next/link';
import { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import Head from 'next/head';

export default function Login() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.push('/');
    } else {
      const errorData = await res.json();
      toast.error(errorData.error || 'Ошибка регистрации');
    }
  };

  return (
    <>
      <Head>
        <title>Войти в аккаунт</title>
        <meta name="description" content="Вход в аккаунт" />
      </Head>
      <div className="bg-gray-100 flex justify-center items-center min-h-[100dvh] flex-col ">
        <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl text-center">
              Войти в аккаунт
            </h1>
            <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block mb-1 text-sm font-medium text-gray-900"
                >
                  Почта
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 flex items-center w-full border border-gray-200 shadow rounded-md px-3 py-3.5 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px]"
                  placeholder="andrey.petrov@gmail.com"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block mb-1 text-sm font-medium text-gray-900"
                >
                  Пароль
                </label>
                <div className="relative">
                  <input
                    type={passwordVisible ? 'text' : 'password'}
                    name="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 flex items-center w-full border border-gray-200 shadow rounded-md px-3 py-3.5 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px] pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:cursor-pointer w-7 h-7 flex items-center justify-center"
                    aria-label="Поменять видимость пароля"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                  >
                    {passwordVisible ? (
                      <EyeIcon className="h-5 w-5 text-gray-500" />
                    ) : (
                      <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:cursor-pointer hover:bg-blue-600 focus-visible:ring-4 focus-visible:ring-blue-300 outline-none w-full"
              >
                Войти
              </button>
            </form>
          </div>
        </div>
        <div className="bg-white mt-4 w-full h-[60px] flex items-center justify-center max-w-md shadow rounded-md">
          <p className="text-sm font-light text-gray-500 text-center">
            У вас еще нет аккаунта?{' '}
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:underline"
            >
              Регистрация
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
