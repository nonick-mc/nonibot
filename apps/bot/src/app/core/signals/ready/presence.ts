import { ActivityType, Events } from 'discord.js';
import { schedule } from 'node-cron';
import { execute, Signal } from 'sunar';

export const signal = new Signal(Events.ClientReady, { once: true });

execute(signal, (client) => {
  const update = async () => {
    const guildCount = (await client.application.fetch()).approximateGuildCount;
    client.user.setActivity({
      name: `/help | ${guildCount} servers`,
      type: ActivityType.Custom,
    });
  };

  schedule('0 0 * * *', () => update().catch(console.error), { timezone: 'Asia/Tokyo' });
  // Bot起動時にも実行
  update().catch(console.error);
});
