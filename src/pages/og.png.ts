import sharp from 'sharp';
import { Buffer } from 'node:buffer';
import tokens from '../../docs/design/tokens.json';

/** Original workflow motif, rasterized at build time for social-card compatibility. */
export async function GET(): Promise<Response> {
  const { paper, ink, brass, paperDeep } = tokens.palette;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="${paper.$value.hex}"/>
    <path d="M240 315H960" stroke="${brass.$value.hex}" stroke-width="8"/>
    <g fill="${paperDeep.$value.hex}" stroke="${ink.$value.hex}" stroke-width="6">
      <rect x="160" y="235" width="160" height="160" rx="4"/>
      <circle cx="600" cy="315" r="80"/>
      <rect x="880" y="235" width="160" height="160" rx="4"/>
    </g>
    <path d="m565 315 25 25 45-50" fill="none" stroke="${brass.$value.hex}" stroke-width="8"/>
  </svg>`;
  const image = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(image), {
    headers: { 'Content-Type': 'image/png' },
  });
}
