import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = fileURLToPath(new URL('../', import.meta.url));
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 4173);
const CONTENT_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.json': 'application/json',
};

async function serveStaticFile(request, response) {
  try {
    const requestPath = decodeURIComponent(
      new URL(request.url, 'http://localhost').pathname,
    );
    const relativePath = requestPath === '/' ? '/index.html' : requestPath;
    const filePath = path.resolve(PROJECT_ROOT, '.' + relativePath);

    if (!filePath.startsWith(PROJECT_ROOT)) {
      response.writeHead(403);
      response.end();
      return;
    }

    const content = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': CONTENT_TYPES[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(content);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
}

const server = http.createServer(serveStaticFile);
server.listen(PORT, HOST, () => {
  const address = server.address();
  console.log(`Meowdoku: http://${HOST}:${address.port}`);
  // Let automated tests wait for readiness without sleeps or a shared fixed port.
  process.send?.({ port: address.port });
});
