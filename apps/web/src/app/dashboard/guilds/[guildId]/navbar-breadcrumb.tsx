'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { Fragment } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { SidebarNavigationItems } from './sidebar-navigation-items';

type NavbarBreadcrumbProps = {
  guildId: string;
  segments: string[];
  /** 末尾に追加するラベル（動的な子ページの名前など） */
  current?: string;
};

type BreadcrumbEntry = {
  title: string;
  href?: string;
};

function getBreadcrumbItems(guildId: string, segments: string[]) {
  const items: BreadcrumbEntry[] = [];

  for (const group of SidebarNavigationItems) {
    for (const item of group.items) {
      if (item.key && segments[0] === item.key) {
        items.push({ title: group.title });
        items.push({ title: item.title, href: item.url(guildId) });

        // サブアイテムのチェック
        if (item.subitems && segments[1]) {
          const subitem = item.subitems.find((sub) => sub.key === segments[1]);
          if (subitem) {
            items.push({ title: subitem.title });
          }
        }
        return items;
      }
    }
  }

  // キーがない場合はグループ名のみ追加
  if (segments.length === 0) {
    const firstGroup = SidebarNavigationItems[0];
    items.push({ title: firstGroup?.title ?? '' });
    const firstItem = firstGroup?.items[0];
    items.push({ title: firstItem?.title ?? '' });
  }

  return items;
}

export function NavbarBreadcrumb({ guildId, segments, current }: NavbarBreadcrumbProps) {
  const breadcrumbItems = getBreadcrumbItems(guildId, segments);
  if (current) {
    breadcrumbItems.push({ title: current });
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => {
          const itemKey = `${item.title}-${index}`;
          return (
            <Fragment key={itemKey}>
              {index < breadcrumbItems.length - 1 ? (
                <>
                  <BreadcrumbItem className='hidden md:block'>
                    {item.href ? (
                      <BreadcrumbLink render={<Link href={item.href as Route} />}>
                        {item.title}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbLink>{item.title}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className='hidden md:block' />
                </>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbPage>{item.title}</BreadcrumbPage>
                </BreadcrumbItem>
              )}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
