import type { auditLog } from '@repo/database';
import type { InternalApiChannel, InternalApiRole } from '@repo/shared/types';
import { ChannelType } from 'discord-api-types/v10';

export type Resources = { channels: InternalApiChannel[]; roles: InternalApiRole[] };

export type MessageValue = unknown[] | undefined;

/** 表示する値。チャンネルとロールは画面側でメンションとして描画する */
export type Value = string | { channel: string } | { role: string };

export type Change =
  | { kind: 'toggle'; label: string; value: boolean }
  | { kind: 'changed'; label: string; after: Value }
  | { kind: 'set'; label: string; after: Value }
  | { kind: 'unset'; label: string }
  | { kind: 'list'; label: string; added: Value[]; removed: Value[] }
  | { kind: 'message'; label: string; before: MessageValue; after: MessageValue }
  | { kind: 'reordered'; label: string }
  | { kind: 'group'; label: string; step: string; children: Change[] }
  | { kind: 'value'; label: string; value: Value | Value[] }
  | { kind: 'valueMessage'; label: string; value: MessageValue };

const IgnoredKeys = new Set(['id', 'guildId', 'createdAt', 'updatedAt']);
const MessageKeys = new Set(['messageComponents', 'dmMessageComponents', 'components']);

type TargetName = typeof auditLog.$inferSelect.targetName;

const eventLogLabels = (name: string) => ({
  enabled: `${name}を有効にする`,
  channel: 'ログを送信するチャンネル',
  ignoreRoles: 'ログの対象外にするロール',
});

/** 機能ごとのラベル。各ダッシュボードのフォームのFieldLabelと同じ文言にする */
const targetLabels: Partial<Record<TargetName, Record<string, string>>> = {
  join_message: {
    enabled: 'チャンネルにメッセージを送信する',
    channel: 'メッセージを送信するチャンネル',
    sendTrigger: 'メッセージを送信するタイミング',
    ignoreBot: 'BOT入室時にメッセージを送信しない',
    messageComponents: 'チャンネルに送信するメッセージ',
    dmEnabled: 'DMにメッセージを送信する',
    dmMessageComponents: 'DMに送信するメッセージ',
  },
  leave_message: {
    enabled: '退室メッセージを有効にする',
    channel: 'メッセージを送信するチャンネル',
    ignoreBot: 'BOT退室時にメッセージを送信しない',
    messageComponents: 'メッセージ',
  },
  report: {
    enabled: 'サーバー内通報を有効にする',
    channel: '通報を管理するチャンネル',
    includeModerator: 'モデレーターも通報の対象にする',
    showModerateLog: 'モデレートログを有効にする',
    ignoreRoles: '通報の対象外にするロール',
    mentionRoles: 'メンションするロール',
    messageCategories: '通報カテゴリ（メッセージ）',
    userCategories: '通報カテゴリ（ユーザー）',
    resolvedForumTag: '「対応済み」ボタンを押した時に付与するタグ',
    ignoredForumTag: '「対応なし」ボタンを押した時に付与するタグ',
  },
  timeout_log: eventLogLabels('タイムアウトログ'),
  kick_log: eventLogLabels('キックログ'),
  ban_log: eventLogLabels('BANログ'),
  voice_log: eventLogLabels('ボイスチャットログ'),
  message_delete_log: eventLogLabels('メッセージ削除ログ'),
  message_edit_log: eventLogLabels('メッセージ編集ログ'),
  message_expand: {
    enabled: 'メッセージURL展開を有効にする',
    allowExternalGuild: 'このサーバーのメッセージを他のサーバーで展開することを許可する',
    onlyOwnGuild: '他のサーバーのメッセージを展開しない',
    ignoreChannelTypes: '除外するチャンネルの種類',
    ignoreChannels: '除外するチャンネル',
    ignorePrefixes: 'プレフィックス',
  },
  auto_change_verify_level: {
    enabled: '自動認証レベル変更を有効にする',
    startHour: '変更を適用する時間帯',
    endHour: '変更を適用する時間帯',
    level: '認証レベル',
    enableLog: 'ログを有効にする',
    logChannel: 'ログを送信するチャンネル',
  },
  auto_public: {
    enabled: '自動アナウンス公開を有効にする',
    channels: '自動公開するチャンネル',
    reactOnFailure: '公開失敗時にリアクションを付ける',
    ignoreRoles: 'アナウンス公開を除外するロール',
    ignoreWebhooks: 'Webhookが送信したメッセージを除外する',
  },
  auto_create_thread: {
    enabled: '自動スレッド作成を有効にする',
    channelId: 'スレッドを作成するチャンネル',
    threadName: 'スレッドの名前',
    autoArchiveDuration: 'スレッドの自動アーカイブ時間',
    initialThreadState: 'スレッドの初期状態',
    ignoreRoles: 'スレッド作成を除外するロール',
    ignoreBot: 'BotやWebhookが送信したメッセージを除外する',
    messageEnabled: 'スレッド作成後にメッセージを送信する',
    messageComponents: 'メッセージ',
  },
  auto_mod: {
    enabled: 'AutoMod Plusを有効にする',
    enableInviteUrlFilter: 'このサーバー以外の招待リンク',
    enableTokenFilter: 'Discordトークン',
    enableDomainFilter: 'ドメイン',
    domainList: 'ブロックするドメイン',
    ignoreChannels: '除外するチャンネル',
    ignoreRoles: '除外するロール',
    enableLog: 'ログを有効にする',
    logChannel: 'ログを送信するチャンネル',
  },
  verification: {
    enabled: 'メンバー認証を有効にする',
    role: '認証成功時に付与するロール',
    captchaType: '認証方法',
    messageComponents: 'メッセージ',
    channelId: '送信先のチャンネル',
  },
  custom_message: {
    channelId: '送信先のチャンネル',
    messageId: 'メッセージID',
    name: 'メッセージの名前',
    components: 'メッセージ',
  },
  custom_action: { name: 'アクション名', steps: 'アクション' },
};

