'use client';

import {
  PlaceholderPickerButton,
  type PlaceholderPickerButtonProps,
} from '@/components/placeholder/placeholder-picker-button';
import { useEditorResources } from './context';

export function EditorPlaceholderPicker(props: Omit<PlaceholderPickerButtonProps, 'placeholders'>) {
  const { placeholders } = useEditorResources();
  return <PlaceholderPickerButton placeholders={placeholders} {...props} />;
}
