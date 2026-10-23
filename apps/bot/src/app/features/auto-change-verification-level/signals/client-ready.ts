import { autoChangeVerifyLevelSetting } from '@repo/database';
import {
  bold,
  type Client,
  ContainerBuilder,
  Events,
  GuildVerificationLevel,
  HeadingLevel,
  heading,
  MessageFlags,
  subtext,
  TextDisplayBuilder,
} from 'discord.js';
import { eq } from 'drizzle-orm';
import { schedule } from 'node-cron';
import { execute, Signal } from 'sunar';
import { getAppEmoji, Success } from '@/src/constants/emoji';
import { db } from '@/src/lib/db';
import { isActivePeriod } from '../period';

const levels: Record<GuildVerificationLevel, { name: string; description: string }> = {
  [GuildVerificationLevel.None]: { name: '設定無し', description: '無制限' },
  [GuildVerificationLevel.Low]: { name: '低', description: 'メール認証がされているアカウントのみ' },
  [GuildVerificationLevel.Medium]: {
    name: '中',
    description: 'Discordに登録してから5分以上経過したアカウントのみ',
  },
  [GuildVerificationLevel.High]: {
    name: '高',
    description: 'このサーバーのメンバーとなってから10分以上経過したメンバーのみ',
  },
  [GuildVerificationLevel.VeryHigh]: {
    name: '最高',
    description: '電話認証がされているアカウントのみ',
  },
};

export const signal = new Signal(Events.ClientReady, { once: true });

execute(signal, (client) => {
  schedule('0 * * * *', () => reconcile(client), { timezone: 'Asia/Tokyo' });
  // Bot起動時に一度だけ実行
  reconcile(client);
});

// 期間内なら level、期間外なら期間中に保存した defaultLevel に変更
async function reconcile(client: Client<true>) {
  const settings = await db.query.autoChangeVerifyLevelSetting.findMany({
    where: (setting, { eq }) => eq(setting.enabled, true),
  });

  for (const setting of settings) {
    const guild = await client.guilds.fetch(setting.guildId).catch(() => null);
    if (!guild) continue;

    const active = isActivePeriod(setting);
    const current = guild.verificationLevel;
    let target: number;

    if (active) {
      if (current === setting.level) continue;
      target = setting.level;
      // 変更前に現在の認証レベルを保存
      if (setting.defaultLevel === null) {
        await db
          .update(autoChangeVerifyLevelSetting)
          .set({ defaultLevel: current })
          .where(eq(autoChangeVerifyLevelSetting.guildId, setting.guildId));
      }
    } else {
      if (setting.defaultLevel === null) continue;
      target = setting.defaultLevel;
      // 期間内に設定した level のままでなければ保存値だけ破棄
      if (current !== setting.level) target = current;
    }

    if (target !== current) {
      try {
        await guild.setVerificationLevel(target);
      } catch (e) {
        console.error(e);
        continue;
      }
    }

    if (!active) {
      await db
        .update(autoChangeVerifyLevelSetting)
        .set({ defaultLevel: null })
        .where(eq(autoChangeVerifyLevelSetting.guildId, setting.guildId));
    }

    if (target === current || !(setting.enableLog && setting.logChannel)) continue;
    const channel = await guild.channels.fetch(setting.logChannel).catch(() => null);
    if (!channel?.isSendable()) continue;

    const level = levels[target as GuildVerificationLevel];
    channel
      .send({
        components: [
          new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              heading(
                `${getAppEmoji(Success.circleCheck)} 自動認証レベル変更 - ${active ? '開始' : '終了'}`,
                HeadingLevel.Three,
              ),
            ),
            new TextDisplayBuilder().setContent(
              [
                `サーバーの認証レベルを${bold(level.name)}に変更しました。`,
                subtext(level.description),
              ].join('\n'),
            ),
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(console.error);
  }
}
