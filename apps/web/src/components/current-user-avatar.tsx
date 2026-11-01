'use client';

import { forwardRef } from 'react';
import { authClient } from '@/lib/auth-client';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Skeleton } from './ui/skeleton';

export const CurrentUserAvatar = forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<typeof Avatar>
>(function CurrentUserAvatar(props, ref) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton className='size-8 rounded-full' />;
  }
  if (!session) {
    return null;
  }

  return (
    <Avatar ref={ref} {...props}>
      <AvatarImage
        src={session.user.image ?? undefined}
        alt={`@${session.user.name}のアバター画像`}
      />
      <AvatarFallback>
        {session.user.globalName?.slice(0, 2) ?? session.user.name.slice(0, 2)}
      </AvatarFallback>
    </Avatar>
  );
});
