'use client';

import { cn } from '@/lib/utils';

type DiscordImageProps = {
  src: string;
  alt?: string;
  className?: string;
  spoiler?: boolean;
};

export function DiscordImage({ src, alt, className, spoiler }: DiscordImageProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-sm @container',
        { border: spoiler },
        className,
      )}
    >
      {/** biome-ignore lint/performance/noImgElement: Users can specify an arbitrary image URL. */}
      <img
        src={src}
        alt={alt ?? ''}
        className={cn('block h-full w-full object-cover', spoiler && 'blur-2xl')}
      />
      {spoiler && (
        <div className='absolute inset-0 flex cursor-pointer items-center justify-center'>
          <span className='rounded-full bg-black/60 px-2 py-1 @sm:px-3 @sm:py-2 text-md font-bold text-white'>
            ネタバレ
          </span>
        </div>
      )}
    </div>
  );
}
