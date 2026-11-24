'use client';

import { SiDiscord } from '@icons-pack/react-simple-icons';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button, type ButtonStatus } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

export function LoginButton() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ButtonStatus>('idle');

  return (
    <Button
      onClick={async () => {
        setStatus('loading');
        await authClient.signIn.social({
          provider: 'discord',
          callbackURL: searchParams.get('next') ?? '/dashboard',
        });
      }}
      size='lg'
      status={status}
    >
      <SiDiscord className='mt-0.5' />
      Discordでログイン
    </Button>
  );
}
