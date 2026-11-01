import { permToText } from '@repo/shared/constants';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import { ExternalLinkIcon, TriangleAlertIcon } from 'lucide-react';
import { Fragment } from 'react';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/reui/alert';
import { Button } from '@/components/ui/button';
import { getGuild } from '@/lib/discord/api';
import { getGuildInviteUrl } from '@/lib/discord/invite';
import { hasPermission } from '@/lib/discord/utils';

type MissingPermissionAlertProps = {
  guildId: string;
  permissions: bigint[];
};

export async function MissingPermissionAlert({
  guildId,
  permissions,
}: MissingPermissionAlertProps) {
  const { bot_permissions } = await getGuild(guildId);
  if (hasPermission(bot_permissions, PermissionFlagsBits.Administrator)) return null;

  const missing = permissions.filter((bit) => !hasPermission(bot_permissions, bit));
  if (missing.length === 0) return null;

  const names = Object.entries(PermissionFlagsBits)
    .filter(([, bit]) => missing.includes(bit))
    .map(([name]) => name as keyof typeof PermissionFlagsBits);

  return (
    <Alert variant='warning'>
      <TriangleAlertIcon />
      <AlertTitle>Botの権限が不足しています</AlertTitle>
      <AlertDescription>
        <p>
          この機能を利用するには、nonibotに以下の権限を付与する必要があります:{' '}
          {permToText(...names).map((text, i) => (
            <Fragment key={text}>
              {i > 0 && ' '}
              <code className='rounded-md bg-muted px-1.5 py-0.5 border text-xs font-mono text-foreground'>
                {text}
              </code>
            </Fragment>
          ))}
        </p>
      </AlertDescription>
      <AlertAction>
        <Button
          variant='outline'
          render={
            <a href={getGuildInviteUrl(guildId, missing)}>
              権限を更新
              <ExternalLinkIcon />
            </a>
          }
          nativeButton={false}
        />
      </AlertAction>
    </Alert>
  );
}
