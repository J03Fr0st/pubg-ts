import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../..');
const browserHarness = readFileSync(resolve(root, 'browser-test.html'), 'utf8');

function runNpm(npmExecPath: string, args: string[]): string {
  try {
    return execFileSync(process.execPath, [npmExecPath, ...args], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const failure = error as { message?: string; stderr?: unknown; stdout?: unknown };
    const output = [failure.stdout, failure.stderr]
      .map((value) => {
        if (typeof value === 'string') {
          return value.trim();
        }
        if (Buffer.isBuffer(value)) {
          return value.toString('utf8').trim();
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');
    const details = output || failure.message || String(error);

    throw new Error(`npm ${args.join(' ')} failed:\n${details}`);
  }
}

describe('v2 release artifacts', () => {
  it('keeps the browser harness truthful and executable', () => {
    expect(browserHarness).not.toMatch(
      /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)['"]\.\/dist\//
    );
    expect(browserHarness).toContain(
      'Package artifacts are CommonJS for Node.js or bundler consumption.'
    );
    expect(browserHarness).toContain('This page tests browser capabilities only.');

    const inlineModule = browserHarness.match(
      /<script\s+type=['"]module['"]>([\s\S]*?)<\/script>/i
    )?.[1];

    expect(inlineModule).toBeDefined();
    expect(() => new Function(inlineModule ?? '')).not.toThrow();
  });

  it('ships the definitive v2 release artifacts', () => {
    expect(existsSync(resolve(root, 'MIGRATION.md'))).toBe(true);

    const npmExecPath = process.env.npm_execpath;
    if (!npmExecPath) {
      throw new Error('npm_execpath is required to inspect the npm package');
    }

    runNpm(npmExecPath, ['run', 'build', '--ignore-scripts']);
    const output = runNpm(npmExecPath, ['pack', '--dry-run', '--json', '--ignore-scripts']);
    const [pack] = JSON.parse(output) as Array<{ files: Array<{ path: string }> }>;
    const files = new Set(pack.files.map(({ path }) => path.split('\\').join('/')));

    for (const requiredArtifact of ['MIGRATION.md', 'dist/index.js', 'dist/index.d.ts']) {
      expect(files.has(requiredArtifact)).toBe(true);
    }
    for (const removedArtifact of [
      'dist/utils/assets.js',
      'dist/utils/health-check.js',
      'dist/utils/monitoring.js',
      'dist/utils/observability.js',
      'dist/api/http-client.js',
      'dist/api/services/telemetry.js',
    ]) {
      expect(files.has(removedArtifact)).toBe(false);
    }
  });
});
