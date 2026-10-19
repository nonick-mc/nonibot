import { resolve } from 'node:path';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';

GlobalFonts.registerFromPath(resolve(process.cwd(), 'assets/OpenSans-Regular.ttf'), 'Captcha');

const W = 300;
const H = 100;
const Chars = 6;
const Color = '#4b9d6e';

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randomLetters = (n: number) =>
  Array.from({ length: n }, () => String.fromCharCode(65 + Math.floor(rand(0, 26)))).join('');

/** 画像認証用の画像(JPEG)と正解の文字列を生成する */
export function createCaptcha() {
  const text = randomLetters(Chars);
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  // ダミー文字(灰色)
  ctx.font = '20px Captcha';
  ctx.fillStyle = '#646566';
  ctx.globalAlpha = 0.8;
  for (const c of randomLetters(Math.floor((W * H) / 5000))) {
    ctx.fillText(c, rand(30, W - 30), rand(30, H - 30));
  }

  // ノイズ線
  ctx.strokeStyle = Color;
  ctx.globalAlpha = 1;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(rand(0, 30), rand(10, H - 10));
    ctx.lineTo(rand(W - 30, W), rand(10, H - 10));
    ctx.stroke();
  }

  // 正解の文字(緑)
  ctx.font = '40px Captcha';
  ctx.fillStyle = Color;
  ctx.globalAlpha = 0.8;
  const gap = W / Chars;
  for (let i = 0; i < Chars; i++) {
    ctx.save();
    ctx.translate(15 + gap * (i + 0.2), rand(30, H - 30));
    ctx.transform(1, Math.random(), rand(0, 0.2), 1, 0, 0);
    ctx.rotate(rand(-0.15, 0.15));
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }

  return { image: canvas.toBuffer('image/jpeg'), text };
}
