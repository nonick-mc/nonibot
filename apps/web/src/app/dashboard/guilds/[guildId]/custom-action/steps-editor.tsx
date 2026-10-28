'use client';

import { getCustomActionPlaceholders } from '@repo/placeholders';
import { type AssignableRoleRules, isAssignableRole } from '@repo/shared';
import { getDangerPermissions, permToText } from '@repo/shared/constants';
import type { InternalApiRole } from '@repo/shared/types';
import { ComponentType } from 'discord-api-types/v10';
import {
  MessageSquareReplyIcon,
  PencilIcon,
  PlusIcon,
  TriangleAlertIcon,
  UserRoundCogIcon,
} from 'lucide-react';
import { Fragment } from 'react';
import { useFieldArray, useFormContext, useWatch, Watch } from 'react-hook-form';
import type { z } from 'zod';
import { ComponentEditorContext } from '@/components/discord/components-v2-editor/context';
import { EditorCard } from '@/components/discord/components-v2-editor/editor-card';
import { DiscordMessage } from '@/components/discord/preview/message';
import type { MessageResources } from '@/components/discord/resources';
import { Alert, AlertDescription, AlertTitle } from '@/components/reui/alert';
import { Sortable, SortableItem } from '@/components/reui/sortable';
import { ControlledButton } from '@/components/rhf/button';
import { ControlledComponentsV2EditorDialog } from '@/components/rhf/components-v2-editor-dialog';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
} from '@/components/rhf/field';
import { ControlledRoleSelect } from '@/components/rhf/role-select';
import { ControlledSwitch } from '@/components/rhf/switch';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FieldContent, FieldDescription, FieldGroup, FieldSeparator } from '@/components/ui/field';
import type { stepsSchema } from './schema';

export type Steps = z.infer<typeof stepsSchema>;
type Step = Steps[number];

const stepTypes = [
  {
    type: 'role-toggle',
    label: 'ロールの付与・解除',
    icon: UserRoundCogIcon,
    needsRoleRules: true,
    create: (): Step => ({ type: 'role-toggle', config: { roleId: '' } }),
  },
  {
    type: 'reply-message',
    label: 'メッセージを返信する',
    icon: MessageSquareReplyIcon,
    needsRoleRules: false,
    create: (): Step => ({
      type: 'reply-message',
      config: {
        components: [{ type: ComponentType.TextDisplay, content: 'ボタンが押されました！' }],
        ephemeral: true,
      },
    }),
  },
] satisfies {
  type: Step['type'];
  label: string;
  icon: unknown;
  needsRoleRules: boolean;
  create: () => Step;
}[];

type StepsEditorProps = {
  roles: InternalApiRole[];
  rules: AssignableRoleRules | null;
  resources: MessageResources;
  originalSteps?: Steps;
  usageCount: number;
};

