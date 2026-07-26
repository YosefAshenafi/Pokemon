#!/usr/bin/env node
/**
 * Fails if the Android JS bundle crosses a ceiling.
 *
 * The other CI steps cannot see this: a dependency that doubles the bundle
 * typechecks, lints and passes every test. The limit is the measured baseline
 * plus headroom, so it catches a step change - a heavy library added without
 * anyone looking at the cost - rather than complaining about normal growth.
 *
 * Re-measure with `npm run bundle:measure` and move the limit deliberately.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Measured at 5.22 MB on 2026-07-26; ~15% headroom. */
const LIMIT_BYTES = 6 * 1024 * 1024;

const outputDir = mkdtempSync(join(tmpdir(), 'pokedex-bundle-'));

try {
  execFileSync(
    'npx',
    ['expo', 'export', '--platform', 'android', '--output-dir', outputDir, '--clear'],
    { stdio: 'inherit' },
  );

  const bundleDir = join(outputDir, '_expo/static/js/android');
  const bundles = readdirSync(bundleDir).filter((name) => name.endsWith('.hbc'));
  if (bundles.length !== 1) {
    console.error(`Expected exactly one Android bundle, found ${bundles.length}.`);
    process.exit(1);
  }

  const bytes = statSync(join(bundleDir, bundles[0])).size;
  const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;

  if (bytes > LIMIT_BYTES) {
    console.error(
      `Bundle is ${mb(bytes)}, over the ${mb(LIMIT_BYTES)} limit.\n` +
        'Either the addition is worth it - raise the limit in this file and say why ' +
        'in the commit - or it is not.',
    );
    process.exit(1);
  }

  console.log(`Bundle is ${mb(bytes)}, within the ${mb(LIMIT_BYTES)} limit.`);
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}
