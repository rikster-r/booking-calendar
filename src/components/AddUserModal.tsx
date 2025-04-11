import { useState } from 'react';
import Modal from './Modal';
import { EyeIcon, EyeSlashIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const AddUserModal = ({ isOpen, onClose }: Props) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'client',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const roles = {
    admin: 'Администратор',
    client: 'Клиент',
    cleaner: 'Уборщик',
  };

  const generatePassword = () => {
    const length = 8;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    setFormData((prev) => ({ ...prev, password }));
  };

  const handleChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement
  > = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const addUser = async (user: UserInput) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });

    if (res.ok) {
      toast.success('Пользователь добавлен');
      onClose();
    } else {
      toast.error('Ошибка при добавлении пользователя');
    }
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    await addUser(formData);
    setIsSubmitting(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <form
        onSubmit={handleSubmit}
        className="relative p-6 sm:p-7 text-sm sm:text-base"
      >
        <div className="flex justify-between items-center gap-2 sm:gap-12">
          <h2 className="sm:text-lg font-semibold text-base flex items-center gap-2">
            Добавить пользователя
          </h2>
          <button
            type="button"
            className="hover:cursor-pointer"
            onClick={onClose}
          >
            <XMarkIcon className="w-6 sm:w-7 h-6 sm:h-7" />
          </button>
        </div>

        <div className="mt-3">
          <label htmlFor="firstName" className="font-medium text-gray-700">
            Имя
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder={'Андрей'}
            className="mt-1 flex items-center w-full border border-gray-500 rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px]"
            required
          />
        </div>

        <div className="mt-3">
          <label htmlFor="Фамилия" className="font-medium text-gray-700">Фамилия</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder={'Петров'}
            className="mt-1 flex items-center w-full border border-gray-500 rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px]"
            required
          />
        </div>

        <div className="mt-3">
          <label htmlFor="email" className="font-medium text-gray-700">Почта</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="andrey.petrov@gmail.com"
            className="mt-1 flex items-center w-full border border-gray-500 rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px]"
            required
          />
        </div>

        <div className="mt-3">
          <label htmlFor="password" className="font-medium text-gray-700">Пароль</label>
          <div className="relative">
            <input
              type={passwordVisible ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 flex items-center w-full border border-gray-500 rounded-md px-3 py-3.5 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px] pr-10"
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
          <button
            type="button"
            className="text-sm font-light text-blue-600 hover:underline hover:cursor-pointer mt-1"
            onClick={generatePassword}
          >
            Сгенерировать пароль
          </button>
        </div>

        <div className="mt-3">
          <label htmlFor="role" className="text-gray-700 font-medium">Роль</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            className="mt-1 flex items-center w-full border rounded-md px-3 py-2 outline-none focus-within:ring-2 focus-within:ring-blue-500 h-[40px] border-gray-500"
            onChange={handleChange}
            required
          >
            {Object.keys(roles).map((role) => (
              <option value={role} key={role}>
                {roles[role as keyof typeof roles]}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:cursor-pointer hover:bg-blue-600 focus-visible:ring-4 focus-visible:ring-blue-300 outline-none"
            disabled={isSubmitting}
          >
            Добавить
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddUserModal;
