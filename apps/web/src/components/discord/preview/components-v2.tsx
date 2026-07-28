'use client';

import { ComponentType, SeparatorSpacingSize } from 'discord-api-types/v10';
import type z from 'zod';
import type { messageUserComponentsSchema } from '@/lib/discord/zod';
import { cn } from '@/lib/utils';
import { Separator as ShadcnSeparator } from '../../ui/separator';
import { DiscordImage } from './image';
import { DiscordMarkdown } from './markdown';

type PreviewComponents = z.input<typeof messageUserComponentsSchema>;
type PreviewComponent = PreviewComponents[number];

type ComponentProps<T extends ComponentType> = {
  component: Extract<PreviewComponent, { type: T }>;
};

export function TextDisplay({ component }: ComponentProps<ComponentType.TextDisplay>) {
  return (
    <div className='leading-snug'>
      <DiscordMarkdown content={component.content} />
    </div>
  );
}

export function Section({ component }: ComponentProps<ComponentType.Section>) {
  return (
    <div className='flex items-start gap-4'>
      <div className='flex flex-1 min-w-0 flex-col gap-1 leading-snug'>
        {component.components.map((textComp, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: There are no usable elements other than the index
          <DiscordMarkdown key={i} content={textComp.content} />
        ))}
      </div>
      {component.accessory.media.url && (
        <DiscordImage
          src={component.accessory.media.url}
          alt={component.accessory.description ?? undefined}
          spoiler={component.accessory.spoiler}
          className='size-21.25 shrink-0'
        />
      )}
    </div>
  );
}

export function MediaGallery({ component }: ComponentProps<ComponentType.MediaGallery>) {
  const items = component.items.filter((item) => item.media.url);
  if (!items.length) return null;

  if (items.length === 1) {
    return (
      <DiscordImage
        src={items[0].media.url}
        alt={items[0].description ?? undefined}
        spoiler={items[0].spoiler}
      />
    );
  }

  if (items.length === 3) {
    return (
      <div className='grid grid-cols-2 gap-0.5 overflow-hidden rounded'>
        <DiscordImage
          src={items[0].media.url}
          alt={items[0].description ?? undefined}
          spoiler={items[0].spoiler}
          className='row-span-2 h-full rounded-none'
        />
        <DiscordImage
          src={items[1].media.url}
          alt={items[1].description ?? undefined}
          spoiler={items[1].spoiler}
          className='rounded-none'
        />
        <DiscordImage
          src={items[2].media.url}
          alt={items[2].description ?? undefined}
          spoiler={items[2].spoiler}
          className='rounded-none'
        />
      </div>
    );
  }

  return (
    <div className='grid grid-cols-2 gap-0.5 overflow-hidden rounded'>
      {items.map((item, i) => (
        <DiscordImage
          // biome-ignore lint/suspicious/noArrayIndexKey: There are no usable elements other than the index
          key={i}
          src={item.media.url}
          alt={item.description ?? undefined}
          spoiler={item.spoiler}
          className='aspect-square rounded-none'
        />
      ))}
    </div>
  );
}

export function Separator({ component }: ComponentProps<ComponentType.Separator>) {
  return (
    <ShadcnSeparator
      className={cn(
        { 'my-2': component.spacing === SeparatorSpacingSize.Large },
        { 'bg-transparent': !component.divider },
      )}
    />
  );
}

export function Container({ component }: ComponentProps<ComponentType.Container>) {
  const accentColor = component.accent_color;
  const hasAccent = accentColor != null;

  return (
    <div className='relative overflow-hidden rounded-lg border bg-discord-card'>
      <div
        className={cn('relative', component.spoiler && 'blur-xl pointer-events-none select-none')}
      >
        {hasAccent && (
          <div
            className='absolute bottom-0 left-0 top-0 w-1'
            style={{
              backgroundColor: `#${accentColor.toString(16).padStart(6, '0')}`,
            }}
          />
        )}
        <div className={cn('flex flex-col gap-2 p-3', hasAccent && 'pl-4')}>
          {component.components.map((child, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: There are no usable elements other than the index
            <ComponentV2 key={i} component={child as PreviewComponent} />
          ))}
        </div>
      </div>
      {component.spoiler && (
        <div className='absolute inset-0 flex cursor-pointer items-center justify-center'>
          <span className='rounded-full bg-black/60 px-2 py-1 @sm:px-3 @sm:py-2 text-md font-bold text-white'>
            ネタバレ
          </span>
        </div>
      )}
    </div>
  );
}

export function ComponentV2({ component }: { component: PreviewComponent }) {
  switch (component.type) {
    case ComponentType.TextDisplay:
      return <TextDisplay component={component} />;
    case ComponentType.Section:
      return <Section component={component} />;
    case ComponentType.MediaGallery:
      return <MediaGallery component={component} />;
    case ComponentType.Separator:
      return <Separator component={component} />;
    case ComponentType.Container:
      return <Container component={component} />;
    default:
      return null;
  }
}
