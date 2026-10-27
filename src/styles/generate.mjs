import { readFileSync, writeFileSync } from 'node:fs';
import { tokenMedia, tokenProperties } from '../lib/design/tokens.ts';

const here = new URL('./', import.meta.url);
const tokens = JSON.parse(
  readFileSync(new URL('../../docs/design/tokens.json', here), 'utf8'),
);
const responsive = readFileSync(
  new URL('responsive.template.css', here),
  'utf8',
);
writeFileSync(
  new URL('tokens.css', here),
  `/* Generated from docs/design/tokens.json; do not edit. */\n:root {\n${tokenProperties(tokens).join('\n')}\n}\n${tokenMedia(responsive, tokens)}`,
);
