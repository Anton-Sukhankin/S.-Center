import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, readdir, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = fileURLToPath(new URL('..', import.meta.url));
const docsOnly = process.argv.includes('--docs-only');
const ignoredDirectories = new Set(['.git', 'node_modules', 'dist', 'build', 'storybook-static', 'vendor']);
const markdownLinkPattern = /!?\[[^\]]*\]\(([^)]+)\)/g;
const windowsAbsolutePattern = /^[A-Za-z]:[\\/]/;
const machinePathPattern = /\b[A-Za-z]:[\\/]/;
const ignoredSchemes = ['http://', 'https://', 'mailto:', 'data:', 'app://'];

const packageChecks = [
  {
    label: 's-center-prototype',
    directory: 's-center-prototype',
    script: 'check',
  },
  {
    label: 'digital-chessboard-transfer',
    directory: 'digital-chessboard-transfer',
    script: 'check',
  },
  {
    label: 'component-library-transfer',
    directory: 'component-library-transfer',
    script: 'verify',
  },
];

const runtimePairs = [
  ['digital-chessboard-transfer/src/data/construction-objects-data.js', 's-center-prototype/src/integrations/digital-chessboard/data/construction-objects-data.js'],
  ['digital-chessboard-transfer/src/components/construction-object-selector/construction-object-selector.js', 's-center-prototype/src/integrations/digital-chessboard/components/construction-object-selector.js'],
  ['digital-chessboard-transfer/src/components/construction-object-selector/construction-object-selector.css', 's-center-prototype/src/integrations/digital-chessboard/components/construction-object-selector.css'],
];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function collectMarkdown(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async entry => {
    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) return [];
      return collectMarkdown(join(directory, entry.name));
    }
    return entry.isFile() && entry.name.toLowerCase().endsWith('.md')
      ? [join(directory, entry.name)]
      : [];
  }));
  return nested.flat();
}

function normalizeTarget(raw) {
  let value = raw.trim();
  if (value.startsWith('<') && value.includes('>')) value = value.slice(1, value.indexOf('>'));
  else value = value.split(/\s+/, 1)[0];
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function localTargets(markdown) {
  const targets = [];
  let inFence = false;

  for (const line of markdown.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const searchable = line.replace(/`[^`]*`/g, '');
    for (const match of searchable.matchAll(markdownLinkPattern)) {
      const target = normalizeTarget(match[1]);
      if (!target || target.startsWith('#') || ignoredSchemes.some(scheme => target.startsWith(scheme))) continue;
      targets.push(target.split('#', 1)[0].split('?', 1)[0]);
    }
  }

  return targets;
}

function normalized(path) {
  return resolve(path).toLocaleLowerCase('en-US');
}

async function checkDocumentation() {
  const issues = [];
  const markdownFiles = (await collectMarkdown(workspaceRoot)).sort();
  const targetsByFile = new Map();

  for (const file of markdownFiles) {
    const markdown = await readFile(file, 'utf8');
    const projectPath = relative(workspaceRoot, file);

    if (machinePathPattern.test(markdown)) {
      issues.push(`${projectPath}: содержит машинный абсолютный путь`);
    }

    const resolvedTargets = new Set();
    targetsByFile.set(normalized(file), resolvedTargets);

    for (const target of localTargets(markdown)) {
      if (target.startsWith('file://') || target.startsWith('/') || isAbsolute(target) || windowsAbsolutePattern.test(target)) {
        issues.push(`${projectPath}: непереносимая абсолютная ссылка: ${target}`);
        continue;
      }

      const destination = resolve(dirname(file), target);
      resolvedTargets.add(normalized(destination));
      if (!(await exists(destination))) {
        issues.push(`${projectPath}: отсутствует цель ссылки: ${target}`);
      }
    }
  }

  function requireRoute(sourceRelative, targetRelative) {
    const source = normalized(join(workspaceRoot, sourceRelative));
    const target = normalized(join(workspaceRoot, targetRelative));
    if (!targetsByFile.get(source)?.has(target)) {
      issues.push(`${sourceRelative}: отсутствует обязательный маршрут к ${targetRelative}`);
    }
  }

  requireRoute('README.md', 'AGENTS.md');
  requireRoute('README.md', 'docs/README.md');
  requireRoute('docs/README.md', 'docs/workspace-architecture.md');
  requireRoute('docs/README.md', 's-center-prototype/README.md');
  requireRoute('docs/README.md', 'component-library-transfer/README.md');
  requireRoute('docs/README.md', 'digital-chessboard-transfer/README.md');
  requireRoute('AGENTS.md', 'docs/README.md');
  requireRoute('s-center-prototype/README.md', 's-center-prototype/docs/README.md');
  requireRoute('digital-chessboard-transfer/README.md', 'digital-chessboard-transfer/MIGRATION.md');
  requireRoute('digital-chessboard-transfer/README.md', 'digital-chessboard-transfer/SOURCE_MANIFEST.md');
  requireRoute('component-library-transfer/README.md', 'component-library-transfer/ADAPTATION.md');
  requireRoute('component-library-transfer/README.md', 'component-library-transfer/docs/component-library.md');

  for (const check of packageChecks) {
    for (const required of ['README.md', 'package.json']) {
      const requiredPath = join(workspaceRoot, check.directory, required);
      if (!(await exists(requiredPath))) {
        issues.push(`${check.directory}: отсутствует обязательный ${required}`);
      }
    }
  }

  if (issues.length) {
    throw new Error(`Ошибки документации workspace:\n- ${issues.join('\n- ')}`);
  }

  console.log(`Workspace documentation: ${markdownFiles.length} Markdown-файлов, ссылки и корневые маршруты корректны.`);
}

function runPackageCheck({ label, directory, script }) {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCommand, ['run', script], {
    cwd: join(workspaceRoot, directory),
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: 'pipe',
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${label}: команда npm run ${script} завершилась с кодом ${result.status ?? 'unknown'}`);
  }
}

async function sha256(path) {
  const contents = await readFile(path);
  return createHash('sha256').update(contents).digest('hex');
}

async function checkRuntimeParity() {
  const manifestPath = join(workspaceRoot, 'digital-chessboard-transfer', 'SOURCE_MANIFEST.md');
  const manifest = await readFile(manifestPath, 'utf8');
  const issues = [];

  for (const [sourceRelative, consumerRelative] of runtimePairs) {
    const sourcePath = join(workspaceRoot, ...sourceRelative.split('/'));
    const consumerPath = join(workspaceRoot, ...consumerRelative.split('/'));
    const [sourceHash, consumerHash] = await Promise.all([sha256(sourcePath), sha256(consumerPath)]);

    if (sourceHash !== consumerHash) {
      issues.push(`${sourceRelative} не совпадает с ${consumerRelative}`);
    }
    if (!manifest.includes(sourceHash)) {
      issues.push(`${sourceRelative}: текущий SHA-256 отсутствует в SOURCE_MANIFEST.md`);
    }
  }

  if (issues.length) {
    throw new Error(`Нарушен текущий контракт runtime-снимка:\n- ${issues.join('\n- ')}\nЕсли расхождение намеренное, обновите technical baseline, docs/workspace-architecture.md и эту проверку в той же задаче.`);
  }

  console.log(`Historical data snapshot: ${runtimePairs.length} пар совпадают, SHA-256 зарегистрированы.`);
}

try {
  await checkDocumentation();

  if (!docsOnly) {
    for (const check of packageChecks) runPackageCheck(check);
    await checkRuntimeParity();
  }

  console.log(docsOnly ? 'Проверка документации workspace завершена.' : 'Проверка workspace завершена.');
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
