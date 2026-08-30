import { spawnSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkDocumentation } from './check-docs.mjs';
import { checkDigitalChessboardData } from './check-digital-chessboard-data.mjs';
import { checkScrollContract } from './check-scroll-contract.mjs';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const sourceRoots = [join(projectRoot, 'src'), join(projectRoot, 'scripts'), join(projectRoot, 'tests')];
const standaloneJavaScriptFiles = [join(projectRoot, 'playwright.config.mjs')];

async function collectJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectJavaScriptFiles(path);
    return /\.(?:js|mjs)$/.test(entry.name) ? [path] : [];
  }));
  return files.flat();
}

const files = [
  ...(await Promise.all(sourceRoots.map(collectJavaScriptFiles))).flat(),
  ...standaloneJavaScriptFiles,
].sort();
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
}

console.log(`Проверено JavaScript-файлов: ${files.length}.`);
await checkDigitalChessboardData();
await checkDocumentation();
await checkScrollContract();
