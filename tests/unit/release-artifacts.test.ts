import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../..');
const browserHarness = readFileSync(resolve(root, 'browser-test.html'), 'utf8');
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
  files: string[];
};

describe('v2 release artifacts', () => {
  it('loads public v2 exports from the package-root browser artifact', () => {
    expect(browserHarness).toContain(
      "const { AssetCatalog, PubgClient } = await import('./dist/index.js');"
    );
    expect(browserHarness).not.toContain('./dist/utils/assets.js');
    expect(browserHarness).not.toContain('./dist/api/client.js');
    expect(browserHarness).not.toContain('AssetManager');
  });

  it('ships the migration guide with the npm package', () => {
    expect(packageJson.files).toContain('MIGRATION.md');
  });
});
