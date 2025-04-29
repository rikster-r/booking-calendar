import { Description, Label, Radio, RadioGroup } from '@headlessui/react';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import House from '@/assets/house.svg';
import Broom from '@/assets/broomColor.svg';
import Image from 'next/image';

const roles = [
  {
    role: 'client',
    name: 'Владелец жилья',
    description:
      'Я хочу разместить свою недвижимость и управлять бронированиями.',
    icon: House,
  },
  {
    role: 'cleaner',
    name: 'Уборщик',
    description: 'Я хочу предлагать услуги по уборке недвижимости.',
    icon: Broom,
  },
];

type Props = {
  setFormData: React.Dispatch<
    React.SetStateAction<{
      email: string;
      firstName: string;
      lastName: string;
      password: string;
      role: string;
    }>
  >;
  formData: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role: string;
  };
  setStep: React.Dispatch<React.SetStateAction<number>>;
  handleSubmit: React.FormEventHandler<HTMLFormElement>;
};

export default function RegisterSecondStep({
  setFormData,
  formData,
  setStep,
  handleSubmit,
}: Props) {
  return (
    <div className="bg-gray-100 flex justify-center items-center min-h-[100dvh] flex-col">
      <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-3xl xl:p-0">
        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
          <div className="flex items-center">
            <button
              className="p-2 hover:cursor-pointer mr-2"
              onClick={() => setStep(1)}
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl text-center">
              Выберите роль
            </h1>
          </div>
          <form onSubmit={handleSubmit}>
            <RadioGroup
              value={formData.role}
              onChange={(value: string) =>
                setFormData((prev) => ({ ...prev, role: value }))
              }
            >
              <div className="space-y-2 sm:space-y-0 flex flex-col sm:flex-row gap-4">
                {roles.map((roleData) => (
                  <Radio
                    key={roleData.role}
                    value={roleData.role}
                    className={({ checked }) =>
                      `relative flex cursor-pointer rounded-xl border p-5 shadow-md focus:outline-none w-full sm:h-[170px] ${
                        checked
                          ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`
                    }
                  >
                    {({ checked }) => (
                      <>
                        <div className="flex items-center gap-4 w-full">
                          <div
                            className={`flex items-center justify-center rounded-full text-3xl h-12 w-12 ${
                              checked ? 'bg-blue-100' : 'bg-gray-100'
                            }`}
                          >
                            <Image
                              alt=""
                              src={roleData.icon}
                              className={`flex items-center justify-center rounded-full text-3xl h-10 w-10 ${
                                checked ? 'bg-blue-100' : 'bg-gray-100'
                              }`}
                            />
                          </div>
                          <div className="flex flex-col flex-1">
                            <Label
                              as="span"
                              className={`text-base font-semibold ${
                                checked ? 'text-blue-700' : 'text-gray-900'
                              }`}
                            >
                              {roleData.name}
                            </Label>
                            <Description
                              as="span"
                              className={`text-sm max-w-[150px] ${
                                checked ? 'text-blue-500' : 'text-gray-500'
                              }`}
                            >
                              {roleData.description}
                            </Description>
                          </div>
                          {checked && (
                            <div className="flex items-center justify-center rounded-full bg-blue-500 p-1.5">
                              <CheckIcon className="h-5 w-5 text-white" />
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </Radio>
                ))}
              </div>
            </RadioGroup>
            <div className="flex gap-2 max-w-xs mx-auto mt-4">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:cursor-pointer hover:bg-blue-600 focus-visible:ring-4 focus-visible:ring-blue-300 outline-none w-full items-center flex gap-2 justify-center"
              >
                Зарегистрироваться
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="bg-white mt-4 w-full h-[60px] flex items-center justify-center max-w-3xl shadow rounded-md">
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
