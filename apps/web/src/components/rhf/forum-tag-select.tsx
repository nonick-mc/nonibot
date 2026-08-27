'use client';

import type { ComponentProps } from 'react';
import { ForumTagSelect } from '../discord/forum-tag-select';
import { useControlledField } from './field';

export function ControlledForumTagSelect(props: ComponentProps<typeof ForumTagSelect>) {
  const { field, fieldState, isSubmitting } = useControlledField();
  return (
    <ForumTagSelect
      name={field.name}
      value={field.value}
      onChange={field.onChange}
      disabled={field.disabled || isSubmitting}
      invalid={fieldState.invalid}
      {...props}
    />
  );
}
