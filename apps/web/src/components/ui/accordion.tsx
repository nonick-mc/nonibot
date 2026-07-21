'use client';

import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion';
import { ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const Accordion = AccordionPrimitive.Root;

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item data-slot='accordion-item' className={cn(className)} {...props} />
  );
}

function AccordionTrigger({ className, children, ...props }: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header data-slot='accordion-header' render={<div />}>
      <AccordionPrimitive.Trigger
        data-slot='accordion-trigger'
        className={cn(
          'group/accordion-trigger flex w-full items-center justify-between gap-2 py-2 text-sm font-medium transition-colors',
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className='size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[open]/accordion-trigger:rotate-180' />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({ className, children, ...props }: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot='accordion-content'
      className={cn(
        // base-ui sets --accordion-panel-height to the actual content height.
        // data-starting-style / data-ending-style are set during open/close transitions.
        'h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-200 ease-out',
        'data-[starting-style]:h-0 data-[ending-style]:h-0',
        className,
      )}
      {...props}
    >
      <div className='pb-2'>{children}</div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionPrimitive, AccordionTrigger };
