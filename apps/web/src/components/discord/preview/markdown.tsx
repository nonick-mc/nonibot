'use client';

import type { Placeholder } from '@repo/placeholders';
import { CDNRoutes, ImageFormat, RouteBases } from 'discord-api-types/v10';
import { type parse, rules, SimpleMarkdown } from 'discord-markdown-parser';
import type { ParserRules } from 'discord-markdown-parser/dist/simple-markdown';
import { BracesIcon } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { Fragment, type ReactNode, useContext, useState } from 'react';
import twemoji from 'twemoji';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { DiscordMessageContext } from '../message-context';
import { ChannelMention, GuildNavigationMention, Mention, RoleMention } from './mention';

// Component
export function InlineCode({ children }: PropsWithChildren) {
  return (
    <code className='border rounded px-0.5 font-mono text-[0.9em] bg-[#f2f3f5] text-[#080a0c] dark:bg-[#1e1f22] dark:text-[#dbdee1]'>
      {children}
    </code>
  );
}

export function CodeBlock({ children }: PropsWithChildren) {
  return (
    <pre className='border whitespace-pre-wrap rounded-sm p-[7] font-mono text-[0.85em] bg-[#f2f3f5] text-[#080a0c] dark:bg-[#1e1f22] dark:text-[#dbdee1]'>
      <code>{children}</code>
    </pre>
  );
}

export function BlockQuote({ children }: PropsWithChildren) {
  return (
    <div className='my-1 flex justify-stretch'>
      <div className='bg-[#c4c9ce] w-1 rounded-sm dark:bg-[#4e5058]' />
      <blockquote className='flex-1 pl-3 pr-2 mb-0.5 text-muted-foreground'>{children}</blockquote>
    </div>
  );
}

export function Subtext({ children }: PropsWithChildren) {
  return (
    <small className='text-[0.85em] text-muted-foreground'>
      {children}
      <br />
    </small>
  );
}

export function SpoilerText({ children }: { children: ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <span
      className={cn(
        'cursor-pointer rounded px-0 transition-all break-words box-decoration-clone',
        revealed
          ? 'bg-discord-spoiler/10'
          : 'bg-discord-spoiler hover:brightness-90 dark:hover:brightness-120 select-none',
      )}
      onClick={() => setRevealed(true)}
    >
      <span className={cn(!revealed && 'opacity-0')}>{children}</span>
    </span>
  );
}

export function Link({ href, children }: { href: string; children?: ReactNode }) {
  return (
    <a href={href} className='text-[#00a8fc] hover:underline' target='_blank' rel='noreferrer'>
      {children ?? href}
    </a>
  );
}

export function Emoji({ id, name, animated }: { id: string; name: string; animated: boolean }) {
  return (
    // biome-ignore lint/performance/noImgElement: Unknown Size Emoji
    <img
      src={`${RouteBases.cdn}/${CDNRoutes.emoji(id, animated ? ImageFormat.GIF : ImageFormat.WebP)}`}
      alt={`:${name}:`}
      className='inline-block h-[1.5em] w-[1.5em] align-text-bottom'
    />
  );
}

export function Twemoji({ name }: { name: string }) {
  return (
    <span
      className='[&_img]:inline-block [&_img]:h-[1.5em] [&_img]:w-[1.5em] [&_img]:align-text-bottom'
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Twemoji
      dangerouslySetInnerHTML={{ __html: twemoji.parse(name) }}
    />
  );
}

// AST Parser
type ASTNode = ReturnType<typeof parse>[number];

const atLineStart = (_: string, state: any) =>
  (state.prevCapture as string[] | null) === null ||
  (state.prevCapture as string[])[0].endsWith('\n');

