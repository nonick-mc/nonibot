'use client';

import { ComponentType } from 'discord-api-types/v10';
import {
  ComponentIcon,
  ImageIcon,
  LayoutListIcon,
  LinkIcon,
  MousePointerClickIcon,
  PlusIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { get, useFieldArray, useFormContext, useFormState, useWatch } from 'react-hook-form';
import { Sortable, SortableItem } from '@/components/reui/sortable';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
} from '@/components/rhf/field';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useComponentEditorContext } from '../context';
import { EditorCard } from '../editor-card';
import { defaultComponentValues } from '../schema';
import {
  ButtonEditor,
  createDefaultButton,
  createDefaultUrlButton,
  useButtonActions,
} from './button';
import { ComponentEditorByType } from './index';
import { ThumbnailEditor } from './thumbnail';

function SectionMainContent() {
  const { control } = useFormContext();
  const { basePath } = useComponentEditorContext();

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: `${basePath}.components`,
  });

  return (
    <ControlledField control={control} name={`${basePath}.components`}>
      <ControlledFieldLabel className='sr-only'>メインコンテンツ</ControlledFieldLabel>
      <ControlledFieldError />
      <div className='flex flex-col gap-3'>
        {fields.length ? (
          <Sortable
            className='flex flex-col gap-3'
            value={fields.map((f) => ({ id: f.id }))}
            onValueChange={() => {}}
            getItemValue={(item) => item.id}
            onMove={({ activeIndex, overIndex }) => move(activeIndex, overIndex)}
            strategy='vertical'
          >
            {fields.map((field, itemIndex) => (
              <SortableItem key={field.id} value={field.id}>
                <ComponentEditorByType
                  name={`${basePath}.components`}
                  index={itemIndex}
                  onRemove={() => remove(itemIndex)}
                />
              </SortableItem>
            ))}
          </Sortable>
        ) : (
          <Empty className='border border-dashed py-6'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <ComponentIcon />
              </EmptyMedia>
              <EmptyTitle className='text-foreground'>要素がありません</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}
        <Button
          className='sm:w-fit text-foreground'
          onClick={() => append(defaultComponentValues[ComponentType.TextDisplay])}
          variant='outline'
          size='sm'
          disabled={fields.length >= 3}
        >
          <PlusIcon />
          テキストを追加
        </Button>
      </div>
    </ControlledField>
  );
}

function SectionAccessory() {
  const { control, setValue } = useFormContext();
  const { basePath } = useComponentEditorContext();
  const buttonActions = useButtonActions();
  const accessoryPath = `${basePath}.accessory`;
  const accessoryType = useWatch({ control, name: `${accessoryPath}.type` });

  const setAccessory = (value: unknown) => setValue(accessoryPath, value, { shouldDirty: true });

  const editor = (() => {
    switch (accessoryType) {
      case ComponentType.Thumbnail:
        return <ThumbnailEditor basePath={accessoryPath} onRemove={() => setAccessory(null)} />;
      case ComponentType.Button:
        return <ButtonEditor basePath={accessoryPath} onRemove={() => setAccessory(null)} />;
      default:
        return (
          <Empty className='border border-dashed py-6'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <ComponentIcon />
              </EmptyMedia>
              <EmptyTitle className='text-foreground'>要素がありません</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      className='sm:w-fit text-foreground'
                      variant='outline'
                      size='sm'
                      disabled={accessoryType !== undefined}
                    />
                  }
                >
                  <PlusIcon />
                  要素を追加
                </DropdownMenuTrigger>
                <DropdownMenuContent side='bottom' align='center'>
                  <DropdownMenuItem
                    onClick={() => setAccessory(defaultComponentValues[ComponentType.Thumbnail])}
                  >
                    <ImageIcon />
                    サムネイル
                  </DropdownMenuItem>
                  {buttonActions.length > 0 && (
                    <DropdownMenuItem
                      onClick={() => setAccessory(createDefaultButton(buttonActions[0]))}
                    >
                      <MousePointerClickIcon />
                      ボタン
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setAccessory(createDefaultUrlButton())}>
                    <LinkIcon />
                    URLボタン
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </EmptyContent>
          </Empty>
        );
    }
  })();

  return (
    <ControlledField control={control} name={accessoryPath}>
      <ControlledFieldLabel className='sr-only'>アクセサリー</ControlledFieldLabel>
      <ControlledFieldError />
      {editor}
    </ControlledField>
  );
}

export function SectionEditor() {
  const { basePath } = useComponentEditorContext();
  const [tab, setTab] = useState<'main' | 'accessory'>('main');
  const tabPaths = { main: `${basePath}.components`, accessory: `${basePath}.accessory` };
  const { errors, submitCount } = useFormState({ name: Object.values(tabPaths) });

  // biome-ignore lint/correctness/useExhaustiveDependencies: 送信時のみエラーのあるタブに切り替えるため、submitCountの変化だけを監視する
  useEffect(() => {
    const otherTab = tab === 'main' ? 'accessory' : 'main';
    if (!get(errors, tabPaths[tab]) && get(errors, tabPaths[otherTab])) setTab(otherTab);
  }, [submitCount]);

  return (
    <EditorCard withSortableItemHandle icon={LayoutListIcon} title='セクション'>
      <div className='flex flex-col gap-4'>
        <Tabs value={tab} onValueChange={(value) => setTab(value as 'main' | 'accessory')}>
          <TabsList className='w-full'>
            <TabsTrigger value='main'>メインコンテンツ</TabsTrigger>
            <TabsTrigger value='accessory'>アクセサリー</TabsTrigger>
          </TabsList>
        </Tabs>
        {tab === 'main' ? <SectionMainContent /> : <SectionAccessory />}
      </div>
    </EditorCard>
  );
}
