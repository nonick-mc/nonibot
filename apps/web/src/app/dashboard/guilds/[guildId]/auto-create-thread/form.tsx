'use client';

import { autoThreadPlaceholders } from '@repo/placeholders';
import type { APIRole } from 'discord-api-types/v10';
import { useRef } from 'react';
import type { Control } from 'react-hook-form';
import { PlaceholderPickerButton } from '@/components/discord/components-v2-editor/placeholder-picker-button';
import { DiscordMessageContext } from '@/components/discord/message-context';
import { Badge } from '@/components/reui/badge';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
} from '@/components/rhf/field';
import { ControlledInputGroupInput } from '@/components/rhf/input-group';
import { ControlledRoleSelect } from '@/components/rhf/role-select';
import { ControlledSelect, ControlledSelectTrigger } from '@/components/rhf/select';
import { ControlledSwitch } from '@/components/rhf/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldContent, FieldDescription, FieldGroup, FieldSeparator } from '@/components/ui/field';
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group';
import { SelectContent, SelectGroup, SelectItem, SelectValue } from '@/components/ui/select';
import { ArchiveDurationOptions, ThreadStateOptions } from './constants';

type RuleFormFieldsProps = {
  // biome-ignore lint/suspicious/noExplicitAny: 作成/更新フォームで型の異なるControlを共有して受け取るための型
  control: Control<any>;
  roles: APIRole[];
  disabled?: boolean;
};

export function RuleFormFields({ control, roles, disabled }: RuleFormFieldsProps) {
  const threadNameRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <DiscordMessageContext.Provider value={{ placeholders: autoThreadPlaceholders }}>
        <Card>
          <CardHeader>
            <CardTitle>スレッド設定</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <ControlledField control={control} name='threadName' disabled={disabled}>
                <ControlledFieldLabel>作成するスレッドの名前</ControlledFieldLabel>
                <InputGroup>
                  <ControlledInputGroupInput
                    ref={threadNameRef}
                    placeholder='スレッドの名前を入力'
                  />
                  <InputGroupAddon align='inline-end'>
                    <PlaceholderPickerButton inputRef={threadNameRef} />
                  </InputGroupAddon>
                </InputGroup>
                <ControlledFieldError />
              </ControlledField>
              <FieldSeparator />
              <ControlledField
                control={control}
                name='autoArchiveDuration'
                orientation='horizontal'
                disabled={disabled}
              >
                <FieldContent>
                  <ControlledFieldLabel>スレッドの自動アーカイブ時間</ControlledFieldLabel>
                  <FieldDescription>
                    指定した期間アクティブでなかったスレッドはアーカイブされます。
                  </FieldDescription>
                  <ControlledFieldError />
                </FieldContent>
                <ControlledSelect>
                  <ControlledSelectTrigger>
                    <SelectValue placeholder='期間を選択'>
                      {(value: number) =>
                        ArchiveDurationOptions.find((option) => option.value === value)?.label
                      }
                    </SelectValue>
                  </ControlledSelectTrigger>
                  <SelectContent align='end' alignItemWithTrigger={false}>
                    <SelectGroup>
                      {ArchiveDurationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </ControlledSelect>
              </ControlledField>
              <FieldSeparator />
              <ControlledField control={control} name='initialThreadState' disabled={disabled}>
                <FieldContent>
                  <ControlledFieldLabel>
                    作成したスレッドの初期状態<Badge>New</Badge>
                  </ControlledFieldLabel>
                  <FieldDescription>作成するスレッドの初期状態を変更します。</FieldDescription>
                  <ControlledFieldError />
                </FieldContent>
                <ControlledSelect>
                  <ControlledSelectTrigger>
                    <SelectValue placeholder='状態を選択'>
                      {(value: string) =>
                        ThreadStateOptions.find((option) => option.value === value)?.label
                      }
                    </SelectValue>
                  </ControlledSelectTrigger>
                  <SelectContent align='end' alignItemWithTrigger={false}>
                    <SelectGroup>
                      {ThreadStateOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </ControlledSelect>
              </ControlledField>
            </FieldGroup>
          </CardContent>
        </Card>
      </DiscordMessageContext.Provider>
      <Card>
        <CardHeader>
          <CardTitle>例外設定</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <ControlledField
              control={control}
              name='ignoreBot'
              orientation='horizontal'
              disabled={disabled}
            >
              <FieldContent>
                <ControlledFieldLabel>
                  BotやWebhookが送信したメッセージを除外する
                </ControlledFieldLabel>
                <FieldDescription>
                  この設定に関わらず、nonibotから送信されたメッセージは常に除外されます。
                </FieldDescription>
                <ControlledFieldError />
              </FieldContent>
              <ControlledSwitch />
            </ControlledField>
            <FieldSeparator />
            <ControlledField control={control} name='ignoreRoles' disabled={disabled}>
              <FieldContent>
                <ControlledFieldLabel>スレッド作成を除外するロール</ControlledFieldLabel>
                <FieldDescription>最大20個まで選択できます。</FieldDescription>
                <ControlledFieldError />
              </FieldContent>
              <ControlledRoleSelect items={roles} multiple />
            </ControlledField>
          </FieldGroup>
        </CardContent>
      </Card>
    </>
  );
}
