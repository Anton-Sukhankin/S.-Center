import { spawn } from 'node:child_process';
import { request } from 'node:http';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PORT || 4185);
const url = `http://localhost:${port}/`;
const serverScript = fileURLToPath(new URL('./serve.mjs', import.meta.url));

function isAvailable() {
  return new Promise(resolve => {
    const probe = request(url, { method: 'HEAD', timeout: 500 }, response => {
      response.resume();
      resolve(Boolean(response.statusCode && response.statusCode < 500));
    });
    probe.on('timeout', () => {
      probe.destroy();
      resolve(false);
    });
    probe.on('error', () => resolve(false));
    probe.end();
  });
}

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await isAvailable()) return true;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return false;
}

if (!(await isAvailable())) {
  const server = spawn(process.execPath, [serverScript], {
    detached: true,
    windowsHide: true,
    stdio: 'ignore',
  });
  server.unref();
}

if (!(await waitForServer())) {
  throw new Error(`Не удалось запустить локальный сервер на порту ${port}.`);
}

const browser = spawn('cmd.exe', ['/c', 'start', '', url], {
  detached: true,
  windowsHide: true,
  stdio: 'ignore',
});
browser.unref();
console.log(`Открыт системный браузер: ${url}`);
