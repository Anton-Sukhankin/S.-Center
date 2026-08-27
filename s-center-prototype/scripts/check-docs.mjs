import { access, readdir, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const docsRoot = join(projectRoot, 'docs');
const ignoredDirectories = new Set(['.git', 'node_modules', 'dist', 'build', 'vendor']);
const markdownLinkPattern = /!?\[[^\]]*\]\(([^)]+)\)/g;
const windowsAbsolutePattern = /^[A-Za-z]:[\\/]/;
const ignoredSchemes = ['http://', 'https://', 'mailto:', 'data:', 'app://'];

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

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function normalized(path) {
  return resolve(path).toLocaleLowerCase('en-US');
}

export async function checkDocumentation() {
  const issues = [];
  const markdownFiles = await collectMarkdown(projectRoot);
  const targetsByFile = new Map();

  for (const file of markdownFiles) {
    const markdown = await readFile(file, 'utf8');
    const targets = localTargets(markdown);
    const resolvedTargets = new Set();
    targetsByFile.set(file, resolvedTargets);
    for (const target of targets) {
      if (target.startsWith('file://') || target.startsWith('/') || isAbsolute(target) || windowsAbsolutePattern.test(target)) {
        issues.push(`${relative(projectRoot, file)}: непереносимая абсолютная ссылка: ${target}`);
        continue;
      }
      const destination = resolve(dirname(file), target);
      resolvedTargets.add(normalized(destination));
      if (!(await exists(destination))) {
        issues.push(`${relative(projectRoot, file)}: отсутствует цель ссылки: ${target}`);
      }
    }
  }

  const rootMarkdown = markdownFiles.filter(file => dirname(file) === projectRoot);
  for (const file of rootMarkdown) {
    if (file !== join(projectRoot, 'README.md')) {
      issues.push(`${relative(projectRoot, file)}: в корне прототипа разрешён только README.md`);
    }
  }

  const rootReadme = join(projectRoot, 'README.md');
  if (!targetsByFile.get(rootReadme)?.has(normalized(join(docsRoot, 'README.md')))) {
    issues.push('README.md: отсутствует маршрут к docs/README.md');
  }

  const documentationFiles = markdownFiles.filter(file => file.startsWith(`${docsRoot}${sep}`) || file === join(docsRoot, 'README.md'));
  const documentationDirectories = new Set(documentationFiles.map(dirname));

  for (const directory of documentationDirectories) {
    const index = join(directory, 'README.md');
    if (!(await exists(index))) {
      issues.push(`${relative(projectRoot, directory)}: отсутствует локальный README.md`);
      continue;
    }
    const registered = targetsByFile.get(index) || new Set();
    const directDocuments = documentationFiles.filter(file => dirname(file) === directory && file !== index);
    for (const document of directDocuments) {
      if (!registered.has(normalized(document))) {
        issues.push(`${relative(projectRoot, index)}: не зарегистрирован ${relative(directory, document)}`);
      }
    }

    const childDirectories = new Set();
    for (const document of documentationFiles) {
      const pathFromDirectory = relative(directory, document);
      if (pathFromDirectory.startsWith(`..${sep}`) || pathFromDirectory === '') continue;
      const [firstSegment, ...remaining] = pathFromDirectory.split(sep);
      if (remaining.length) childDirectories.add(join(directory, firstSegment));
    }
    for (const child of childDirectories) {
      const childIndex = join(child, 'README.md');
      if (!(await exists(childIndex))) continue;
      if (!registered.has(normalized(childIndex))) {
        issues.push(`${relative(projectRoot, index)}: не зарегистрирован дочерний индекс ${relative(directory, childIndex)}`);
      }
    }
  }

  if (issues.length) {
    throw new Error(`Ошибки маршрутов документации:\n- ${issues.join('\n- ')}`);
  }

  console.log(`Проверено Markdown-файлов: ${markdownFiles.length}; маршруты документации корректны.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  checkDocumentation().catch(error => {
    console.error(error.message);
    process.exit(1);
  });
}
