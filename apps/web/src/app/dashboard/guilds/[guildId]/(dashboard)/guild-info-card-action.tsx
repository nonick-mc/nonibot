'use client';

import { CheckIcon, CopyIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCopyToClipboard } from 'usehooks-ts';
import { Button } from '@/components/ui/button';

export function GuildInfoCardAction({ guildId }: { guildId: string }) {
  const [, copy] = useCopyToClipboard();
  const [isDisabled, setIsDisabled] = useState(false);

  const handleCopy = async () => {
    if (!(await copy(guildId))) return toast.error('サーバーIDのコピーに失敗しました');
    setIsDisabled(true);
    toast.success('サーバーIDをコピーしました');
    setTimeout(() => setIsDisabled(false), 3000);
  };

  return (
    <Button
      variant='outline'
      aria-label='サーバーIDをコピー'
      onClick={handleCopy}
      disabled={isDisabled}
    >
      {isDisabled ? <CheckIcon /> : <CopyIcon />}
      <span className='hidden sm:block'>サーバーIDをコピー</span>
    </Button>
  );
}
