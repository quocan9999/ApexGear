import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import vi from './vi.json';

const SRC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATIC_TRANSLATION_CALL = /\b(?:i18n\.)?t\(\s*(['"`])([^'"`$\n]+)\1/g;

function collectSourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return collectSourceFiles(fullPath);
    }

    if (!/\.(ts|tsx)$/.test(entry.name) || /\.(test|spec)\.(ts|tsx)$/.test(entry.name)) {
      return [];
    }

    return [fullPath];
  });
}

function hasTranslation(resource: unknown, key: string): boolean {
  return key.split('.').reduce<unknown>((current, part) => {
    if (current && typeof current === 'object' && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, resource) !== undefined;
}

describe('customer i18n keys', () => {
  it('defines every static translation key used by the customer app', () => {
    const missingKeys = collectSourceFiles(SRC_DIR).flatMap((filePath) => {
      const source = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(SRC_DIR, filePath).replace(/\\/g, '/');
      const missing: string[] = [];
      let match: RegExpExecArray | null;

      while ((match = STATIC_TRANSLATION_CALL.exec(source))) {
        const key = match[2];
        if (!hasTranslation(vi, key)) {
          missing.push(`${relativePath}: ${key}`);
        }
      }

      return missing;
    });

    expect(missingKeys).toEqual([]);
  });
});
