'use client';

import { ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { DashboardFeatureCategories } from './features';

type FeatureTabsProps = {
  guildId: string;
  featureStatuses: Record<string, boolean>;
};

export function FeatureTabs({ guildId, featureStatuses }: FeatureTabsProps) {
  return (
    <Tabs className='gap-4' defaultValue={DashboardFeatureCategories[0].value}>
      <TabsList className='no-scrollbar scroll-fade-x max-w-full justify-start overflow-x-auto'>
        {DashboardFeatureCategories.map((category) => (
          <TabsTrigger key={category.value} value={category.value} className='shrink-0 px-3'>
            <category.icon />
            {category.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {DashboardFeatureCategories.map((category) => (
        <TabsContent key={category.value} value={category.value}>
          <div className='grid gap-4 grid-cols-2 lg:grid-cols-3'>
            {category.features.map(({ key, title, description, icon: Icon, hasStatus }) => (
              <Card key={key} size='sm'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Icon className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                    {title}
                  </CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent
                  className={cn('mt-auto flex items-center justify-end', {
                    'justify-between': hasStatus,
                  })}
                >
                  {hasStatus && (
                    <span className='flex items-center gap-1.5 text-sm text-muted-foreground'>
                      <span
                        className={cn(
                          'size-2 rounded-full mt-0.5',
                          featureStatuses[key] ? 'bg-success' : 'bg-muted-foreground/40',
                        )}
                      />
                      {featureStatuses[key] ? '有効' : '無効'}
                    </span>
                  )}
                  <Button
                    variant='outline'
                    size='sm'
                    render={<Link href={`/dashboard/guilds/${guildId}/${key}`} />}
                  >
                    設定
                    <ArrowRightIcon />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
