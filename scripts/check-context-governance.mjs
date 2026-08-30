import { access, readdir, readFile, stat } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = fileURLToPath(new URL('..', import.meta.url));
const registryPath = join(workspaceRoot, 'docs', 'context-governance', 'area-registry.json');
const markdownLinkPattern = /!?\[[^\]]*\]\(([^)]+)\)/g;
const ignoredSchemes = ['http://', 'https://', 'mailto:', 'data:', 'app://'];

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

function localTargets(markdown, source) {
  const targets = new Set();
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
      if (target.startsWith('/') || isAbsolute(target)) continue;
      targets.add(normalized(resolve(dirname(source), target.split('#', 1)[0].split('?', 1)[0])));
    }
  }

  return targets;
}

function validateRelativePath(value, label, issues) {
  if (typeof value !== 'string' || !value.trim()) {
    issues.push(`${label}: ожидается непустой относительный путь`);
    return null;
  }
  if (value.includes('\\')) issues.push(`${label}: используйте переносимые разделители /`);
  if (isAbsolute(value) || /^[A-Za-z]:[\\/]/.test(value)) {
    issues.push(`${label}: абсолютный путь запрещён`);
    return null;
  }
  const destination = resolve(workspaceRoot, value);
  const outside = relative(workspaceRoot, destination);
  if (outside.startsWith(`..${sep}`) || outside === '..' || isAbsolute(outside)) {
    issues.push(`${label}: путь выходит за границу workspace`);
    return null;
  }
  return destination;
}

function isWithin(child, parent) {
  const route = relative(parent, child);
  return route === '' || (!route.startsWith(`..${sep}`) && route !== '..' && !isAbsolute(route));
}

function isDescendant(areaId, expectedAncestorId, areasById) {
  const visited = new Set();
  let current = areasById.get(areaId);
  while (current?.parent) {
    if (visited.has(current.id)) return false;
    visited.add(current.id);
    if (current.parent === expectedAncestorId) return true;
    current = areasById.get(current.parent);
  }
  return false;
}

function resolveAreaForPath(candidatePath, scopes) {
  return scopes
    .filter(scope => isWithin(candidatePath, scope.path))
    .sort((left, right) => right.path.length - left.path.length)[0]?.areaId || null;
}

async function directMarkdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return entries
    .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
    .map(entry => join(directory, entry.name));
}

async function directChildIndexes(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const indexes = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const index = join(directory, entry.name, 'README.md');
    if (await exists(index)) indexes.push(index);
  }
  return indexes;
}

