import { CDNRoutes, ImageFormat, RouteBases } from 'discord-api-types/v10';
import { ChevronsUpDown, PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { getGuild, getManageableGuilds } from '@/lib/discord/api';

type GuildSwitcherProps = {
  currentGuildId: string;
};

export async function GuildSwitcher({ currentGuildId }: GuildSwitcherProps) {
  const currentGuild = await getGuild(currentGuildId, undefined, { revalidate: 60 * 60 * 24 });

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size='lg'
                className='h-12 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border'
              >
                <Avatar className='size-6 rounded-lg'>
                  <AvatarImage
                    src={
                      currentGuild.icon
                        ? RouteBases.cdn +
                          CDNRoutes.guildIcon(currentGuild.id, currentGuild.icon, ImageFormat.WebP)
                        : undefined
                    }
                  />
                  <AvatarFallback>{currentGuild.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <span>{currentGuild.name}</span>
                <ChevronsUpDown className='ml-auto' />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent className='w-(--anchor-width)' align='center' side='bottom'>
            <DropdownMenuGroup>
              <DropdownMenuLabel className='text-xs'>サーバー</DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked>
                <Avatar className='size-6'>
                  <AvatarImage
                    src={
                      currentGuild.icon
                        ? RouteBases.cdn +
                          CDNRoutes.guildIcon(currentGuild.id, currentGuild.icon, ImageFormat.WebP)
                        : undefined
                    }
                  />
                  <AvatarFallback>{currentGuild.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <span>{currentGuild.name}</span>
              </DropdownMenuCheckboxItem>
              <Suspense fallback={<GuildsMenuFallback />}>
                <GuildsMenu currentGuildId={currentGuildId} />
              </Suspense>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={
                <a href='/api/invite'>
                  <PlusIcon />
                  サーバーを追加
                </a>
              }
              nativeButton={false}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function GuildsMenuFallback() {
  return (
    <>
      {Array.from({ length: 2 }).map((_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: Skeleton
        <DropdownMenuCheckboxItem disabled key={index}>
          <Skeleton className='size-6 rounded-full' />
          <Skeleton className='flex-1 h-4' />
        </DropdownMenuCheckboxItem>
      ))}
    </>
  );
}

async function GuildsMenu({ currentGuildId }: { currentGuildId: string }) {
  const guilds = await getManageableGuilds();

  return (
    <>
      {guilds
        .filter((guild) => guild.id !== currentGuildId)
        .map((v) => (
          <DropdownMenuItem
            key={v.id}
            render={
              <Link href={`/dashboard/guilds/${v.id}`}>
                <Avatar className='size-6'>
                  <AvatarImage
                    src={
                      v.icon
                        ? RouteBases.cdn + CDNRoutes.guildIcon(v.id, v.icon, ImageFormat.WebP)
                        : undefined
                    }
                  />
                  <AvatarFallback>{v.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <span>{v.name}</span>
              </Link>
            }
            nativeButton={false}
          />
        ))}
    </>
  );
}
