import { ComponentType } from 'discord-api-types/v10';
import {
  BoxIcon,
  EyeIcon,
  ImagesIcon,
  LayoutListIcon,
  MinusIcon,
  PencilIcon,
  PlusIcon,
  RectangleEllipsisIcon,
  TypeIcon,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { useFieldArray, useFormContext, Watch } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { MessageUserComponentsSchema } from '@/lib/discord/zod';
import { cn } from '@/lib/utils';
import { DiscordMessage } from '../preview/message';
import type { MessageResources } from '../resources';
import { ComponentsV2Editor } from '.';
import { EditorResourcesContext } from './context';
import { defaultComponentValues } from './schema';

type ComponentsV2EditorPanelProps = {
  resources?: MessageResources;
  /** 「要素を追加」メニューを受け取り、フッターを描画する */
  footer: (addMenu: ReactNode) => ReactNode;
};

/**
 * エディタ・プレビュー・要素追加メニューのセット。モバイルではエディタ/プレビューをタブで切り替える。
 * `components` フィールドを持つ FormProvider の内側で、高さが決まった flex-col の親の中に置く。
 */
export function ComponentsV2EditorPanel({ resources = {}, footer }: ComponentsV2EditorPanelProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const form = useFormContext<{ components: z.input<MessageUserComponentsSchema> }>();
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'components',
  });
  const add = (
    type:
      | ComponentType.TextDisplay
      | ComponentType.Section
      | ComponentType.MediaGallery
      | ComponentType.Separator
      | ComponentType.ActionRow
      | ComponentType.Container,
  ) => append(defaultComponentValues[type]);

  const addMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button className='max-sm:w-full' variant='outline' disabled={fields.length >= 10}>
            <PlusIcon />
            要素を追加
          </Button>
        }
      />
      <DropdownMenuContent side='top' align='start'>
        <DropdownMenuItem onClick={() => add(ComponentType.TextDisplay)}>
          <TypeIcon />
          テキスト
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => add(ComponentType.Section)}>
          <LayoutListIcon />
          セクション
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => add(ComponentType.MediaGallery)}>
          <ImagesIcon />
          ギャラリー
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => add(ComponentType.Separator)}>
          <MinusIcon />
          区切り線
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => add(ComponentType.ActionRow)}>
          <RectangleEllipsisIcon />
          アクション行
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => add(ComponentType.Container)}>
          <BoxIcon />
          コンテナ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <EditorResourcesContext.Provider value={resources}>
      <Tabs
        className='md:hidden'
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'editor' | 'preview')}
      >
        <TabsList className='w-full'>
          <TabsTrigger value='editor'>
            <PencilIcon />
            エディター
          </TabsTrigger>
          <TabsTrigger value='preview'>
            <EyeIcon />
            プレビュー
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className='flex-1 flex gap-3 min-h-0'>
        <ComponentsV2Editor
          className={cn(
            'flex-1 overflow-y-auto p-0.5 scroll-fade-y no-scrollbar',
            activeTab === 'preview' && 'max-md:hidden',
          )}
          name='components'
          fields={fields}
          remove={remove}
          move={move}
        />
        <Watch
          control={form.control}
          name='components'
          render={(components) => (
            <DiscordMessage
              components={components}
              resources={resources}
              className={cn('flex-1 min-w-0 rounded-xl', activeTab === 'editor' && 'max-md:hidden')}
            />
          )}
        />
      </div>
      {footer(addMenu)}
    </EditorResourcesContext.Provider>
  );
}
