'use client';

import type { APIGuildChannel, APIRole, GuildChannelType } from 'discord-api-types/v10';
import {
  BanIcon,
  ClockIcon,
  LogOutIcon,
  type LucideIcon,
  SquarePen,
  Trash2Icon,
  Volume2Icon,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SettingForm as BanForm } from './ban/form';
import { SettingForm as KickForm } from './kick/form';
import { SettingForm as MessageDeleteForm } from './message-delete/form';
import { SettingForm as MessageEditForm } from './message-edit/form';
import { SettingForm as TimeoutForm } from './timeout/form';
import { SettingForm as VoiceForm } from './voice/form';

type Key = 'timeout' | 'kick' | 'ban' | 'voice' | 'message-delete' | 'message-edit';
type LogFormValues = { enabled: boolean; channel: string | null; ignoreRoles: string[] };
type LogFormInput = { enabled?: boolean; channel?: string | null; ignoreRoles?: string[] };

const items: { key: Key; title: string; icon: LucideIcon }[] = [
  {
    key: 'timeout',
    title: 'タイムアウト',
    icon: ClockIcon,
  },
  { key: 'kick', title: 'キック', icon: LogOutIcon },
  {
    key: 'ban',
    title: 'BAN',
    icon: BanIcon,
  },
  {
    key: 'voice',
    title: 'ボイスチャット',
    icon: Volume2Icon,
  },
  {
    key: 'message-delete',
    title: 'メッセージ削除',
    icon: Trash2Icon,
  },
  {
    key: 'message-edit',
    title: 'メッセージ編集',
    icon: SquarePen,
  },
];

type LogAccordionProps = {
  channels: APIGuildChannel<GuildChannelType>[];
  roles: APIRole[];
  defaultValues: Partial<Record<Key, LogFormValues>>;
};

export function LogAccordion({ channels, roles, defaultValues }: LogAccordionProps) {
  const [value, setValue] = useState<Key[]>([]);
  const [pendingValue, setPendingValue] = useState<Key[] | null>(null);
  const formsRef = useRef<
    Partial<Record<Key, UseFormReturn<LogFormInput, unknown, LogFormValues>>>
  >({});
  const dirtyRef = useRef<Partial<Record<Key, boolean>>>({});

  const openKey = value[0];

  function handleValueChange(next: Key[]) {
    if (openKey && dirtyRef.current[openKey]) {
      setPendingValue(next);
      return;
    }
    setValue(next);
  }

  function handleDiscard() {
    if (openKey) formsRef.current[openKey]?.reset();
    setValue(pendingValue ?? []);
    setPendingValue(null);
  }

  return (
    <>
      <Accordion
        value={value}
        onValueChange={handleValueChange}
        className='flex flex-col gap-3 pb-24'
      >
        {items.map((item) => (
          <AccordionItem
            key={item.key}
            value={item.key}
            className='rounded-2xl border border-border bg-card/50 '
          >
            <AccordionTrigger className='p-6'>
              <div className='flex gap-2 items-center font-heading text-base font-medium'>
                <item.icon className='size-4.5 mt-0.5 text-muted-foreground' />
                {item.title}
              </div>
            </AccordionTrigger>
            <AccordionContent className='px-6 pt-4 pb-4!'>
              {item.key === 'timeout' && (
                <TimeoutForm
                  channels={channels}
                  roles={roles}
                  defaultValues={defaultValues.timeout}
                  onFormReady={(methods) => {
                    formsRef.current.timeout = methods;
                  }}
                  onDirtyChange={(dirty) => {
                    dirtyRef.current.timeout = dirty;
                  }}
                />
              )}
              {item.key === 'kick' && (
                <KickForm
                  channels={channels}
                  roles={roles}
                  defaultValues={defaultValues.kick}
                  onFormReady={(methods) => {
                    formsRef.current.kick = methods;
                  }}
                  onDirtyChange={(dirty) => {
                    dirtyRef.current.kick = dirty;
                  }}
                />
              )}
              {item.key === 'ban' && (
                <BanForm
                  channels={channels}
                  roles={roles}
                  defaultValues={defaultValues.ban}
                  onFormReady={(methods) => {
                    formsRef.current.ban = methods;
                  }}
                  onDirtyChange={(dirty) => {
                    dirtyRef.current.ban = dirty;
                  }}
                />
              )}
              {item.key === 'voice' && (
                <VoiceForm
                  channels={channels}
                  roles={roles}
                  defaultValues={defaultValues.voice}
                  onFormReady={(methods) => {
                    formsRef.current.voice = methods;
                  }}
                  onDirtyChange={(dirty) => {
                    dirtyRef.current.voice = dirty;
                  }}
                />
              )}
              {item.key === 'message-delete' && (
                <MessageDeleteForm
                  channels={channels}
                  roles={roles}
                  defaultValues={defaultValues['message-delete']}
                  onFormReady={(methods) => {
                    formsRef.current['message-delete'] = methods;
                  }}
                  onDirtyChange={(dirty) => {
                    dirtyRef.current['message-delete'] = dirty;
                  }}
                />
              )}
              {item.key === 'message-edit' && (
                <MessageEditForm
                  channels={channels}
                  roles={roles}
                  defaultValues={defaultValues['message-edit']}
                  onFormReady={(methods) => {
                    formsRef.current['message-edit'] = methods;
                  }}
                  onDirtyChange={(dirty) => {
                    dirtyRef.current['message-edit'] = dirty;
                  }}
                />
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Dialog
        open={pendingValue !== null}
        onOpenChange={(open) => {
          if (!open) setPendingValue(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>未保存の変更があります</DialogTitle>
            <DialogDescription>
              ログの設定中に保存していない変更があります。保存せずに編集を終了してよろしいですか？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setPendingValue(null)}>
              キャンセル
            </Button>
            <Button variant='destructive' onClick={handleDiscard}>
              破棄して移動
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
