/**
 * Reads frontend/src/i18n/translations.ts and writes one file per namespace
 * in frontend/src/i18n/namespaces/
 */
const fs = require('fs');
const path = require('path');

const translationsPath = path.join(__dirname, '../src/i18n/translations.ts');
const namespacesDir = path.join(__dirname, '../src/i18n/namespaces');
const content = fs.readFileSync(translationsPath, 'utf8');

function extractLangBlock(content, langKey) {
  const marker = `  ${langKey}: {`;
  const start = content.indexOf(marker);
  if (start === -1) return null;
  let pos = content.indexOf('{', start);
  let depth = 1;
  const begin = pos;
  pos++;
  while (pos < content.length && depth > 0) {
    const ch = content[pos];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    pos++;
  }
  return content.slice(begin, pos);
}

function extractNamespacesFromLangBlock(block) {
  const namespaces = {};
  let pos = 0;
  while (pos < block.length) {
    const match = block.slice(pos).match(/\n    ([a-zA-Z]+):\s*\{/);
    if (!match) break;
    const nsName = match[1];
    const nsStart = pos + match.index + match[0].length - 1;
    let depth = 1;
    let p = nsStart + 1;
    while (p < block.length && depth > 0) {
      const ch = block[p];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      p++;
    }
    let nsBlock = block.slice(nsStart, p);
    nsBlock = nsBlock.replace(/\/\/[^\n]*\n/g, '').trim();
    namespaces[nsName] = nsBlock;
    pos = p;
  }
  return namespaces;
}

function blockToObjectString(block) {
  const inner = block.slice(1, -1).trim();
  const lines = inner.split('\n').map((l) => l.trim()).filter(Boolean);
  const pairs = lines.map((line) => {
    const colon = line.indexOf(':');
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim().replace(/,$/, '');
    const keyStr = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key) ? key : JSON.stringify(key);
    return `  ${keyStr}: ${value}`;
  });
  return '{\n' + pairs.join(',\n') + '\n}';
}

const sqBlock = extractLangBlock(content, 'sq');
const enBlock = extractLangBlock(content, 'en');
const srBlock = extractLangBlock(content, 'sr');

if (!sqBlock || !enBlock || !srBlock) {
  console.error('Could not find one or more language blocks');
  process.exit(1);
}

const sqNs = extractNamespacesFromLangBlock(sqBlock);
const enNs = extractNamespacesFromLangBlock(enBlock);
const srNs = extractNamespacesFromLangBlock(srBlock);

const allNames = new Set([...Object.keys(sqNs), ...Object.keys(enNs), ...Object.keys(srNs)]);

if (!fs.existsSync(namespacesDir)) {
  fs.mkdirSync(namespacesDir, { recursive: true });
}

const header = `import type { Language } from '../types';

export const NAMESPACE: Record<Language, Record<string, string>> = {
  sq: SQ_PLACEHOLDER,
  en: EN_PLACEHOLDER,
  sr: SR_PLACEHOLDER,
};
`;

for (const name of allNames) {
  const sq = sqNs[name] ? blockToObjectString(sqNs[name]) : '{}';
  const en = enNs[name] ? blockToObjectString(enNs[name]) : '{}';
  const sr = srNs[name] ? blockToObjectString(srNs[name]) : '{}';
  let fileContent = header
    .replace('NAMESPACE', name)
    .replace('SQ_PLACEHOLDER', sq.replace(/\n/g, '\n  '))
    .replace('EN_PLACEHOLDER', en.replace(/\n/g, '\n  '))
    .replace('SR_PLACEHOLDER', sr.replace(/\n/g, '\n  '));
  const outPath = path.join(namespacesDir, `${name}.ts`);
  fs.writeFileSync(outPath, fileContent, 'utf8');
  console.log('Wrote', outPath);
}

console.log('Done. Namespaces:', [...allNames].join(', '));