const ChannelKeys = new Set(['channel', 'channelId', 'channels', 'logChannel', 'ignoreChannels']);
const RoleKeys = new Set(['role', 'ignoreRoles', 'mentionRoles']);
const ForumTagKeys = new Set(['resolvedForumTag', 'ignoredForumTag']);

const enums: Record<string, Record<string | number, string>> = {
  sendTrigger: { joined: 'サーバー参加時', passedMembershipGate: 'メンバーシップ認証通過時' },
  captchaType: { button: 'ボタン', image: '画像', web: 'Web' },
  initialThreadState: {
    open: 'オープン',
    archived: 'アーカイブ',
    locked: 'ロック',
    archived_locked: 'アーカイブ&ロック',
  },
  level: { 1: '低', 2: '中', 3: '高', 4: '最高' },
  defaultLevel: { 0: '設定無し', 1: '低', 2: '中', 3: '高', 4: '最高' },
  ignoreChannelTypes: {
    [ChannelType.GuildAnnouncement]: 'アナウンスチャンネル',
    [ChannelType.GuildVoice]: 'ボイスチャンネル',
    [ChannelType.PublicThread]: '公開スレッド',
    [ChannelType.PrivateThread]: 'プライベートスレッド',
  },
  autoArchiveDuration: { 60: '1時間', 1440: '24時間', 4320: '3日', 10080: '1週間' },
};

const labelOf = (target: TargetName, key: string) => targetLabels[target]?.[key] ?? '不明な設定';

function formatScalar(
  key: string,
  value: unknown,
  { channels }: Pick<Resources, 'channels'>,
): Value {
  if (value === null || value === undefined) return '未設定';
  if (typeof value === 'boolean') return value ? 'オン' : 'オフ';

  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);

  if (ChannelKeys.has(key)) return { channel: text };
  if (RoleKeys.has(key)) return { role: text };
  if (ForumTagKeys.has(key)) {
    for (const channel of channels) {
      if (!('available_tags' in channel)) continue;
      const tag = channel.available_tags.find((t) => t.id === text);
      if (tag) return tag.name;
    }
    return text;
  }
  if (key === 'startHour' || key === 'endHour') return `${text}時`;

  return enums[key]?.[text] ?? text;
}

/** 配列の要素を表示用の文字列にする。オブジェクトは`label`があればそれを使う */
function formatItem(key: string, item: unknown, resources: Resources): Value {
  if (item && typeof item === 'object' && 'label' in item) return String(item.label);
  return formatScalar(key, item, resources);
}

const isEqual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const asArray = (value: unknown): unknown[] | undefined =>
  Array.isArray(value) ? value : undefined;

