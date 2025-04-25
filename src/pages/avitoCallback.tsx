import { createClient } from '@/lib/supabase/server-props';
import { GetServerSideProps } from 'next';

const AvitoCallback = () => {
  // This page will never render on the client, as we redirect in getServerSideProps
  return null;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = createClient(context);

  const userRes = await supabase.auth.getUser();

  if (userRes.error || !userRes.data) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  const { avitoCode, avitoState } = context.query;

  if (!avitoCode || !avitoState) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const stateCookie = context.req.cookies[avitoState as string];
  if (!stateCookie) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const { redirectUrl, expiresOn } = JSON.parse(stateCookie);

  if (new Date(expiresOn) < new Date()) {
    // Token expired
    return {
      redirect: {
        destination: `${redirectUrl}?error=expired`,
        permanent: false,
      },
    };
  }

  // Remove the cookie
  context.res.setHeader(
    'Set-Cookie',
    `${avitoState}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  );

  // Fetch the token from API
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_URL}/api/avito/accessToken`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        avitoCode,
        userId: userRes.data.user.id,
      }),
    }
  );
  if (!res.ok) {
    return {
      redirect: {
        destination: `${redirectUrl}?error=token`,
        permanent: false,
      },
    };
  }

  return {
    redirect: {
      destination: redirectUrl,
      permanent: false,
    },
  };
};

export default AvitoCallback;
