'use client';

import dayjs from 'dayjs';
import { ClockIcon, TargetIcon, UserIcon, ZapIcon } from 'lucide-react';
import { PreviewResourcesContext } from '@/components/discord/preview/context';
import { ChannelMention, RoleMention } from '@/components/discord/preview/mention';
import { DiscordMessage, type MessagePreviewProps } from '@/components/discord/preview/message';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { actionTypeTexts, type CustomizedAuditLog, targetNameTexts } from './columns';
import {
  type Change,
  describeChanges,
  type MessageValue,
  type Resources,
  type Value,
} from './describe';

type Props = {
  log: CustomizedAuditLog | null;
  resources: Resources;
  onClose: () => void;
};

function Val({ value }: { value: Value }) {
  if (typeof value === 'string') return <Em>{value}</Em>;
  return 'channel' in value ? (
    <ChannelMention id={value.channel} />
  ) : (
    <RoleMention id={value.role} />
  );
}

function Vals({ values }: { values: Value[] }) {
  if (values.length === 0) return <Em>なし</Em>;
  return values.map((value, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: 並びが固定の表示用リスト
    <span key={i}>
      {i > 0 && '、'}
      <Val value={value} />
    </span>
  ));
}

const Em = ({ children }: { children: React.ReactNode }) => (
  <strong className='font-semibold'>{children}</strong>
);

function Sentence({ change }: { change: Change }) {
  const label = <Em>{'label' in change ? change.label : ''}</Em>;

  switch (change.kind) {
    case 'toggle':
      return (
        <>
          {label}を<Em>{change.value ? 'オン' : 'オフ'}</Em>にしました
        </>
      );
    case 'changed':
      return (
        <>
          {label}を<Val value={change.after} />
          に設定しました
        </>
      );
    case 'set':
      return (
        <>
          {label}を<Val value={change.after} />
          に設定しました
        </>
      );
    case 'unset':
      return <>{label}の設定を解除しました</>;
    case 'list':
      return (
        <>
          {change.added.length > 0 && (
            <>
              {label}に<Vals values={change.added} />
              を追加しました
            </>
          )}
          {change.added.length > 0 && change.removed.length > 0 && <br />}
          {change.removed.length > 0 && (
            <>
              {label}から
              <Vals values={change.removed} />
              を削除しました
            </>
          )}
        </>
      );
    case 'group':
      return (
        <>
          {label}：<Em>{change.step}</Em>
        </>
      );
    case 'reordered':
      return <>{label}の順序を変更しました</>;
    case 'message':
      return <>{label}を設定しました</>;
    case 'value':
      return (
        <>
          {label}を<Vals values={Array.isArray(change.value) ? change.value : [change.value]} />
          に設定しました
        </>
      );
    case 'valueMessage':
      return <>{label}を設定しました</>;
  }
}

function InfoRow({ icon: Icon, children }: { icon: typeof UserIcon; children: React.ReactNode }) {
  return (
    <div className='flex items-center gap-2 text-sm'>
      <Icon className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
      {children}
    </div>
  );
}

/** メッセージを持つ変更だけプレビューの対象にする */
function getPreview(change: Change): { components: MessageValue } | null {
  if (change.kind === 'message') return { components: change.after };
  if (change.kind === 'valueMessage') return { components: change.value };
  return null;
}

function ChangeList({
  changes,
  resources,
  nested = false,
}: {
  changes: Change[];
  resources: Resources;
  nested?: boolean;
}) {
  return (
    <ol className='flex flex-col gap-3 text-sm'>
      {changes.length === 0 && (
        <li className='text-center text-muted-foreground'>変更はありません</li>
      )}
      {changes.map((change, i) => {
        const preview = getPreview(change);

        return (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: ラベルが重複しうる(「不明な設定」)ため
            key={`${change.kind}-${change.label}-${i}`}
            className='flex items-start gap-3'
          >
            <span className={cn('font-mono', nested ? 'text-warning' : 'text-success')}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className='flex min-w-0 flex-1 flex-col gap-2'>
              <p>
                <Sentence change={change} />
              </p>
              {preview &&
                (preview.components?.length ? (
                  <DiscordMessage
                    components={preview.components as MessagePreviewProps['components']}
                    resources={resources}
                    className='max-h-100'
                  />
                ) : (
                  <p className='text-muted-foreground'>詳細がありません。</p>
                ))}
              {change.kind === 'group' && (
                <ChangeList changes={change.children} resources={resources} nested />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function DetailSheet({ log, resources, onClose }: Props) {
  const changes = log ? describeChanges(log.targetName, log.before, log.after, resources) : [];
  // 変更後がないログ(削除など)は詳細を表示しない
  const hasAfter = log?.after != null;
  const author = log?.author;

  return (
    <PreviewResourcesContext.Provider value={resources}>
      <Sheet open={log !== null} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className='data-[side=right]:sm:max-w-xl'>
          {log && (
            <>
              <SheetHeader>
                <SheetTitle>監査ログの詳細</SheetTitle>
                <SheetDescription className='sr-only'>監査ログの詳細</SheetDescription>
                <Card className='mt-3 p-4 flex flex-col gap-3'>
                  <InfoRow icon={UserIcon}>
                    {author ? (
                      <>
                        <Avatar className='size-6'>
                          <AvatarImage src={author.avatarUrl} />
                          <AvatarFallback>{author.username.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span>@{author.username}</span>
                      </>
                    ) : (
                      <span className='text-muted-foreground'>不明なユーザー</span>
                    )}
                  </InfoRow>
                  <InfoRow icon={ClockIcon}>
                    {dayjs(log.createdAt).tz().format('YYYY/MM/DD HH:mm')}
                  </InfoRow>
                  <InfoRow icon={TargetIcon}>
                    {targetNameTexts[log.targetName] ?? '不明なターゲット'}
                  </InfoRow>
                  <InfoRow icon={ZapIcon}>
                    {actionTypeTexts[log.actionType] ?? '不明なアクション'}
                  </InfoRow>
                </Card>
              </SheetHeader>
              <div className='flex flex-1 flex-col gap-6 overflow-y-auto no-scrollbar scroll-fade-y px-6 pb-4'>
                {hasAfter && (
                  <section className='flex flex-col gap-3'>
                    <h3 className='font-semibold text-sm'>詳細</h3>
                    <ChangeList changes={changes} resources={resources} />
                  </section>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PreviewResourcesContext.Provider>
  );
}
