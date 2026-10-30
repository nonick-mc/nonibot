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
    setIsDisabled(true);
    await copy(guildId);
    toast.success('サーバーIDをコピーしました');
    setTimeout(() => setIsDisabled(false), 3000);
  };

  return (
    <Button variant='outline' onClick={handleCopy} disabled={isDisabled}>
      {isDisabled ? <CheckIcon /> : <CopyIcon />}
      <span className='hidden sm:block'>サーバーIDをコピー</span>
    </Button>
  );
}
