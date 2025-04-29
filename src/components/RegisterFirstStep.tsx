import Link from 'next/link';
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/solid';
import { useState } from 'react';

type Props = {
  handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
  formData: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role: string;
  };
  nextStep: () => void;
};

export default function RegisterFirstStep({
  handleChange,
  formData,
  nextStep,
}: Props) {
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    nextStep();
  };

  return (
    <div className="bg-gray-100 flex justify-center items-center min-h-[100dvh] flex-col">
      <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
          <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl text-center">
            Регистрация
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
                value={formData.email}
                onChange={handleChange}
                className="mt-1 flex items-center w-full border border-gray-200 shadow rounded-md px-3 py-3.5 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px]"
                placeholder="andrey.petrov@gmail.com"
                required
              />
            </div>
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
                  value={formData.password}
                  onChange={handleChange}
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
              <p className="mt-1 text-gray-500 text-sm">
                Пароль должен быть не менее 6 символов
              </p>
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:cursor-pointer hover:bg-blue-600 focus-visible:ring-4 focus-visible:ring-blue-300 outline-none w-full flex items-center justify-center"
            >
              <ArrowRightIcon className="w-5 h-5 invisible" />
              <span className="mr-2">Продолжить </span>
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
      <div className="bg-white mt-4 w-full h-[60px] flex items-center justify-center max-w-md shadow rounded-md">
        <p className="text-sm font-light text-gray-500 text-center">
          У вас уже есть аккаунт?{' '}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:underline"
          >
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
