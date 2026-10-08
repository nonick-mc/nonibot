'use client';

import { EyeIcon, EyeOffIcon, ImageIcon, LinkIcon } from 'lucide-react';
import { useRef } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { PlaceholderPickerButton } from '@/components/placeholder/placeholder-picker-button';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
} from '@/components/rhf/field';
import { InputGroup, InputGroupAddon, InputGroupButton } from '@/components/ui/input-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ComponentEditorContext } from '../context';
import { DebouncedUrlInput } from '../debounced-url-input';
import { EditorCard } from '../editor-card';

type ThumbnailEditorProps = {
  basePath: string;
  onRemove: () => void;
  withSortableItemHandle?: boolean;
};

export function ThumbnailEditor({
  basePath,
  onRemove,
  withSortableItemHandle,
}: ThumbnailEditorProps) {
  const { control } = useFormContext();
  const urlRef = useRef<HTMLInputElement>(null);

  return (
    <ComponentEditorContext.Provider value={{ basePath, onRemove }}>
      <EditorCard
        icon={ImageIcon}
        title='サムネイル'
        withSortableItemHandle={withSortableItemHandle}
      >
        <ControlledField
          control={control}
          name={`${basePath}.media.url`}
          orientation='vertical'
          align='center'
        >
          <ControlledFieldLabel className='sr-only'>画像</ControlledFieldLabel>
          <InputGroup>
            <DebouncedUrlInput inputRef={urlRef} placeholder='URLを入力' />
            <InputGroupAddon align='inline-start'>
              <LinkIcon />
            </InputGroupAddon>
            <InputGroupAddon className='gap-0.5' align='inline-end'>
              <PlaceholderPickerButton inputRef={urlRef} types={['url']} mode='replace' />
              <Tooltip>
                <Controller
                  control={control}
                  name={`${basePath}.spoiler`}
                  render={({ field }) => (
                    <TooltipTrigger
                      render={
                        <InputGroupButton
                          onClick={() => field.onChange(!field.value)}
                          size='icon-xs'
                        />
                      }
                    >
                      {field.value ? <EyeOffIcon /> : <EyeIcon />}
                    </TooltipTrigger>
                  )}
                />
                <TooltipContent>ネタバレ添付ファイル</TooltipContent>
              </Tooltip>
            </InputGroupAddon>
          </InputGroup>
          <ControlledFieldError />
        </ControlledField>
      </EditorCard>
    </ComponentEditorContext.Provider>
  );
}
