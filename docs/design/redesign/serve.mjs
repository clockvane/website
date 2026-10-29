// Local review server only. Serves docs/design so shared OFL fonts resolve.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
const root = fileURLToPath(new URL('../', import.meta.url)).replace(/\/$/, '');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
};
export const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(
      new URL(req.url, 'http://localhost').pathname,
    );
    if (path.endsWith('/')) path += 'index.html';
    const file = resolve(root, `.${path}`);
    if (!file.startsWith(`${root}/`) || !types[extname(file)]) {
      res.writeHead(404).end();
      return;
    }
    const body = await readFile(file);
    const compressed =
      /gzip/.test(req.headers['accept-encoding'] || '') &&
      extname(file) !== '.woff2';
    res.writeHead(200, {
      'Content-Type': types[extname(file)],
      ...(compressed
        ? { 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' }
        : {}),
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(compressed ? gzipSync(body) : body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(4411, '127.0.0.1', resolve));
console.log(
  'Local review: http://127.0.0.1:4411/redesign/concept-a/ — stop with Ctrl+C',
);
