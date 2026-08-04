'use client';

import { ImageIcon } from 'lucide-react';
import { useContext } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { DiscordMessageContext } from '../message-context';

const PlaceHolderRegex = /^\{\{\s*(\w+)\s*\}\}$/;

type DiscordImageProps = {
  src: string;
  alt?: string;
  className?: string;
  spoiler?: boolean;
};

export function DiscordImage({ src, alt, className, spoiler }: DiscordImageProps) {
  const { placeholders } = useContext(DiscordMessageContext);

  const placeholderKey = PlaceHolderRegex.exec(src)?.[1];
  const placeholder = placeholderKey
    ? placeholders?.find((v) => v.key === placeholderKey)
    : undefined;
  const isUrlPlaceholder = placeholder?.isUrl === true;

  const image = (
    <div
      className={cn(
        'relative overflow-hidden rounded-sm @container',
        { border: spoiler || isUrlPlaceholder, 'border-primary': isUrlPlaceholder },
        className,
      )}
    >
      {isUrlPlaceholder ? (
        <div className='flex h-full w-full flex-col items-center justify-center gap-1 px-1 py-1 text-center'>
          <ImageIcon className='size-6' />
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