export async function checkContextGovernance() {
  const issues = [];
  let registry;

  try {
    registry = JSON.parse(await readFile(registryPath, 'utf8'));
  } catch (error) {
    throw new Error(`Реестр областей контекста не читается: ${error.message}`);
  }

  if (registry.schemaVersion !== 1) issues.push('area-registry.json: поддерживается schemaVersion 1');
  if (registry.routingStrategy !== 'longest-scope-path') {
    issues.push('area-registry.json: routingStrategy должен быть longest-scope-path');
  }
  if (!Array.isArray(registry.areas) || !registry.areas.length) {
    issues.push('area-registry.json: массив areas обязателен и не должен быть пустым');
  }

  const areas = Array.isArray(registry.areas) ? registry.areas : [];
  const areasById = new Map();
  const indexes = new Map();
  const scopes = [];

  for (const [position, area] of areas.entries()) {
    const prefix = `area[${position}]`;
    if (!area || typeof area !== 'object' || Array.isArray(area)) {
      issues.push(`${prefix}: ожидается объект`);
      continue;
    }
    if (typeof area.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(area.id)) {
      issues.push(`${prefix}: id должен быть стабильным kebab-case идентификатором`);
      continue;
    }
    if (areasById.has(area.id)) issues.push(`${prefix}: дублируется id ${area.id}`);
    areasById.set(area.id, area);

    for (const field of ['title', 'kind', 'maturity']) {
      if (typeof area[field] !== 'string' || !area[field].trim()) issues.push(`${area.id}: поле ${field} обязательно`);
    }
    if (area.parent !== null && typeof area.parent !== 'string') issues.push(`${area.id}: parent должен быть id или null`);
    if (!Array.isArray(area.checks) || !area.checks.length || area.checks.some(check => typeof check !== 'string' || !check.trim())) {
      issues.push(`${area.id}: требуется хотя бы одна команда проверки`);
    }

    const indexPath = validateRelativePath(area.index, `${area.id}.index`, issues);
    if (indexPath) {
      if (indexes.has(normalized(indexPath))) issues.push(`${area.id}: индекс уже принадлежит области ${indexes.get(normalized(indexPath))}`);
      indexes.set(normalized(indexPath), area.id);
      if (!(await exists(indexPath))) issues.push(`${area.id}: индекс не существует: ${area.index}`);
      else if (!(await stat(indexPath)).isFile()) issues.push(`${area.id}: index должен указывать на файл`);
    }

    if (!Array.isArray(area.scopePaths) || !area.scopePaths.length) {
      issues.push(`${area.id}: требуется хотя бы один scopePath`);
    } else {
      for (const [scopePosition, scope] of area.scopePaths.entries()) {
        const scopePath = validateRelativePath(scope, `${area.id}.scopePaths[${scopePosition}]`, issues);
        if (!scopePath) continue;
        if (!(await exists(scopePath))) issues.push(`${area.id}: scopePath не существует: ${scope}`);
        if (scopes.some(item => item.path === normalized(scopePath))) {
          issues.push(`${area.id}: scopePath ${scope} уже зарегистрирован у ${scopes.find(item => item.path === normalized(scopePath)).areaId}`);
        }
        scopes.push({ areaId: area.id, path: normalized(scopePath), source: scope });
      }
    }

    if (area.documentationRoot !== null) {
      const documentationRoot = validateRelativePath(area.documentationRoot, `${area.id}.documentationRoot`, issues);
      if (documentationRoot) {
        if (!(await exists(documentationRoot))) issues.push(`${area.id}: documentationRoot не существует: ${area.documentationRoot}`);
        else if (!(await stat(documentationRoot)).isDirectory()) issues.push(`${area.id}: documentationRoot должен быть каталогом`);
        if (indexPath && normalized(indexPath) !== normalized(join(documentationRoot, 'README.md'))) {
          issues.push(`${area.id}: index должен быть README.md в documentationRoot`);
        }
      }
    }
  }

  for (const area of areasById.values()) {
    if (area.parent !== null && !areasById.has(area.parent)) issues.push(`${area.id}: неизвестный parent ${area.parent}`);
    const visited = new Set([area.id]);
    let current = area;
    while (current?.parent) {
      if (visited.has(current.parent)) {
        issues.push(`${area.id}: цикл в иерархии через ${current.parent}`);
        break;
      }
      visited.add(current.parent);
      current = areasById.get(current.parent);
    }
  }

  for (let leftIndex = 0; leftIndex < scopes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < scopes.length; rightIndex += 1) {
      const left = scopes[leftIndex];
      const right = scopes[rightIndex];
      if (left.areaId === right.areaId) continue;
      if (isWithin(left.path, right.path) && !isDescendant(left.areaId, right.areaId, areasById)) {
        issues.push(`${left.areaId}: вложенный scopePath ${left.source} должен быть дочерним для ${right.areaId}`);
      } else if (isWithin(right.path, left.path) && !isDescendant(right.areaId, left.areaId, areasById)) {
        issues.push(`${right.areaId}: вложенный scopePath ${right.source} должен быть дочерним для ${left.areaId}`);
      }
    }
  }

  for (const scope of scopes) {
    const probePath = join(scope.path, '__context-routing-probe__');
    const resolvedArea = resolveAreaForPath(probePath, scopes);
    if (resolvedArea !== scope.areaId) {
      issues.push(`${scope.areaId}: longest-scope-path направляет ${scope.source} в ${resolvedArea || 'неизвестную область'}`);
    }
  }

  const linksByIndex = new Map();
  for (const area of areasById.values()) {
    const indexPath = validateRelativePath(area.index, `${area.id}.index`, []);
    if (!indexPath || !(await exists(indexPath))) continue;
    const indexMarkdown = await readFile(indexPath, 'utf8');
    const links = localTargets(indexMarkdown, indexPath);
    linksByIndex.set(area.id, links);

    if (area.documentationRoot !== null) {
      if (!/^\*\*(?:Статус|Состояние документа|Статус контекста):\*\*/m.test(indexMarkdown)) {
        issues.push(`${area.index}: локальный индекс должен явно указывать статус области`);
      }
      const documentationRoot = validateRelativePath(area.documentationRoot, `${area.id}.documentationRoot`, []);
      if (!documentationRoot || !(await exists(documentationRoot))) continue;
      for (const document of await directMarkdownFiles(documentationRoot)) {
        if (normalized(document) === normalized(indexPath)) continue;
        if (!links.has(normalized(document))) {
          issues.push(`${area.index}: не зарегистрирован ${relative(documentationRoot, document)}`);
        }
      }
      for (const childIndex of await directChildIndexes(documentationRoot)) {
        if (!links.has(normalized(childIndex))) {
          issues.push(`${area.index}: не зарегистрирован дочерний индекс ${relative(documentationRoot, childIndex)}`);
        }
      }
    }
  }

  for (const area of areasById.values()) {
    if (!area.parent || !areasById.has(area.parent)) continue;
    const parentLinks = linksByIndex.get(area.parent);
    const childIndex = validateRelativePath(area.index, `${area.id}.index`, []);
    if (childIndex && !parentLinks?.has(normalized(childIndex))) {
      issues.push(`${areasById.get(area.parent).index}: отсутствует маршрут к дочерней области ${area.id}`);
    }
  }

  if (issues.length) {
    throw new Error(`Ошибки управления контекстом:\n- ${[...new Set(issues)].join('\n- ')}`);
  }

  console.log(`Context governance: ${areasById.size} областей, иерархия, scope-маршруты и локальные индексы корректны.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  checkContextGovernance().catch(error => {
    console.error(error.message);
    process.exit(1);
  });
}
