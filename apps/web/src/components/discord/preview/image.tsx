'use client';

import type { Placeholder } from '@repo/placeholders';
import { ImageIcon } from 'lucide-react';
import { useContext } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { DiscordMessageContext } from '../message-context';

const PlaceHolderRegex = /^\{\{\s*(\w+)\s*\}\}$/;

/** srcがURLとして使用可能なプレースホルダーの場合、そのプレースホルダーを返す */
export function resolveUrlPlaceholder(src: string, placeholders: Placeholder | undefined) {
  const key = PlaceHolderRegex.exec(src)?.[1];
  const placeholder = key ? placeholders?.find((v) => v.key === key) : undefined;
  return placeholder?.isUrl ? placeholder : undefined;
}

type DiscordImageProps = {
  src: string;
  alt?: string;
  className?: string;
  spoiler?: boolean;
};

export function DiscordImage({ src, alt, className, spoiler }: DiscordImageProps) {
  const { placeholders } = useContext(DiscordMessageContext);

  const placeholder = resolveUrlPlaceholder(src, placeholders);
  const isUrlPlaceholder = placeholder !== undefined;

  const image = (
    <div
      className={cn(
        'relative overflow-hidden rounded-sm @container',
        { border: spoiler || isUrlPlaceholder, 'border-primary': isUrlPlaceholder },
        className,
      )}
    >
      {isUrlPlaceholder ? (
        <div
          className={cn(
            'flex h-full w-full flex-col items-center justify-center gap-1 px-1 py-1 text-center',
            spoiler && 'blur-2xl',
          )}
        >
          <ImageIcon className='size-6 text-muted-foreground' />
          <span className='w-full truncate text-xs font-mono'>{placeholder?.key}</span>
        </div>
      ) : (
        // biome-ignore lint/performance/noImgElement: Users can specify an arbitrary image URL.
        <img
          src={src}
          alt={alt ?? ''}
          className={cn('block h-full w-full object-cover', spoiler && 'blur-2xl')}
        />
      )}
      {spoiler && (
        <div className='absolute inset-0 flex cursor-pointer items-center justify-center'>
          <span className='rounded-full bg-black/60 px-2 py-1 @sm:px-3 @sm:py-2 text-md font-bold text-white'>
            ネタバレ
          </span>
        </div>
      )}
    </div>
  );

  if (!isUrlPlaceholder || !placeholder) return image;

  return (
    <Tooltip>
      <TooltipTrigger render={image} />
      <TooltipContent>{placeholder.description}</TooltipContent>
    </Tooltip>
  );
}
