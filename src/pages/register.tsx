import { useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import Head from 'next/head';
import RegisterFirstStep from '@/components/RegisterFirstStep';
import RegisterSecondStep from '@/components/RegisterSecondStep';

export default function Register() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'client',
  });
  const router = useRouter();

  const handleChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement
  > = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      router.push('/');
    } else {
      const errorData = await res.json();
      if (errorData.error === 'User already registered') {
        toast.error('Пользователь с данной почтой уже зарегистрирован');
      } else {
        toast.error(errorData.error || 'Ошибка регистрации');
      }
    }
  };

  return (
    <>
      <Head>
        <title>Регистрация</title>
        <meta name="description" content="Регистрация нового аккаунта" />
      </Head>
      {step === 1 && (
        <RegisterFirstStep
          handleChange={handleChange}
          formData={formData}
          nextStep={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <RegisterSecondStep
          setFormData={setFormData}
          formData={formData}
          setStep={setStep}
          handleSubmit={handleSubmit}
        ></RegisterSecondStep>
      )}
    </>
  );
}