function diffKey(
  target: TargetName,
  key: string,
  before: unknown,
  after: unknown,
  resources: Resources,
): Change | null {
  const label = labelOf(target, key);

  if (MessageKeys.has(key)) {
    return { kind: 'message', label, before: asArray(before), after: asArray(after) };
  }
  if (Array.isArray(before) || Array.isArray(after)) {
    const b = asArray(before) ?? [];
    const a = asArray(after) ?? [];
    const added = a.filter((x) => !b.some((y) => isEqual(x, y)));
    const removed = b.filter((x) => !a.some((y) => isEqual(x, y)));
    if (added.length === 0 && removed.length === 0) return { kind: 'reordered', label };
    return {
      kind: 'list',
      label,
      added: added.map((x) => formatItem(key, x, resources)),
      removed: removed.map((x) => formatItem(key, x, resources)),
    };
  }
  if (typeof after === 'boolean' && typeof before === 'boolean') {
    return { kind: 'toggle', label, value: after };
  }
  if (before === null || before === undefined) {
    return { kind: 'set', label, after: formatScalar(key, after, resources) };
  }
  if (after === null || after === undefined) return { kind: 'unset', label };

  return {
    kind: 'changed',
    label,
    after: formatScalar(key, after, resources),
  };
}

function listKey(target: TargetName, key: string, value: unknown, resources: Resources): Change {
  const label = labelOf(target, key);
  if (MessageKeys.has(key)) return { kind: 'valueMessage', label, value: asArray(value) };
  if (key === 'steps') return { kind: 'value', label, value: `${asArray(value)?.length ?? 0}件` };
  if (Array.isArray(value)) {
    return { kind: 'value', label, value: value.map((x) => formatItem(key, x, resources)) };
  }
  return { kind: 'value', label, value: formatScalar(key, value, resources) };
}

type Step = { type: string; config?: Record<string, unknown> };

const stepTypeLabels: Record<string, string> = {
  'role-toggle': 'ロールの付与・解除',
  'reply-message': 'メッセージを返信する',
};

const stepTypeLabel = (step: Step) => stepTypeLabels[step.type] ?? '不明なステップ';

/** ステップの中身。追加・種類の変更のときに、設定された値を示す */
function describeStep(step: Step): Change[] {
  if (step.type === 'role-toggle') {
    return [
      {
        kind: 'set',
        label: '付与・解除を切り替えるロール',
        after: { role: String(step.config?.roleId ?? '') },
      },
    ];
  }
  if (step.type === 'reply-message') {
    return [
      {
        kind: 'message',
        label: 'メッセージ',
        before: undefined,
        after: asArray(step.config?.components),
      },
    ];
  }
  return [];
}

/** カスタムアクションのステップを、位置(ステップ番号)ごとに比較する */
function diffSteps(before: unknown, after: unknown): Change[] {
  const b = (asArray(before) ?? []) as Step[];
  const a = (asArray(after) ?? []) as Step[];

  return Array.from({ length: Math.max(b.length, a.length) }, (_, i) => i).flatMap(
    (i): Change[] => {
      const [bs, as] = [b[i], a[i]];
      const label = `ステップ${i + 1}`;

      if (isEqual(bs, as)) return [];
      if (!as) return [{ kind: 'list', label, added: [], removed: [stepTypeLabel(bs)] }];

      const group = (children: Change[]): Change[] => [
        { kind: 'group', label, step: stepTypeLabel(as), children },
      ];
      if (!bs || bs.type !== as.type) return group(describeStep(as));

      const [bc, ac] = [bs.config ?? {}, as.config ?? {}];
      const children: Change[] = [];
      if (bc.roleId !== ac.roleId) children.push(...describeStep(as));
      if (bc.ephemeral !== ac.ephemeral) {
        children.push({
          kind: 'toggle',
          label: 'ボタンを押した本人にだけ表示する',
          value: Boolean(ac.ephemeral),
        });
      }
      if (!isEqual(bc.components, ac.components)) {
        children.push({
          kind: 'message',
          label: 'メッセージ',
          before: asArray(bc.components),
          after: asArray(ac.components),
        });
      }
      return group(children);
    },
  );
}

export function describeChanges(
  target: TargetName,
  before: unknown,
  after: unknown,
  resources: Resources,
): Change[] {
  const b = (before && typeof before === 'object' ? before : null) as Record<
    string,
    unknown
  > | null;
  const a = (after && typeof after === 'object' ? after : null) as Record<string, unknown> | null;

  const keys = [...new Set([...Object.keys(b ?? {}), ...Object.keys(a ?? {})])].filter(
    (key) => !IgnoredKeys.has(key),
  );

  // 作成・削除・送信など、片方しかないログは全キーを並べる
  if (!b || !a) {
    const side = a ?? b ?? {};
    return keys.map((key) => listKey(target, key, side[key], resources));
  }

  return keys.flatMap((key): Change[] => {
    if (isEqual(b[key], a[key])) return [];
    if (key === 'steps') return diffSteps(b[key], a[key]);
    return [diffKey(target, key, b[key], a[key], resources)].filter((c) => c !== null);
  });
}
