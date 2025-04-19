import { User } from '@supabase/supabase-js';
import Sidebar from './Sidebar';
import { useRouter } from 'next/router';

type Props = {
  user: User;
  title: string;
  children: React.ReactNode;
  mainClassName?: string;
  titleClassName?: string;
};

const Layout = ({
  user,
  title,
  children,
  mainClassName,
  titleClassName,
}: Props) => {
  const router = useRouter();

  return (
    <div className="flex min-h-screen bg-gray-100">
      <main
        className={`flex-1 w-full lg:w-[calc(100%-320px)] lg:ml-80 flex flex-col ${mainClassName}`}
      >
        <div className="flex items-center">
          <Sidebar
            user={user}
            buttonClassName={
              router.asPath === '/' ? 'text-white' : 'text-black'
            }
          />
          <h1
            className={`w-full mx-auto text-xl font-bold py-4 lg:py-6 lg:pl-16 text-left ${titleClassName}`}
          >
            {title}
          </h1>
        </div>
        {children}
      </main>
    </div>
  );
};

export default Layout;
