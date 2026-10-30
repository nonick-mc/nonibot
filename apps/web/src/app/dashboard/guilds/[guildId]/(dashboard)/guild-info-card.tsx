import { CDNRoutes, GuildFeature, ImageFormat, RouteBases } from 'discord-api-types/v10';
import { BadgeCheckIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { getGuild } from '@/lib/discord/api';
import { GuildInfoCardAction } from './guild-info-card-action';

const firstGrapheme = (text: string) =>
  new Intl.Segmenter().segment(text)[Symbol.iterator]().next().value?.segment ?? '';

export async function GuildInfoCard({ guildId }: { guildId: string }) {
  const guild = await getGuild(guildId);
  const features: string[] = guild.features;

  const status = features.includes(GuildFeature.Verified) ? (
    <span className='flex items-center gap-1'>
      <BadgeCheckIcon className='size-4 text-green-600' />
      認証済みサーバー
    </span>
  ) : features.includes(GuildFeature.Partnered) ? (
    <span className='flex items-center gap-1'>
      <BadgeCheckIcon className='size-4 text-blue-600' />
      パートナーサーバー
    </span>
  ) : features.includes(GuildFeature.Community) ? (
    'コミュニティサーバー'
  ) : null;

  return (
    <Card size='sm'>
      <CardContent className='flex items-center gap-4'>
        <Avatar className='size-10'>
          {guild.icon && (
            <AvatarImage
              src={RouteBases.cdn + CDNRoutes.guildIcon(guild.id, guild.icon, ImageFormat.WebP)}
            />
          )}
          <AvatarFallback>{firstGrapheme(guild.name)}</AvatarFallback>
        </Avatar>
        <div className='flex min-w-0 flex-1 flex-col'>
          <span className='truncate font-medium' title={guild.name}>
            {guild.name}
          </span>
          {status && <span className='text-sm text-muted-foreground'>{status}</span>}
        </div>
        <GuildInfoCardAction guildId={guildId} />
      </CardContent>
    </Card>
  );
}
