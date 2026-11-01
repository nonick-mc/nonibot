import {
  blockQuote,
  ContainerBuilder,
  Events,
  HeadingLevel,
  heading,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  userMention,
} from 'discord.js';
import { execute, Signal } from 'sunar';
import { Default, getAppEmoji } from '@/src/constants/emoji';
import { findReportsByMessage, sendReportLog } from '../notify-report-thread';

export const signal = new Signal(Events.MessageUpdate);

const contentMaxLength = 1000;

function formatContent(content: string | null | undefined) {
  if (!content) return '内容を取得できませんでした';
  return content.length > contentMaxLength ? `${content.slice(0, contentMaxLength)}…` : content;
}

execute(signal, async (oldMessage, newMessage) => {
  const guild = newMessage.guild;
  if (!guild) return;

  const reports = await findReportsByMessage(guild.id, newMessage.channelId, newMessage.id);
  const [firstReport] = reports;
  if (!firstReport) return;

  const oldContent = oldMessage.partial ? null : oldMessage.content;
  const newContent = newMessage.partial ? null : newMessage.content;

  if (oldContent !== null && oldContent === newContent) return;

  const authorId = newMessage.author?.id ?? firstReport.targetUserId;

  const containers = [
    new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${getAppEmoji(Default.squarePen)} ${userMention(authorId)}がメッセージを編集しました`,
      ),
    ),
    new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          [heading('編集前のメッセージ', HeadingLevel.Three), formatContent(oldContent)].join('\n'),
        ),
      )
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          [heading('編集後のメッセージ', HeadingLevel.Three), formatContent(newContent)].join('\n'),
        ),
      ),
  ];

  await sendReportLog(guild, reports, containers);
});