export function StepsEditor({
  roles,
  rules,
  resources,
  originalSteps,
  usageCount,
}: StepsEditorProps) {
  const { control } = useFormContext<{ steps: Steps }>();
  const { fields, append, remove, move } = useFieldArray({ control, name: 'steps' });
  const usedTypes = useWatch({ control, name: 'steps' }).map((s) => s.type);

  return (
    <ControlledField control={control} name='steps'>
      <ControlledFieldLabel className='sr-only'>アクション</ControlledFieldLabel>
      <ControlledFieldError />
      <div className='flex flex-col gap-3'>
        <Sortable
          className='flex flex-col items-center p-6 border border-dashed rounded-xl'
          value={fields.map((f) => ({ id: f.id }))}
          onValueChange={() => {}}
          getItemValue={(item) => item.id}
          onMove={({ activeIndex, overIndex }) => move(activeIndex, overIndex)}
          strategy='vertical'
        >
          {fields.map((field, index) => (
            <Fragment key={field.id}>
              {index > 0 && <StepConnector />}
              <SortableItem className='w-full max-w-xl' value={field.id}>
                <ComponentEditorContext.Provider
                  value={{ basePath: `steps.${index}`, onRemove: () => remove(index) }}
                >
                  <StepEditor
                    index={index}
                    roles={roles}
                    rules={rules}
                    resources={resources}
                    originalSteps={originalSteps}
                    usageCount={usageCount}
                  />
                </ComponentEditorContext.Provider>
              </SortableItem>
            </Fragment>
          ))}
          {fields.length > 0 && <StepConnector />}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  className='sm:w-fit text-foreground'
                  variant='outline'
                  size='sm'
                  disabled={stepTypes.every((t) => usedTypes.includes(t.type))}
                />
              }
            >
              <PlusIcon />
              アクションを追加
            </DropdownMenuTrigger>
            <DropdownMenuContent side='bottom' align='start'>
              {stepTypes.map(({ type, label, icon: Icon, needsRoleRules, create }) => (
                <DropdownMenuItem
                  key={type}
                  onClick={() => append(create())}
                  // 同じ種類の処理は複数追加できない
                  disabled={usedTypes.includes(type) || (needsRoleRules && !rules)}
                >
                  <Icon />
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </Sortable>
      </div>
    </ControlledField>
  );
}

function StepConnector() {
  return <div aria-hidden className='h-6 w-px bg-border' />;
}

function StepEditor({ index, ...props }: { index: number } & StepsEditorProps) {
  const { control } = useFormContext<{ steps: Steps }>();
  const type = useWatch({ control, name: `steps.${index}.type` });
  switch (type) {
    case 'role-toggle':
      return <RoleToggleStep index={index} {...props} />;
    case 'reply-message':
      return <ReplyMessageStep index={index} resources={props.resources} />;
  }
}

function RoleToggleStep({ index, roles, rules }: { index: number } & StepsEditorProps) {
  const { control } = useFormContext<{ steps: Steps }>();
  const roleId = useWatch({ control, name: `steps.${index}.config.roleId` });
  const dangerPermissions = getDangerPermissions(
    roles.find((role) => role.id === roleId)?.permissions ?? '0',
  );

  return (
    <EditorCard icon={UserRoundCogIcon} title='ロールの付与・解除を切替' withSortableItemHandle>
      <FieldGroup className='gap-4'>
        <ControlledField control={control} name={`steps.${index}.config.roleId`}>
          <FieldContent>
            <ControlledFieldLabel>付与・解除を切り替えるロール</ControlledFieldLabel>
            <FieldDescription>
              nonibotとあなたのロールより低い位置にあるロールを選択できます。
            </FieldDescription>
            <ControlledFieldError />
          </FieldContent>
          <ControlledRoleSelect
            items={roles}
            disabled={!rules}
            disabledItemFilter={(role) => !rules || !isAssignableRole(role, rules)}
          />
        </ControlledField>
        {dangerPermissions.length > 0 && (
          <Alert variant='warning'>
            <TriangleAlertIcon />
            <AlertTitle>このロールには強力な権限が含まれています</AlertTitle>
            <AlertDescription>
              ボタンを押したメンバーは、次の権限を得られます:{' '}
              {permToText(...dangerPermissions).join(' ')}
            </AlertDescription>
          </Alert>
        )}
      </FieldGroup>
    </EditorCard>
  );
}

function ReplyMessageStep({
  index,
  resources,
}: { index: number } & Pick<StepsEditorProps, 'resources'>) {
  const { control } = useFormContext<{ steps: Steps }>();
  // この処理より前の処理の結果だけを、プレースホルダーとして使える
  const steps = useWatch({ control, name: 'steps' });
  const stepResources: MessageResources = {
    ...resources,
    placeholders: getCustomActionPlaceholders(steps.slice(0, index).map((s) => s.type)),
  };

  return (
    <EditorCard icon={MessageSquareReplyIcon} title='メッセージを返信する' withSortableItemHandle>
      <FieldGroup className='gap-4'>
        <ControlledField
          control={control}
          name={`steps.${index}.config.ephemeral`}
          orientation='horizontal'
        >
          <FieldContent>
            <ControlledFieldLabel>ボタンを押した本人にだけ表示する</ControlledFieldLabel>
            <ControlledFieldError />
          </FieldContent>
          <ControlledSwitch />
        </ControlledField>
        <FieldSeparator />
        <ControlledField control={control} name={`steps.${index}.config.components`}>
          <ControlledFieldLabel>メッセージ</ControlledFieldLabel>
          <Watch
            control={control}
            name={`steps.${index}.config.components`}
            render={(components) => (
              <DiscordMessage
                components={components ?? []}
                resources={stepResources}
                className='max-h-100'
              />
            )}
          />
          <ControlledComponentsV2EditorDialog resources={stepResources}>
            <ControlledButton variant='outline' className='w-full'>
              <PencilIcon />
              メッセージを編集
            </ControlledButton>
          </ControlledComponentsV2EditorDialog>
          <ControlledFieldError />
        </ControlledField>
      </FieldGroup>
    </EditorCard>
  );
}
