import { Geist } from 'next/font/google';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export default function Home() {
  const LOCALE = 'ru-RU';
  const today = new Date();
  const currentYear = today.toLocaleDateString('ru-RU', { year: 'numeric' });

  const daysList = Array.from({ length: 30 }, (_, i) => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const date = today.getDate();

    const day = new Date(year, month - 1, date + i);
    return [
      day.toLocaleDateString(LOCALE, { day: 'numeric' }),
      day.toLocaleDateString(LOCALE, {
        weekday: 'short',
      }),
    ];
  });


  return (
    <div
      className={`${geistSans.variable} min-h-screen p-2 pb-20 gap-16 sm:p-8 font-[family-name:var(--font-geist-sans)] flex`}
    >
      <main className="mx-auto">
        <h1 className="text-2xl sm:text-4xl font-bold pb-4">Календарь брони</h1>
        <div className="p-2 sm:p-4 bg-gray-100 flex gap-2 w-full max-w-screen overflow-scroll">
          <div className="flex flex-col gap-2 w-[100px]">
            <div className="text-lg font-bold h-[50px]">{currentYear}</div>
            <div className="bg-blue-700 text-white p-2 rounded-md text-center h-[50px] flex items-center justify-center">
              Академ
            </div>
          </div>
          <div className="grid grid-cols-[repeat(30,50px)] gap-2 overflow-scroll">
            {daysList.map(([day, weekday], i) => (
              <div
                className="bg-gray-300 p-2 rounded-md flex items-center justify-center h-[50px] w-[50px]"
                key={i}
              >
                <p>{day}</p>
                <p>{weekday}</p>
              </div>
            ))}
            {/* multiplied by amount of rooms */}
            {Array.from({ length: 30 * 9 }).map((_, i) => (
              <div
                className="bg-gray-300 p-2 rounded-md h-[50px] w-[50px] flex items-center justify-center"
                key={i}
              ></div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
