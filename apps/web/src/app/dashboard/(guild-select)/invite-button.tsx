import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function InviteButton() {
  return (
    <Button
      size='lg'
      render={
        <a href='/api/invite'>
          <PlusIcon className='mt-0.5' />
          サーバーを追加
        </a>
      }
      nativeButton={false}
    />
  );
}
