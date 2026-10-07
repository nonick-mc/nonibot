import { ComponentType } from 'discord-api-types/v10';
import { CheckIcon } from 'lucide-react';
import { useState } from 'react';
import type z from 'zod';
import type { MessageUserComponentsSchema } from '@/lib/discord/zod';
import { cn } from '@/lib/utils';
import { ComponentV2 } from './components-v2';

export type MessagePreviewProps = {
  components: z.input<MessageUserComponentsSchema>;
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
            // ContainerとSectionは一番幅の広いものに揃える
            <div className='mt-1 grid grid-cols-[auto_1fr] gap-y-2'>
              {components.map((component, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: index以外に使用できない
                  key={i}
                  className={cn(
                    'min-w-0',
                    component.type === ComponentType.Container ||
                      component.type === ComponentType.Section
                      ? 'col-start-1'
                      : 'col-span-2',
                  )}
                >
                  <ComponentV2 component={component} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
