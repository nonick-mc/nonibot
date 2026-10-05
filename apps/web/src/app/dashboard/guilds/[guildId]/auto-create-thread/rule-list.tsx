import type { autoCreateThreadRule } from '@repo/database';
import type { APIGuildChannel, APIRole, GuildChannelType } from 'discord-api-types/v10';
import type { InferSelectModel } from 'drizzle-orm';
import { HashIcon, ListIcon } from 'lucide-react';
import { Badge } from '@/components/reui/badge';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from '@/components/ui/item';
import { cn } from '@/lib/utils';
import { DeleteRuleDialog } from './_dialogs/delete-rule-dialog';
import { UpdateRuleDialog } from './_dialogs/update-rule-dialog';

type RuleListProps = {
  channels: APIGuildChannel<GuildChannelType>[];
  roles: APIRole[];
  rules: InferSelectModel<typeof autoCreateThreadRule>[];
};

export function RuleList({ channels, roles, rules }: RuleListProps) {
  if (!rules.length) {
    return (
      <Empty className='border border-dashed'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <ListIcon />
          </EmptyMedia>
          <EmptyTitle>チャンネルがありません</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className='flex flex-col gap-2'>
      {rules.map((rule) => {
        const targetChannel = channels.find((channel) => channel.id === rule.channelId);
        const targetChannelName = targetChannel?.name ?? '不明なチャンネル';

        return (
          <Item variant='outline' key={rule.channelId}>
            <ItemMedia>
              <HashIcon />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{targetChannelName}</ItemTitle>
              <div className='flex gap-2'>
                <Badge variant='secondary'>
                  <span
                    className={cn('ms-px size-1.5 rounded-full bg-destructive', {
                      'bg-success': rule.enabled,
                    })}
                  />{' '}
                  {rule.enabled ? 'アクティブ' : '非アクティブ'}
                </Badge>
              </div>
            </ItemContent>
            <ItemActions>
              <UpdateRuleDialog
                roles={roles}
                rule={rule}
                targetChannelName={targetChannelName}
                disabled={!targetChannel}
              />
              <DeleteRuleDialog targetChannelName={targetChannelName} rule={rule} />
            </ItemActions>
          </Item>
        );
      })}
    </div>
  );
}
