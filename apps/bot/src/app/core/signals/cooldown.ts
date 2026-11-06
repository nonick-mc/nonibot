import { inlineCode, MessageFlags } from 'discord.js';
import { execute, Signal } from 'sunar';
import { errorMessage } from '@/src/lib/format';

// sunarの`config(..., { cooldown })`でクールダウン中だった場合に発火する
export const signal = new Signal('cooldown');

execute(signal, (interaction, { remaining }) => {
  interaction.reply({
    content: errorMessage(
      `このコマンドはあと${inlineCode(String(Math.ceil(remaining / 1000)))}秒後に使用できます`,
    ),
    flags: MessageFlags.Ephemeral,
  });
});
