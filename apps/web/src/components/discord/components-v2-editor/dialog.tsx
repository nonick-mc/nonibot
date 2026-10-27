import { zodResolver } from '@hookform/resolvers/zod';
import { SaveIcon } from 'lucide-react';
import { type ComponentProps, type ReactNode, useEffect, useMemo, useState } from 'react';
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
  /** `false` を返すとダイアログを閉じない */
  onSubmit: (values: z.infer<MessageUserComponentsSchema>) => boolean | Promise<boolean>;
  resources?: MessageResources;
  title?: string;
  submitLabel?: ReactNode;
  children: ComponentProps<typeof DialogTrigger>['render'];
};

export function ComponentsV2EditorDialog({
  defaultValues,
  onSubmit,
  resources = {},
  title = 'メッセージを編集',
  submitLabel,
  children,
}: ComponentsV2EditorModalProps) {
  const [open, setOpen] = useState(false);
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

  const { isDirty, isSubmitting } = form.formState;

  // biome-ignore lint/correctness/useExhaustiveDependencies: openのみに依存している
  useEffect(() => {
    if (open) form.reset({ components: defaultValues });
  }, [open]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if ((await onSubmit(values.components)) !== false) setOpen(false);
  });

  return (
    <FormProvider {...form}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={children} />
        <DialogContent className='flex flex-col max-h-[97vh] h-full sm:max-w-[98vw]'>
          <FormDevTool />
          <DialogHeader className='flex flex-col md:flex-row md:items-center'>
            <DialogTitle>{title}</DialogTitle>
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
                  <Button
                    className='max-sm:flex-1'
                    onClick={handleSubmit}
                    disabled={!isDirty || isSubmitting}
                  >
                    {submitLabel ?? (
                      <>
                        <SaveIcon />
                        保存
                      </>
                    )}
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
