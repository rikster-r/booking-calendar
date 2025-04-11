import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase/component';
import { User } from '@supabase/supabase-js';

const supabase = createClient();

export function useOnlineUsers(user: User) {
  const [onlineIds, setOnlineIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('presence:online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineIds(Object.keys(state));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  return onlineIds;
}
