// Optional zero-dependency preview server. Double-clicking index.html also works.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end('Bad request'); return; }
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep) || !['GET', 'HEAD'].includes(req.method)) { res.writeHead(403).end('Forbidden'); return; }
  fs.readFile(file, (error, body) => {
    if (error) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : body);
  });
});
server.listen(Number(process.env.PORT) || 4173, '127.0.0.1', () => console.log(`Legendary Shop is open: http://127.0.0.1:${server.address().port}`));
