import { Events, Status } from 'discord.js';
import { execute, Signal } from 'sunar';

export const signal = new Signal(Events.ClientReady, { once: true });

// 死活監視ツールの任意のURLに生存通知を送る
execute(signal, (client) => {
  const url = process.env.HEARTBEAT_URL;
  if (!url) return;

  const send = () => {
    if (client.ws.status !== Status.Ready) return;
    fetch(url, { signal: AbortSignal.timeout(10_000) }).catch((error) =>
      console.error('[heartbeat]', error),
    );
  };

  setInterval(send, 60_000);
  send();
});
