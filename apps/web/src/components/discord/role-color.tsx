import type { APIRoleColors } from 'discord-api-types/v10';
import { useId } from 'react';
import { cn } from '@/lib/utils';

type RoleColorProps = {
  colors: APIRoleColors;
  className?: string;
};

export function toHexColor(color: number) {
  return `#${color.toString(16).padStart(6, '0')}`;
}

export function RoleColor({ colors, className }: RoleColorProps) {
  const gradientId = useId();
  const stops = [colors.primary_color, colors.secondary_color, colors.tertiary_color].filter(
    (color) => color !== null,
  );

  const hasColor = colors.primary_color !== 0;

  return (
    <svg
      viewBox='0 0 16 16'
      className={cn('size-[0.75em] shrink-0', className)}
      role='img'
      aria-label='ロールの色'
    >
      {!hasColor ? (
        <circle cx='8' cy='8' r='8' className='fill-muted-foreground' />
      ) : stops.length > 1 ? (
        <>
          <defs>
            <linearGradient id={gradientId} x1='0' y1='0' x2='1' y2='1'>
              {stops.map((color, index) => (
                <stop
                  key={color}
                  offset={`${(index / (stops.length - 1)) * 100}%`}
                  stopColor={toHexColor(color)}
                />
              ))}
            </linearGradient>
          </defs>
          <circle cx='8' cy='8' r='8' fill={`url(#${gradientId})`} />
        </>
      ) : (
        <circle cx='8' cy='8' r='8' fill={toHexColor(stops[0] ?? colors.primary_color)} />
      )}
    </svg>
  );
}
