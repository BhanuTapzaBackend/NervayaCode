import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const ROOT = resolve(__dirname, '..');
const SVG_PATH = resolve(ROOT, 'src/app/icon.svg');
const OUT_DIR = resolve(ROOT, 'public/icons/pwa');

mkdirSync(OUT_DIR, { recursive: true });

const svgBuffer = readFileSync(SVG_PATH);

type RenderOptions = {
  size: number;
  file: string;
  background?: { r: number; g: number; b: number; alpha: number };
  paddingRatio?: number;
};

async function render({ size, file, background, paddingRatio = 0 }: RenderOptions): Promise<void> {
  const padding = Math.round(size * paddingRatio);
  const innerSize = size - padding * 2;

  const innerPng = await sharp(svgBuffer, { density: 512 })
    .resize(innerSize, innerSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const canvas = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });

  await canvas
    .composite([{ input: innerPng, top: padding, left: padding }])
    .png()
    .toFile(resolve(OUT_DIR, file));

  const padSuffix = padding ? `, pad ${padding}` : '';
  console.log(`wrote ${file} (${size}x${size}${padSuffix})`);
}

async function main(): Promise<void> {
  await render({ size: 192, file: 'icon-192.png' });
  await render({ size: 512, file: 'icon-512.png' });
  await render({
    size: 512,
    file: 'icon-512-maskable.png',
    background: { r: 255, g: 255, b: 255, alpha: 1 },
    paddingRatio: 0.12,
  });
  await render({
    size: 180,
    file: 'apple-touch-icon.png',
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  });
  console.log(`Done. Output in ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
