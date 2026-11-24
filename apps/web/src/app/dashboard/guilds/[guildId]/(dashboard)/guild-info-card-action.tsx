'use client';

import { Copy } from '@gravity-ui/icons';
import { useCopyToClipboard } from 'usehooks-ts';
import { GravityIcon } from '@/components/gravity-icon';
import { Button } from '@/components/ui/button';

export function GuildInfoCardAction({ guildId }: { guildId: string }) {
  const [, copy] = useCopyToClipboard();

  const handleCopy = async () => {
    if (!(await copy(guildId))) throw new Error('コピーに失敗しました');
  };

  return (
    <Button
      feedback
      successLabel={<span className='max-sm:sr-only'>コピーしました</span>}
      errorLabel={<span className='max-sm:sr-only'>コピーに失敗しました</span>}
      variant='outline'
      aria-label='サーバーIDをコピー'
      onClick={handleCopy}
    >
      <GravityIcon icon={Copy} className='max-sm:mt-0' />
      <span className='hidden sm:block'>サーバーIDをコピー</span>
    </Button>
  );
}
