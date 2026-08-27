import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, isAbsolute, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number.parseInt(process.argv[2] || process.env.PORT || '4175', 10);
const mimeTypes = Object.freeze({
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.svg': 'image/svg+xml'
});

createServer((request, response) => {
    const requestPath = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
    const relativePath = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
    const resolvedPath = resolve(root, normalize(relativePath));
    const pathFromRoot = relative(root, resolvedPath);

    if (pathFromRoot.startsWith('..') || isAbsolute(pathFromRoot)) {
        response.writeHead(403).end('Forbidden');
        return;
    }

    const filePath = existsSync(resolvedPath) && statSync(resolvedPath).isDirectory()
        ? join(resolvedPath, 'index.html')
        : resolvedPath;

    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
        response.writeHead(404).end('Not found');
        return;
    }

    response.writeHead(200, {
        'Content-Type': mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store'
    });
    createReadStream(filePath).pipe(response);
}).listen(port, '127.0.0.1', () => {
    console.log(`Digital chessboard transfer package: http://127.0.0.1:${port}/`);
});
