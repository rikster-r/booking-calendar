import { createContext } from 'react';
import { useOnlineUsers } from '../hooks/useOnlineUsers';
import { User } from '@supabase/supabase-js';

export const OnlineUsersContext = createContext<string[]>([]);

type Props = {
  user: User;
  children: React.ReactNode;
};

const OnlineUsersProvider = ({ user, children }: Props) => {
  const onlineUserIds = useOnlineUsers(user);

  return (
    <OnlineUsersContext.Provider value={onlineUserIds}>
      {children}
    </OnlineUsersContext.Provider>
  );
};

export default OnlineUsersProvider;