const LIST_LOOKBEHIND_R = /(?:^|\n)( *)$/;
const PLACEHOLDER_R = /^\{\{\s*(\w+)\s*\}\}/;
const LIST_BULLET_PAT = '(?:[*+-]|\\d+\\.)';
const CUSTOM_LIST_R = new RegExp(
  '^( *)(' +
    LIST_BULLET_PAT +
    ') [^\\n]*' + // 最初のアイテム行
    '(?:\\n[ \\t]*' +
    LIST_BULLET_PAT +
    ' [^\\n]*)*' + // 後続のリスト行（ネストを含む）
    '(?:\\n{2,}|\\n|$)', // 終端（空白行 or 改行 or 末尾）
);

const newRules: ParserRules = {
  ...rules,
  link: SimpleMarkdown.defaultRules.link,
  list: {
    ...SimpleMarkdown.defaultRules.list,
    match: (source: string, state) => {
      const prevCaptureStr = (state.prevCapture as string[] | null)?.[0] ?? '';
      const startCapture = LIST_LOOKBEHIND_R.exec(prevCaptureStr);
      if (!startCapture || !(state._list || !state.inline)) return null;
      return CUSTOM_LIST_R.exec(startCapture[1] + source);
    },
    // LIST_R が消費した末尾の \n\n をノードに記録し、renderNode で <br> として復元する
    parse: (capture, parse, state) => {
      const node = SimpleMarkdown.defaultRules.list.parse(capture, parse, state);
      return { ...node, trailingNewline: /\n{2,}$/.test(capture[0] as string) };
    },
  },
  heading: {
    ...rules.heading,
    match: (source: string, state) =>
      atLineStart(source, state) ? /^(#{1,3}) +([^\n]+?)(\n|$)/.exec(source) : null,
  },
  subtext: {
    ...rules.subtext,
    match: (source: string, state) =>
      atLineStart(source, state) ? /^-# +([^\n]+?)(\n|$)/.exec(source) : null,
  },
  guildNavigation: {
    order: rules.guildNavigation.order,
    match: (source: string) =>
      /^<(id|\d{17,20}):(?:(customize|browse|guide)|(linked-roles)(:\d{17,20})?)>/.exec(source),
    parse: rules.guildNavigation.parse,
  },
  placeholder: {
    order: SimpleMarkdown.defaultRules.strong.order,
    match: (source: string) => PLACEHOLDER_R.exec(source),
    parse: (capture) => ({ key: capture[1] }),
  },
};

const customParser = SimpleMarkdown.parserFor(newRules);

function renderNode(node: ASTNode, key: number, placeholders: Placeholder | undefined): ReactNode {
  const content = node.content as ASTNode[] | string | undefined;
  const nested = Array.isArray(content)
    ? renderNodes(content, placeholders)
    : typeof content === 'string'
      ? content
      : null;

  switch (node.type) {
    // Markdown
    case 'text':
      return node.content as string;
    case 'strong':
      return <strong key={key}>{nested}</strong>;
    case 'em':
      return <em key={key}>{nested}</em>;
    case 'underline':
    case 'u':
      return (
        <span key={key} className='underline'>
          {nested}
        </span>
      );
    case 'strikethrough':
    case 'del':
      return <s key={key}>{nested}</s>;
    case 'inlineCode':
      return <InlineCode key={key}>{node.content}</InlineCode>;
    case 'codeBlock':
      return <CodeBlock key={key}>{node.content}</CodeBlock>;
    case 'spoiler':
      return <SpoilerText key={key}>{nested}</SpoilerText>;
    case 'list': {
      const ordered = node.ordered as boolean;
      const items = node.items as ASTNode[][];
      const Tag = ordered ? 'ol' : 'ul';
      return (
        <Fragment key={key}>
          <Tag className={cn('my-1 pl-5', ordered ? 'list-decimal' : 'list-disc')}>
            {items.map((item, i) => (
              <li key={i}>{renderNodes(item, placeholders)}</li>
            ))}
          </Tag>
          {(node.trailingNewline as boolean) && <br />}
        </Fragment>
      );
    }
    case 'blockQuote':
      return <BlockQuote key={key}>{nested}</BlockQuote>;
    case 'heading': {
      const Tag = `h${node.level as 1 | 2 | 3}` as 'h1' | 'h2' | 'h3';
      return <Tag key={key}>{nested}</Tag>;
    }
    case 'emoticon':
    case 'escape':
      return typeof content === 'string' ? content : null;
    case 'subtext':
      return <Subtext key={key}>{nested}</Subtext>;
    case 'br':
    case 'newline':
      return <br key={key} />;
    case 'autolink':
    case 'url':
    case 'link': {
      const href = (node.target ?? node.href ?? node.url ?? '') as string;
      return (
        <Link key={key} href={href}>
          {nested}
        </Link>
      );
    }

    // メンション
    case 'channel':
      return <ChannelMention key={key} id={node.id as string} />;
    case 'user':
      return <Mention key={key}>@ユーザー</Mention>;
    case 'role':
      return <RoleMention key={key} id={node.id as string} />;
    case 'everyone':
    case 'here':
      return <Mention key={key}>@{node.type}</Mention>;
    case 'slashCommand':
      return <Mention key={key}>/{node.name as string}</Mention>;
    case 'guildNavigation':
      return <GuildNavigationMention key={key} variant={node.navigation} />;
    case 'time': {
      const ts = new Date((node.timestamp as number) * 1000);
      return (
        <span key={key} className='rounded px-1 bg-[#4f5660]/10 dark:bg-[#b5bac1]/10'>
          {ts.toLocaleString('ja-JP')}
        </span>
      );
    }

    // 絵文字
    case 'emoji':
      return <Emoji key={key} id={node.id} name={node.name} animated={node.animated} />;
    case 'twemoji':
      return <Twemoji key={key} name={node.name} />;

    // プレースホルダー
    case 'placeholder': {
      const placeholderKey = node.key as string;

      const placeholder = placeholders?.find((v) => v.key === placeholderKey);
      if (!placeholder) return `{{${placeholderKey}}}`;

      return (
        <Tooltip key={key}>
          <TooltipTrigger
            render={
              <span className='inline-flex items-center align-bottom cursor-pointer rounded-sm px-0.5 font-mono border border-primary [&_svg]:mt-0.5 [&_svg]:size-[1em]' />
            }
          >
            {placeholderKey}
          </TooltipTrigger>
          <TooltipContent>{placeholder.description}</TooltipContent>
        </Tooltip>
      );
    }

    default:
      if (Array.isArray(content))
        return <span key={key}>{renderNodes(content, placeholders)}</span>;
      if (typeof content === 'string') return content;
      return null;
  }
}

function renderNodes(nodes: ASTNode[], placeholders: Placeholder | undefined): ReactNode {
  const result: ReactNode[] = [];
  let i = 0;
  // 連結するtextノードを結合
  while (i < nodes.length) {
    if (nodes[i].type === 'text') {
      let text = '';
      while (i < nodes.length && nodes[i].type === 'text') {
        text += nodes[i].content as string;
        i++;
      }
      result.push(text);
    } else {
      result.push(renderNode(nodes[i], i, placeholders));
      i++;
    }
  }
  return result;
}

export function DiscordMarkdown({ content }: { content: string }) {
  const { placeholders } = useContext(DiscordMessageContext);
  if (!content) return null;
  return (
    <span
      className={cn(
        'whitespace-pre-wrap wrap-break-words leading-tight text-[14px]',
        // h1~h3
        '[&_:where(h1,h2,h3)]:font-extrabold [&_:where(h1,h2,h3)]:leading-tight',
        '[&_h1]:text-[24px] [&_h2]:text-[20px] [&_h3]:text-[16px]',
        'not-in-[.discord-container]:[&_:where(h1,h2,h3)]:my-2',
        'not-in-[.discord-container]:[&_:where(h1,h2,h3):not(:first-child)]:mt-4',
        'in-[.discord-container]:[&_:where(h1,h2,h3):not(:first-child)]:mt-4',
        'in-[.discord-container]:[&_:where(h1,h2,h3):not(:last-child)]:mb-2',
      )}
    >
      {renderNodes(
        customParser(content, { inline: true, extended: true, _list: true }),
        placeholders,
      )}
    </span>
  );
}
