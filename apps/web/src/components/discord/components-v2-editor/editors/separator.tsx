'use client';

import { SeparatorSpacingSize } from 'discord-api-types/v10';
import { MinusIcon, SettingsIcon } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import {
  ControlledField,
  ControlledFieldError,
  ControlledFieldLabel,
} from '@/components/rhf/field';
import { ControlledSelect, ControlledSelectTrigger } from '@/components/rhf/select';
import { ControlledSwitch } from '@/components/rhf/switch';
import { Button } from '@/components/ui/button';
import { FieldContent, FieldGroup } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SelectContent, SelectGroup, SelectItem, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useComponentEditorContext } from '../context';
import { EditorCard } from '../editor-card';

export function SeparatorEditor() {
  const { control } = useFormContext();
  const { basePath } = useComponentEditorContext();

  // Popoverに区切り線の設定を移動する

  return (
    <EditorCard
      headerActions={
        <Popover>
          <PopoverTrigger render={<Button variant='ghost' size='icon-sm' />}>
            <SettingsIcon />
          </PopoverTrigger>
          <PopoverContent>
            <FieldGroup className='gap-5'>
              <ControlledField
                control={control}
                name={`${basePath}.spacing`}
                orientation='horizontal'
                align='center'
              >
                <FieldContent>
                  <ControlledFieldLabel>間隔の大きさ</ControlledFieldLabel>
                  <ControlledFieldError />
                </FieldContent>
                <ControlledSelect<SeparatorSpacingSize>>
                  <ControlledSelectTrigger>
                    <SelectValue>
                      {(value: SeparatorSpacingSize) => {
                        switch (value) {
                          case SeparatorSpacingSize.Small:
                            return '小';
                          case SeparatorSpacingSize.Large:
                            return '大';
                        }
                      }}
                    </SelectValue>
                  </ControlledSelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectGroup>
                      <SelectItem value={SeparatorSpacingSize.Small}>小</SelectItem>
                      <SelectItem value={SeparatorSpacingSize.Large}>大</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </ControlledSelect>
              </ControlledField>
              <Separator />
              <ControlledField
                control={control}
                name={`${basePath}.divider`}
                orientation='horizontal'
              >
                <FieldContent>
                  <ControlledFieldLabel>区切り線を表示する</ControlledFieldLabel>
                  <ControlledFieldError />
                </FieldContent>
                <ControlledSwitch />
              </ControlledField>
            </FieldGroup>
          </PopoverContent>
        </Popover>
      }
      icon={MinusIcon}
      title='区切り線'
    />
  );

  return <EditorCard icon={MinusIcon} title='区切り線'></EditorCard>;
}
