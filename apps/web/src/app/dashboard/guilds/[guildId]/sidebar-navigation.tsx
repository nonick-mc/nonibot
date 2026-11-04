'use client';

import { ChevronRightIcon } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams, useSelectedLayoutSegments } from 'next/navigation';
import { Fragment } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { SidebarNavigationItems } from './sidebar-navigation-items';

type SidebarNavigationProps = {
  featureStatuses: Record<string, boolean>;
};

export function SidebarNavigation({ featureStatuses }: SidebarNavigationProps) {
  const params = useParams<{ guildId: string }>();
  const segments = useSelectedLayoutSegments().filter((s) => !s.startsWith('('));
  const { state, setOpen } = useSidebar();

  return (
    <>
      {SidebarNavigationItems.map((group, index) => (
        <Fragment key={group.title}>
          {index > 0 && (
            <SidebarSeparator className='hidden group-data-[collapsible=icon]:block data-horizontal:w-auto' />
          )}
          <SidebarGroup>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {item.subitems?.length ? (
                      <Collapsible
                        defaultOpen={segments[0] === item.key}
                        className='group/collapsible'
                      >
                        <CollapsibleTrigger
                          disabled={item.disabled}
                          render={
                            <SidebarMenuButton
                              tooltip={item.title}
                              onClick={() => state === 'collapsed' && setOpen(true)}
                            >
                              <item.icon className='text-muted-foreground mt-0.5' />
                              {item.title}
                              <ChevronRightIcon className='ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90' />
                            </SidebarMenuButton>
                          }
                        />
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subitems.map((subitem) => (
                              <SidebarMenuSubItem key={subitem.key}>
                                <SidebarMenuSubButton
                                  isActive={segments[0] === item.key && segments[1] === subitem.key}
                                  aria-disabled={subitem.disabled}
                                  render={
                                    subitem.disabled ? (
                                      <span>{subitem.title}</span>
                                    ) : (
                                      <Link
                                        href={`${item.url(params.guildId)}/${subitem.key}` as Route}
                                      >
                                        {subitem.title}
                                      </Link>
                                    )
                                  }
                                />
                                {subitem.badge && (
                                  <SidebarMenuBadge>{subitem.badge}</SidebarMenuBadge>
                                )}
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <>
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={segments[0] === item.key}
                          aria-disabled={item.disabled}
                          render={
                            item.disabled ? (
                              <span>
                                <item.icon className='text-muted-foreground mt-0.5' />
                                {item.title}
                              </span>
                            ) : (
                              <Link href={item.url(params.guildId) as Route}>
                                <item.icon className='text-muted-foreground mt-0.5' />
                                {item.title}
                              </Link>
                            )
                          }
                        />
                        {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                        {item.key && item.key in featureStatuses && (
                          <SidebarMenuBadge title={featureStatuses[item.key] ? '有効' : '無効'}>
                            <span
                              className={`size-1.5 rounded-full ${featureStatuses[item.key] ? 'bg-success' : 'bg-muted-foreground/40'}`}
                            />
                            <span className='sr-only'>
                              {featureStatuses[item.key] ? '有効' : '無効'}
                            </span>
                          </SidebarMenuBadge>
                        )}
                      </>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </Fragment>
      ))}
    </>
  );
}
