import { zodResolver } from '@hookform/resolvers/zod';
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
  SaveIcon,
  TypeIcon,
} from 'lucide-react';
import { type ComponentProps, useEffect, useMemo, useState } from 'react';
import { FormProvider, useFieldArray, useForm, Watch } from 'react-hook-form';
import z from 'zod';
import { FormDevTool } from '@/components/form';
import { ControlledFieldError, ControlledFieldProvider } from '@/components/rhf/field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  createMessageUserComponentsSchema,
  type MessageUserComponentsSchema,
} from '@/lib/discord/zod';
import { cn } from '@/lib/utils';
import type { MessageResources } from '../resources';
import { DiscordMessage } from '../preview/message';
import { ComponentsV2Editor } from '.';
import { EditorResourcesContext } from './context';
import { defaultComponentValues } from './schema';

type ComponentsV2EditorModalProps = {
  defaultValues: z.input<MessageUserComponentsSchema>;
  onSubmit: (values: z.infer<MessageUserComponentsSchema>) => void | Promise<void>;
  resources?: MessageResources;
  children: ComponentProps<typeof DialogTrigger>['render'];
};

export function ComponentsV2EditorDialog({
  defaultValues,
  onSubmit,
  resources = {},
  children,
}: ComponentsV2EditorModalProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const { componentActions, placeholders } = resources;

  const schema = useMemo(
    () =>
      z.object({
        components: createMessageUserComponentsSchema(placeholders, componentActions),
      }),
    [placeholders, componentActions],
  );

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { components: defaultValues },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'components',
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: openのみに依存している
  useEffect(() => {
    if (open) form.reset({ components: defaultValues });
  }, [open]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values.components);
    setOpen(false);
  });

  return (
    <EditorResourcesContext.Provider value={resources}>
      <FormProvider {...form}>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={children} />
          <DialogContent className='flex flex-col max-h-[97vh] h-full sm:max-w-[98vw]'>
            <FormDevTool />
            <DialogHeader className='flex flex-col md:flex-row md:items-center'>
              <DialogTitle>メッセージを編集</DialogTitle>
              <ControlledFieldProvider control={form.control} name='components'>
                <ControlledFieldError />
              </ControlledFieldProvider>
            </DialogHeader>
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
                    className={cn(
                      'flex-1 min-w-0 rounded-xl',
                      activeTab === 'editor' && 'max-md:hidden',
                    )}
                  />
                )}
              />
            </div>
            <DialogFooter className='flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      className='max-sm:w-full'
                      variant='outline'
                      disabled={fields.length >= 10}
                    >
                      <PlusIcon />
                      要素を追加
                    </Button>
                  }
                />
                <DropdownMenuContent side='top' align='start'>
                  <DropdownMenuItem
                    onClick={() => append(defaultComponentValues[ComponentType.TextDisplay])}
                  >
                    <TypeIcon />
                    テキスト
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => append(defaultComponentValues[ComponentType.Section])}
                  >
                    <LayoutListIcon />
                    セクション
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => append(defaultComponentValues[ComponentType.MediaGallery])}
                  >
                    <ImagesIcon />
                    ギャラリー
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => append(defaultComponentValues[ComponentType.Separator])}
                  >
                    <MinusIcon />
                    区切り線
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => append(defaultComponentValues[ComponentType.ActionRow])}
                  >
                    <RectangleEllipsisIcon />
                    アクション行
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => append(defaultComponentValues[ComponentType.Container])}
                  >
                    <BoxIcon />
                    コンテナ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className='flex gap-2'>
                <Button className='max-sm:flex-1' variant='outline' onClick={() => setOpen(false)}>
                  キャンセル
                </Button>
                <Button className='max-sm:flex-1' onClick={handleSubmit}>
                  <SaveIcon />
                  保存
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </FormProvider>
    </EditorResourcesContext.Provider>
  );
}
