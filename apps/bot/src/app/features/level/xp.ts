import { getNeedXP } from '@repo/shared';

/** 1回のメッセージで付与する経験値(13〜19) */
export function getExp() {
  return Math.floor(Math.random() * 7 + 13);
}

/** 経験値を加算し、レベルアップを繰り返し反映した結果を返す */
export function addXP({ lv, xp }: { lv: number; xp: number }, add: number) {
  xp += add;
  for (let need = getNeedXP(lv); xp >= need; need = getNeedXP(lv)) {
    lv++;
    xp -= need;
  }
  return { lv, xp };
}

/** 1000 -> 1k のような表記にする */
export function siUnit(num: number) {
  if (num < 1000) return String(num);
  const units = ['k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y', 'R', 'Q'];
  const i = Math.min(Math.floor(Math.log10(num) / 3), units.length);
  return `${Math.floor((num / 10 ** (i * 3)) * 100) / 100}${units[i - 1]}`;
}

/** URL・メンション・絵文字・コードブロックなどを除いた文章が、経験値の対象になるか判定する */
export function isValidContent(content: string) {
  const escaped = content
    .replaceAll(/<?https?:\/\/[\w/:%#$&?()~.=+-]+>?/g, '') // URL
    .replaceAll(/<(#|@(!?|&))\d{16,}>/g, '') // メンション
    .replaceAll(/<a?:\w{2,32}:\d{16,}>/g, '') // 絵文字
    .replaceAll(/```[^`].*?```/gs, '') // コードブロック
    .replaceAll(/`[^`].*?`/g, '') // インラインコードブロック
    .replaceAll(/\[.+\]\(.+\)/g, '') // リンク
    .replaceAll(/\s+/g, ''); // 空白
  const normalized = escaped.replaceAll(/[^a-zぁ-んァ-ヶー々\p{sc=Han}]/giu, '');
  if (escaped.length - normalized.length > 6) return false;
  return new Set(normalized).size >= 2;
}
