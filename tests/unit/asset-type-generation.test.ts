import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../..');

describe('asset type generation check', () => {
  let fixture: string;
  beforeEach(() => {
    fixture = mkdtempSync(resolve(tmpdir(), 'pubg-type-check-'));
    mkdirSync(resolve(fixture, 'scripts'));
    cpSync(
      resolve(root, 'scripts/generate-asset-types.js'),
      resolve(fixture, 'scripts/generate-asset-types.js')
    );
    cpSync(resolve(root, 'src/assets'), resolve(fixture, 'src/assets'), { recursive: true });
    cpSync(resolve(root, 'src/types/assets'), resolve(fixture, 'src/types/assets'), {
      recursive: true,
    });
    cpSync(resolve(root, 'biome.json'), resolve(fixture, 'biome.json'));
    cpSync(resolve(root, '.gitignore'), resolve(fixture, '.gitignore'));
  });
  afterEach(() => rmSync(fixture, { recursive: true, force: true }));

  const check = () =>
    spawnSync(process.execPath, ['scripts/generate-asset-types.js', '--check'], {
      cwd: fixture,
      encoding: 'utf8',
      env: { ...process.env, NODE_PATH: resolve(root, 'node_modules') },
    });

  it('accepts committed output without changing it', () => {
    const path = resolve(fixture, 'src/types/assets/enums.ts');
    const before = readFileSync(path, 'utf8');
    expect(check().status).toBe(0);
    expect(readFileSync(path, 'utf8')).toBe(before);
  });

  it.each(['json', 'generated'])('detects %s drift without rewriting output', (source) => {
    const outputPath = resolve(fixture, 'src/types/assets/items.ts');
    if (source === 'json') {
      const inputPath = resolve(fixture, 'src/assets/dictionaries/item-id.json');
      const data = JSON.parse(readFileSync(inputPath, 'utf8'));
      data.Item_TestFixture_C = 'Fixture';
      writeFileSync(inputPath, JSON.stringify(data));
    } else {
      writeFileSync(outputPath, "export type ItemId = 'manually-edited';\n");
    }
    const before = readFileSync(outputPath, 'utf8');
    const result = check();
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain('items.ts');
    expect(readFileSync(outputPath, 'utf8')).toBe(before);
  });
});
