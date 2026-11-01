import { zodResolver } from '@hookform/resolvers/zod';
import { SaveIcon } from 'lucide-react';
import { type ComponentProps, useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
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
  createMessageUserComponentsSchema,
  type MessageUserComponentsSchema,
} from '@/lib/discord/zod';
import type { MessageResources } from '../resources';
import { ComponentsV2EditorPanel } from './panel';

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
  const { allowedComponents, placeholders } = resources;

  const schema = useMemo(
    () =>
      z.object({
        components: createMessageUserComponentsSchema(placeholders, allowedComponents),
      }),
    [placeholders, allowedComponents],
  );

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { components: defaultValues },
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
          <DialogHeader className='flex flex-col md:flex-row md:items-center'>
            <DialogTitle>メッセージを編集</DialogTitle>
            <ControlledFieldProvider control={form.control} name='components'>
              <ControlledFieldError />
            </ControlledFieldProvider>
          </DialogHeader>
          <ComponentsV2EditorPanel
            resources={resources}
            footer={(addMenu) => (
              <DialogFooter className='flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                {addMenu}
                <div className='flex gap-2'>
                  <Button
                    className='max-sm:flex-1'
                    variant='outline'
                    onClick={() => setOpen(false)}
                  >
                    キャンセル
                  </Button>
                  <Button className='max-sm:flex-1' onClick={handleSubmit}>
                    <SaveIcon />
                    保存
                  </Button>
                </div>
              </DialogFooter>
            )}
          />
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
}
