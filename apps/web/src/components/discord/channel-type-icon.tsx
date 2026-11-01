import { ChannelType, type GuildChannelType } from 'discord-api-types/v10';
import {
  FolderIcon,
  HashIcon,
  ImageIcon,
  MegaphoneIcon,
  MessageCircleIcon,
  PodcastIcon,
  SpoolIcon,
  Volume2Icon,
} from 'lucide-react';
import type React from 'react';
import { cn } from '@/lib/utils';

const channelTypeIconMap: Partial<Record<GuildChannelType, React.ElementType>> = {
  [ChannelType.AnnouncementThread]: SpoolIcon,
  [ChannelType.GuildAnnouncement]: MegaphoneIcon,
  [ChannelType.GuildCategory]: FolderIcon,
  [ChannelType.GuildForum]: MessageCircleIcon,
  [ChannelType.GuildMedia]: ImageIcon,
  [ChannelType.GuildStageVoice]: PodcastIcon,
  [ChannelType.GuildText]: HashIcon,
  [ChannelType.GuildVoice]: Volume2Icon,
  [ChannelType.PrivateThread]: SpoolIcon,
  [ChannelType.PublicThread]: SpoolIcon,
};

type ChannelTypeIconProps = {
  type: GuildChannelType;
  className?: string;
};

export function ChannelTypeIcon({ type, className }: ChannelTypeIconProps) {
  const Icon = channelTypeIconMap[type];
  return Icon ? (
    <Icon className={cn('text-muted-foreground hover:text-muted-foreground mt-0.5', className)} />
  ) : null;
}
