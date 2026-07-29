'use client';

import { TypeIcon } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { ControlledField, ControlledFieldError } from '@/components/rhf/field';
import { ControlledTextarea } from '@/components/rhf/textarea';
import { useComponentEditorContext } from '../context';
import { EditorCard } from '../editor-card';

export function TextDisplayEditor() {
  const { control } = useFormContext();
  const { basePath } = useComponentEditorContext();

  return (
    <EditorCard icon={TypeIcon} title='テキスト'>
      <ControlledField control={control} name={`${basePath}.content`}>
        <ControlledTextarea className='max-h-96' placeholder='テキストを入力' />
        <ControlledFieldError />
      </ControlledField>
    </EditorCard>
  );
}
