import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Bounce, ToastContainer } from 'react-toastify';
import { Inter } from 'next/font/google';
import OnlineUsersProvider from '@/context/OnlineUsersContext';
import CurrentUserProvider from '@/context/CurrentUserContext';
import { SWRConfig } from 'swr';

const inter = Inter({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
});

export default function App({ Component, pageProps }: AppProps) {
  const user = pageProps.user || null;

  return (
    <SWRConfig value={{fallback: pageProps.fallback}}>
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
