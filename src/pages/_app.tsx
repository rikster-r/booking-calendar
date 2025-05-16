import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Bounce, ToastContainer } from 'react-toastify';
import { Inter } from 'next/font/google';
import OnlineUsersProvider from '@/context/OnlineUsersContext';
import CurrentUserProvider from '@/context/CurrentUserContext';
import { SWRConfig } from 'swr';
import { useRouter } from 'next/router';
import NProgress from 'nprogress';
import { useEffect } from 'react';

const inter = Inter({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
});

export default function App({ Component, pageProps }: AppProps) {
  const user = pageProps.user || null;
  const router = useRouter();

  useEffect(() => {
    const handleStart = () => NProgress.set(0.5);
    const handleStop = () => NProgress.done();

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleStop);
    router.events.on('routeChangeError', handleStop);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleStop);
      router.events.off('routeChangeError', handleStop);
    };
  }, [router]);

  return (
    <SWRConfig value={{ fallback: pageProps.fallback }}>
      <OnlineUsersProvider user={user}>
        <CurrentUserProvider initialUser={user}>
          <div className={`antialiased ${inter.className}`}>
            <Component {...pageProps} />
            <ToastContainer
              position="top-right"
              autoClose={2000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
              transition={Bounce}
              limit={4}
            />
          </div>
        </CurrentUserProvider>
      </OnlineUsersProvider>
    </SWRConfig>
  );
}
