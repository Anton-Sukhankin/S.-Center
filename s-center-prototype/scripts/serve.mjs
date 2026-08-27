import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';

const host = '127.0.0.1';
const port = Number(process.env.PORT || 4185);
const workspaceRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function safePath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const requested = decoded === '/' ? '/s-center-prototype/' : decoded;
  const relative = normalize(requested).replace(/^([/\\])+/, '');
  const candidate = resolve(join(workspaceRoot, relative));
  if (candidate !== workspaceRoot && !candidate.startsWith(`${workspaceRoot}${sep}`)) return null;
  return candidate;
}

const server = createServer((request, response) => {
  const url = new URL(request.url || '/', `http://${host}:${port}`);
  if (url.pathname === '/') {
    response.writeHead(302, {
      Location: '/s-center-prototype/',
      'Cache-Control': 'no-store',
    }).end();
    return;
  }

  let filePath = safePath(url.pathname);
  if (!filePath) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  if (existsSync(filePath) && statSync(filePath).isDirectory()) filePath = join(filePath, 'index.html');
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
    return;
  }

  response.writeHead(200, {
    'Content-Type': mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`S-Center prototype: http://localhost:${port}/`);
});
