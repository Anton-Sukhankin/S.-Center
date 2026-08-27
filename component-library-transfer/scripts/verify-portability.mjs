import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = resolve(packageRoot, 'src');
const checkedExtensions = new Set(['.js', '.css']);
const dependencyPatterns = [
  /(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g,
  /@import\s+['"]([^'"]+)['"]/g,
  /url\(\s*['"]?([^'"\)]+)['"]?\s*\)/g,
];
const failures = [];
let checkedFiles = 0;

function walk(directory) {
  readdirSync(directory, { withFileTypes: true }).forEach(entry => {
    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      walk(absolutePath);
      return;
    }
    if (!checkedExtensions.has(extname(entry.name))) return;
    checkFile(absolutePath);
  });
}

function checkFile(filePath) {
  checkedFiles += 1;
  const source = readFileSync(filePath, 'utf8');
  dependencyPatterns.forEach(pattern => {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(source))) {
      const specifier = match[1].trim();
      if (!specifier.startsWith('.') || specifier.startsWith('data:')) continue;
      const cleanSpecifier = specifier.split(/[?#]/, 1)[0];
      const dependencyPath = resolve(dirname(filePath), cleanSpecifier);
      if (!dependencyPath.startsWith(packageRoot)) {
        failures.push(`${relative(packageRoot, filePath)} escapes package root: ${specifier}`);
      } else if (!existsSync(dependencyPath)) {
        failures.push(`${relative(packageRoot, filePath)} has missing dependency: ${specifier}`);
      }
    }
  });
}

walk(sourceRoot);

if (failures.length > 0) {
  console.error('Portability verification failed:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Portability verification passed: ${checkedFiles} source files checked.`);
}
