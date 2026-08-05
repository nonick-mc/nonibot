import { sendTriggerEnum } from '@repo/database';
import z from 'zod';
import { ControlledSelect, ControlledSelectTrigger } from '@/components/rhf/select';
import { SelectContent, SelectGroup, SelectItem, SelectValue } from '@/components/ui/select';

const { enum: SendTrigger } = z.enum(sendTriggerEnum.enumValues);

const sendTriggerLabels: Record<string, string> = {
  [SendTrigger.joined]: 'サーバーに参加した時',
  [SendTrigger.passedMembershipGate]: 'サーバールールに同意した時',
};

export function SendTriggerSelect() {
  return (
    <ControlledSelect>
      <ControlledSelectTrigger className='sm:min-w-xs'>
        <SelectValue>{(value: string) => sendTriggerLabels[value]}</SelectValue>
      </ControlledSelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          <SelectItem value={SendTrigger.joined}>サーバーに参加した時</SelectItem>
          <SelectItem value={SendTrigger.passedMembershipGate}>
            サーバールールに同意した時
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </ControlledSelect>
  );
}
