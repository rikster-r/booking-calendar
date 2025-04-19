import { User } from '@supabase/supabase-js';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/component';

type CurrentUserContextType = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  refreshUser: () => Promise<void>;
};

const CurrentUserContext = createContext<CurrentUserContextType>({
  user: null,
  setUser: () => {},
  refreshUser: async () => {},
});

export const useCurrentUser = () => useContext(CurrentUserContext);

const CurrentUserProvider = ({
  initialUser,
  children,
}: {
  initialUser: User | null;
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const supabase = createClient();

  const refreshUser = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) {
      setUser(data.user);
    }
  }, [supabase]);

  return (
    <CurrentUserContext.Provider value={{ user, setUser, refreshUser }}>
      {children}
    </CurrentUserContext.Provider>
  );
};

export default CurrentUserProvider;
