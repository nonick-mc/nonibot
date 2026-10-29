import type { CustomActionStep } from '@repo/database';
import type { InternalApiRole } from '@repo/shared/types';
import { MessageSquareReplyIcon, UserRoundCogIcon, ZapIcon } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/reui/badge';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from '@/components/ui/item';
import { ActionMenu } from './action-menu';

type ActionListProps = {
  guildId: string;
  actions: { id: string; name: string; steps: CustomActionStep[] }[];
  roles: InternalApiRole[];
  /** アクションID → 使用している保存済みメッセージの件数 */
  usage: Record<string, number>;
};

export function ActionList({ guildId, actions, usage }: ActionListProps) {
  if (!actions.length) {
    return (
      <Empty className='border border-dashed'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <ZapIcon />
          </EmptyMedia>
          <EmptyTitle>登録したアクションがありません</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className='flex flex-col gap-3'>
      {actions.map((action) => (
        <Item
          variant='outline'
          key={action.id}
          className='relative transition-colors hover:not-has-[button:hover]:bg-muted'
        >
          <ItemMedia>
            <ZapIcon strokeWidth={1.5} />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>
              {/* リンクをItem全体に広げる。メニューのボタンはリンクの外に置き、入れ子にしない */}
              <Link
                href={`/dashboard/guilds/${guildId}/custom-action/${action.id}` as Route}
                className='outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50'
              >
                {action.name}
              </Link>
            </ItemTitle>
            <div className='flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-muted-foreground'>
              {action.steps.length ? (
                action.steps.map((step, index) => {
                  switch (step.type) {
                    case 'role-toggle':
                      return (
                        <Badge variant='outline' key={step.type}>
                          <UserRoundCogIcon className='size-3' />
                          ロールの付与・解除
                        </Badge>
                      );
                    case 'reply-message':
                      return (
                        <Badge variant='outline' key={step.type}>
                          <MessageSquareReplyIcon className='size-3' />
                          メッセージを返信する
                        </Badge>
                      );
                    default:
                      return (
                        // biome-ignore lint/suspicious/noArrayIndexKey: index以外に使用できる値が存在しない
                        <Badge variant='outline' key={index}>
                          不明なアクション
                        </Badge>
                      );
                  }
                })
              ) : (
                <span className='text-warning'>アクションが設定されていません</span>
              )}
            </div>
          </ItemContent>
          <ItemActions>
            <ActionMenu id={action.id} name={action.name} usageCount={usage[action.id] ?? 0} />
          </ItemActions>
        </Item>
      ))}
    </div>
  );
}
