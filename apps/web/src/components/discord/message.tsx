import { CheckIcon } from 'lucide-react';
import { useState } from 'react';
import type z from 'zod';
import type { messageUserComponentsSchema } from '@/lib/discord/zod';
import { ComponentV2 } from './components-v2';

export type MessagePreviewProps = {
  components: z.input<typeof messageUserComponentsSchema>;
  username: string;
  avatarUrl: string;
  showAppTag?: boolean;
  verified?: boolean;
};

export function DiscordMessage({
  components,
  username,
  avatarUrl,
  showAppTag,
  verified,
}: MessagePreviewProps) {
  const [renderTime] = useState(() => new Date());
  const timeStr = renderTime.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className='flex gap-3'>
      {/** biome-ignore lint/performance/noImgElement: ユーザーが任意にURLを指定できるため */}
      <img src={avatarUrl} alt={username} className='mt-0.5 size-10 shrink-0 rounded-full' />
      <div className='flex-1 min-w-0'>
        <div className='flex flex-wrap items-center gap-1.5'>
          <span className='text-sm font-medium leading-none'>{username}</span>
          {showAppTag && (
            <span className='flex rounded bg-discord-primary px-1 py-0.5 text-xs font-semibold leading-none text-white'>
              {verified && <CheckIcon className='mt-0.5 size-3' />}
              アプリ
            </span>
          )}
          <span className='text-xs leading-none text-muted-foreground'>{timeStr}</span>
        </div>
        <div className='max-w-150'>
          {components.length > 0 && (
            <div className='mt-1 flex flex-col gap-2'>
              {components.map((component, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: index以外に使用できない
                <ComponentV2 key={i} component={component} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
