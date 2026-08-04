import { zodResolver } from '@hookform/resolvers/zod';
import { APIEmoji, ComponentType, type RESTGetAPIGuildEmojisResult } from 'discord-api-types/v10';
import {
  BoxIcon,
  EyeIcon,
  ImagesIcon,
  LayoutListIcon,
  MinusIcon,
  PencilIcon,
  PlusIcon,
  SaveIcon,
  TypeIcon,
} from 'lucide-react';
import {
  type ComponentProps,
  PropsWithChildren,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { FormProvider, useFieldArray, useForm, Watch } from 'react-hook-form';
import z from 'zod';
import { FormDevTool } from '@/components/form';
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
import { DiscordMessageContext } from '../message-context';
import { DiscordMessage } from '../preview/message';
import { ComponentsV2Editor } from '.';
import { defaultComponentValues } from './schema';

type ComponentsV2EditorModalProps = {
  defaultValues: z.input<MessageUserComponentsSchema>;
  onSubmit: (values: z.infer<MessageUserComponentsSchema>) => void | Promise<void>;
  children: ComponentProps<typeof DialogTrigger>['render'];
};

export function ComponentsV2EditorDialog({
  defaultValues,
  onSubmit,
  children,
}: ComponentsV2EditorModalProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const { placeholders } = useContext(DiscordMessageContext);

  const schema = useMemo(
    () => z.object({ components: createMessageUserComponentsSchema(placeholders) }),
    [placeholders],
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
    <FormProvider {...form}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={children} />
        <DialogContent className='flex flex-col max-h-[97vh] h-full sm:max-w-[98vw]'>
          <FormDevTool />
          <DialogHeader>
            <DialogTitle>メッセージを編集</DialogTitle>
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
                activeTab === 'preview' && 'hidden md:block',
              )}
              name='components'
              fields={fields}
              remove={remove}
              move={move}
            />
            <div
              className={cn(
                'flex-1 flex flex-col max-sm:p-4 p-6 bg-discord-background border rounded-xl',
                activeTab === 'editor' && 'hidden md:flex',
              )}
            >
              <Watch
                control={form.control}
                name='components'
                render={(components) => (
                  <div className='flex-1 overflow-y-auto scroll-fade-y no-scrollbar'>
                    <DiscordMessage
                      components={components}
                      username='nonibot'
                      avatarUrl='https://cdn.nonick.net/nonibot/profile_dark.png'
                      showAppTag
                      verified
                    />
                  </div>
                )}
              />
            </div>
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
  );
}
