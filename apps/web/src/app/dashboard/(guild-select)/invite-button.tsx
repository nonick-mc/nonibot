import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getInviteUrl } from '@/lib/discord/invite';

export function InviteButton() {
  return (
    <Button
      size='lg'
      render={
        <a href={getInviteUrl()}>
          <PlusIcon className='mt-0.5' />
          サーバーを追加
        </a>
      }
      nativeButton={false}
    />
  );
}
