import { resolve } from 'node:path';
import { createCanvas, GlobalFonts, loadImage, type SKRSContext2D } from '@napi-rs/canvas';
import { getNeedXP, siUnit } from './xp';

// 開発時(src)とビルド後(dist)のどちらでも、パッケージルートのassetsを参照する
const root = import.meta.dirname.match(/^(.*)[/\\](?:src|dist)\b/)?.[1] ?? process.cwd();

// フォント(Noto Sans JPの可変フォント。太さはwght軸で指定する)
const FontPath = resolve(root, 'assets/NotoSansJP-VariableFont_wght.ttf');
const FontFamily = 'NotoSansJP';
GlobalFonts.registerFromPath(FontPath, FontFamily);

const Weight = { regular: 400, semiBold: 600, black: 900 };

/** フォントサイズと太さ(wght軸)を指定する。*/
function setFont(ctx: SKRSContext2D, size: number, weight: number) {
  ctx.font = `${size}px ${FontFamily}`;
  ctx.fontVariationSettings = `"wght" ${weight}`;
}

const Color = {
  background: '#0a0a0a',
  surface: '#18181b', // アバターの枠・バーの外枠
  track: '#262626', // バーの背景
  text: '#fff',
  muted: '#737373',
  defaultBar: '#7596ee', // ロールに色がない場合のバーの色
};

const Width = 750;
const Height = 200;
const PaddingX = 30;
const AvatarRingSize = 146;
const AvatarRingPadding = 6;
const Gap = 20;
const NameGap = Gap / 2; // 表示名とユーザー名の間隔
const BarHeight = 30;
const BarPadding = 5;

// 右側(名前・バー・数値)の領域
const ContentX = PaddingX + AvatarRingSize + Gap;
const ContentRight = Width - PaddingX;
const ContentWidth = ContentRight - ContentX;
// 縦の間隔(文字は数字の上端〜ベースラインを高さとして扱う)
const HeadingGap = 3; // 見出しの文字枠の下端〜バーの上端
const BarToStats = 18; // バーの下端〜数値の上端

type RankCardOptions = {
  name: string;
  username: string;
  avatarUrl: string;
  /** プログレスバーの色(最上位のロールの色)。0・未設定ならデフォルト色 */
  color?: number;
  lv: number;
  xp: number;
  rank: number;
};

/** 幅に収まるよう、末尾を…で省略する */
function fit(ctx: SKRSContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let s = text;
  while (s.length > 0 && ctx.measureText(`${s}…`).width > maxWidth) s = s.slice(0, -1);
  return `${s}…`;
}

/** 右端を基準に、グレーの前置き+白の値(または白の値+グレーの後置き)を描く */
function drawRight(ctx: SKRSContext2D, x: number, y: number, parts: [string, string][]) {
  ctx.textAlign = 'right';
  let right = x;
  for (const [text, color] of [...parts].reverse()) {
    ctx.fillStyle = color;
    ctx.fillText(text, right, y);
    right -= ctx.measureText(text).width;
  }
}

export async function createRankCard({
  name,
  username,
  avatarUrl,
  color,
  lv,
  xp,
  rank,
}: RankCardOptions) {
  const canvas = createCanvas(Width, Height);
  const ctx = canvas.getContext('2d');
  const avatar = await loadImage(avatarUrl);
  const need = getNeedXP(lv);
  const barColor = color ? `#${color.toString(16).padStart(6, '0')}` : Color.defaultBar;

  ctx.fillStyle = Color.background;
  ctx.fillRect(0, 0, Width, Height);
  ctx.textBaseline = 'alphabetic';

  // 右側の要素全体(見出しの数字の上端〜数値のベースライン)をアバターと上下中央に揃える
  setFont(ctx, 48, Weight.regular);
  const headingMetrics = ctx.measureText('0');
  const headingCap = headingMetrics.actualBoundingBoxAscent;
  const headingToBar = headingMetrics.fontBoundingBoxDescent + HeadingGap;
  setFont(ctx, 20, Weight.regular);
  const statsCap = ctx.measureText('0').actualBoundingBoxAscent;
  const contentHeight = headingCap + headingToBar + BarHeight + BarToStats + statsCap;
  const baseline = (Height - contentHeight) / 2 + headingCap;
  const barTop = baseline + headingToBar;
  const statsBaseline = barTop + BarHeight + BarToStats + statsCap;

  // アバター(枠つき)
  const cy = Height / 2;
  const cx = PaddingX + AvatarRingSize / 2;
  const avatarRadius = AvatarRingSize / 2 - AvatarRingPadding;
  ctx.beginPath();
  ctx.arc(cx, cy, AvatarRingSize / 2, 0, 2 * Math.PI);
  ctx.fillStyle = Color.surface;
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, avatarRadius, 0, 2 * Math.PI);
  ctx.clip();
  ctx.drawImage(avatar, cx - avatarRadius, cy - avatarRadius, avatarRadius * 2, avatarRadius * 2);
  ctx.restore();

  // 見出し: 右にランク、左に表示名とユーザー名
  setFont(ctx, 48, Weight.regular);
  const rankText = String(rank);
  const rankWidth = ctx.measureText(`#${rankText}`).width;
  drawRight(ctx, ContentRight, baseline, [
    ['#', Color.muted],
    [rankText, Color.text],
  ]);

  const headingWidth = ContentWidth - rankWidth - Gap;
  ctx.textAlign = 'left';
  setFont(ctx, 32, Weight.black);
  const shownName = fit(ctx, name, headingWidth);
  ctx.fillStyle = Color.text;
  ctx.fillText(shownName, ContentX, baseline);
  const nameWidth = ctx.measureText(shownName).width;

  setFont(ctx, 24, Weight.semiBold);
  const usernameWidth = headingWidth - nameWidth - NameGap;
  if (usernameWidth > 40) {
    ctx.fillStyle = Color.muted;
    ctx.fillText(fit(ctx, username, usernameWidth), ContentX + nameWidth + NameGap, baseline);
  }

  // プログレスバー
  ctx.beginPath();
  ctx.roundRect(ContentX, barTop, ContentWidth, BarHeight, BarHeight / 2);
  ctx.fillStyle = Color.surface;
  ctx.fill();

  const trackX = ContentX + BarPadding;
  const trackY = barTop + BarPadding;
  const trackWidth = ContentWidth - BarPadding * 2;
  const trackHeight = BarHeight - BarPadding * 2;
  ctx.beginPath();
  ctx.roundRect(trackX, trackY, trackWidth, trackHeight, trackHeight / 2);
  ctx.fillStyle = Color.track;
  ctx.fill();

  const valueWidth = trackWidth * Math.min(xp / need, 1);
  if (valueWidth > 0) {
    ctx.beginPath();
    ctx.roundRect(trackX, trackY, valueWidth, trackHeight, trackHeight / 2);
    ctx.fillStyle = barColor;
    ctx.fill();
  }

  // レベル・経験値
  setFont(ctx, 20, Weight.regular);
  ctx.textAlign = 'left';
  ctx.fillStyle = Color.muted;
  ctx.fillText('Lv.', ContentX, statsBaseline);
  const lvLabelWidth = ctx.measureText('Lv.').width;
  ctx.fillStyle = Color.text;
  ctx.fillText(String(lv), ContentX + lvLabelWidth, statsBaseline);

  drawRight(ctx, ContentRight, statsBaseline, [
    [siUnit(xp), Color.text],
    [` / ${siUnit(need)} XP`, Color.muted],
  ]);

  return canvas.encode('png');
}
