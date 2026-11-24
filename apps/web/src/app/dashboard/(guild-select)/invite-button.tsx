import { Plus } from '@gravity-ui/icons';
import { GravityIcon } from '@/components/gravity-icon';
import { Button } from '@/components/ui/button';
import { getInviteUrl } from '@/lib/discord/invite';

export function InviteButton() {
  return (
    <Button
      size='lg'
      render={
        <a href={getInviteUrl()}>
          <GravityIcon icon={Plus} />
          サーバーを追加
        </a>
      }
      nativeButton={false}
    />
  );
}
