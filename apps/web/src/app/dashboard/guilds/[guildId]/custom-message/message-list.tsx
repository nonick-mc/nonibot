'use client';

import type { InternalApiChannel } from '@repo/shared/types';
import { cn } from 'cn';
import {
  CheckIcon,
  ClockIcon,
  ListIcon,
  PencilIcon,
  Trash2Icon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { z } from 'zod';
import { ChannelTypeIcon } from '@/components/discord/channel-type-icon';
import { ComponentsV2EditorDialog } from '@/components/discord/components-v2-editor/dialog';
import type { MessageResources } from '@/components/discord/resources';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Item, ItemActions, ItemContent, ItemTitle } from '@/components/ui/item';
import { Spinner } from '@/components/ui/spinner';
import { deleteSavedMessageAction, editMessageAction, renameMessageAction } from './action';
import { type editorFormSchema, renameFormSchema } from './schema';

type SavedMessage = {
  id: string;
  name: string;
  channelId: string;
  createdAt: Date;
  components: z.input<typeof editorFormSchema>['components'];
};

type MessageListProps = {
  channels: InternalApiChannel[];
  messages: SavedMessage[];
} & Pick<MessageResources, 'emojis' | 'roles' | 'roleButton'>;

const dateFormat = new Intl.DateTimeFormat('ja-JP', { dateStyle: 'short', timeStyle: 'short' });

export function MessageList({ channels, emojis, roles, roleButton, messages }: MessageListProps) {
  const { guildId } = useParams<{ guildId: string }>();
  const bindEditAction = editMessageAction.bind(null, guildId);
  const bindDeleteAction = deleteSavedMessageAction.bind(null, guildId);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<SavedMessage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDiscordMessage, setDeleteDiscordMessage] = useState(false);

  async function onEdit(id: string, components: SavedMessage['components']) {
    const res = await bindEditAction({ id, components });
    if (res.serverError || res.validationErrors) {
      toast.error(res.serverError ?? 'メッセージの編集中に問題が発生しました。');
      return false;
    }
    toast.success('メッセージを編集しました。');
    return true;
  }

  async function onDelete() {
    if (!deleting) return;
    setIsDeleting(true);
    const res = await bindDeleteAction({ id: deleting.id, deleteDiscordMessage });
    setIsDeleting(false);
    if (res.serverError || res.validationErrors) {
      return toast.error(res.serverError ?? 'メッセージの削除中に問題が発生しました。');
    }
    toast.success('保存したメッセージを削除しました。');
    setDeleteOpen(false);
  }

  if (!messages.length) {
    return (
      <Empty className='border border-dashed'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <ListIcon />
          </EmptyMedia>
          <EmptyTitle>保存したメッセージがありません</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      <div className='flex flex-col gap-2'>
        {messages.map((message) => {
          const channel = channels.find((ch) => ch.id === message.channelId);
          return (
            <Item variant='outline' key={message.id}>
              <ItemContent>
                <MessageName id={message.id} name={message.name} />
                <div className='flex flex-col items-start gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center'>
                  <span
                    className={cn('flex min-w-0 items-center gap-1', { 'text-warning': !channel })}
                  >
                    {channel ? (
                      <ChannelTypeIcon type={channel.type} className='mt-0 size-3' />
                    ) : (
                      <TriangleAlertIcon className='size-3' />
                    )}
                    <span className='truncate'>{channel?.name ?? '不明なチャンネル'}</span>
                  </span>
                  <span aria-hidden='true' className='max-sm:hidden'>
                    ·
                  </span>
                  <span className='flex items-center gap-1'>
                    <ClockIcon className='size-3' />
                    {dateFormat.format(message.createdAt)}
                  </span>
                </div>
              </ItemContent>
              <ItemActions>
                <ComponentsV2EditorDialog
                  defaultValues={message.components}
                  onSubmit={(components) => onEdit(message.id, components)}
                  resources={{ emojis, roles, channels, roleButton }}
                  title={`「${message.name}」を編集`}
                  submitLabel={
                    <>
                      <PencilIcon />
                      編集
                    </>
                  }
                >
                  <Button variant='outline' size='icon' aria-label={`${message.name}を編集`}>
                    <PencilIcon />
                  </Button>
                </ComponentsV2EditorDialog>
                <Button
                  variant='outline'
                  size='icon'
                  aria-label={`${message.name}を削除`}
                  onClick={() => {
                    setDeleting(message);
                    setDeleteDiscordMessage(false);
                    setDeleteOpen(true);
                  }}
                >
                  <Trash2Icon className='text-destructive' />
                </Button>
              </ItemActions>
            </Item>
          );
        })}
      </div>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>保存済みのメッセージを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              メッセージ<span className='font-bold'>「{deleting?.name}」</span>
              を削除しますか？この操作は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Field orientation='horizontal'>
            <Checkbox
              id='delete-discord-message'
              checked={deleteDiscordMessage}
              onCheckedChange={setDeleteDiscordMessage}
              disabled={isDeleting}
            />
            <FieldLabel htmlFor='delete-discord-message'>Discordのメッセージも削除する</FieldLabel>
          </Field>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction variant='destructive' onClick={onDelete} disabled={isDeleting}>
              {isDeleting ? <Spinner className='mt-0.5' /> : <Trash2Icon className='mt-0.5' />}
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function MessageName({ id, name }: { id: string; name: string }) {
  const { guildId } = useParams<{ guildId: string }>();
  const bindRenameAction = renameMessageAction.bind(null, guildId);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [isPending, setIsPending] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);

  // 入力欄の外側をクリックしたら、変更を取り消して編集を終える
  useEffect(() => {
    if (!editing || isPending) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!groupRef.current?.contains(e.target as Node)) setEditing(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [editing, isPending]);

  function startEditing() {
    setValue(name);
    setEditing(true);
  }

  async function commit() {
    const parsed = renameFormSchema.shape.name.safeParse(value);
    if (!parsed.success) return toast.error('保存名を1〜50文字で入力してください。');
    if (parsed.data === name) return setEditing(false);

    setIsPending(true);
    const res = await bindRenameAction({ id, name: parsed.data });
    setIsPending(false);
    if (res.serverError || res.validationErrors) {
      return toast.error(res.serverError ?? '保存名の変更中に問題が発生しました。');
    }
    toast.success('保存名を変更しました。');
    setEditing(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    // EnterでSubmit, Escapeでキャンセルする。
    // IME変換中は無効化
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') setEditing(false);
  }

  if (editing) {
    return (
      <InputGroup ref={groupRef} className='h-8 max-w-xs'>
        <InputGroupInput
          autoFocus
          value={value}
          maxLength={50}
          disabled={isPending}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <InputGroupAddon align='inline-end' className='gap-0'>
          <InputGroupButton
            size='icon-xs'
            aria-label='変更を確定'
            onClick={commit}
            disabled={isPending}
          >
            {isPending ? <Spinner /> : <CheckIcon className='text-success' />}
          </InputGroupButton>
          <InputGroupButton
            size='icon-xs'
            aria-label='変更を取り消し'
            onClick={() => setEditing(false)}
            disabled={isPending}
          >
            <XIcon className='text-destructive' />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    );
  }

  return (
    <ItemTitle className='gap-0.5'>
      {name}
      <Button variant='ghost' size='icon-xs' aria-label='保存名を変更' onClick={startEditing}>
        <PencilIcon className='mt-0.5 text-muted-foreground' />
      </Button>
    </ItemTitle>
  );
}
