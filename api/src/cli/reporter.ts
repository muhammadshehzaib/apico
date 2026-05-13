import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import type { RequestRunResult, RunSummary, RunStatus } from './runner';

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;

const c = {
  reset: useColor ? '\x1b[0m' : '',
  bold: useColor ? '\x1b[1m' : '',
  dim: useColor ? '\x1b[2m' : '',
  red: useColor ? '\x1b[31m' : '',
  green: useColor ? '\x1b[32m' : '',
  yellow: useColor ? '\x1b[33m' : '',
  blue: useColor ? '\x1b[34m' : '',
  cyan: useColor ? '\x1b[36m' : '',
  gray: useColor ? '\x1b[90m' : '',
};

const STATUS_GLYPH: Record<RunStatus, { icon: string; color: string }> = {
  passed: { icon: '✓', color: c.green },
  failed: { icon: '✗', color: c.red },
  errored: { icon: '!', color: c.yellow },
  skipped: { icon: '-', color: c.gray },
};

export const printProgress = (result: RequestRunResult): void => {
  const g = STATUS_GLYPH[result.status];
  const status = result.statusCode !== undefined ? String(result.statusCode) : '---';
  const statusColor =
    result.statusCode === undefined
      ? c.gray
      : result.statusCode >= 200 && result.statusCode < 300
        ? c.green
        : result.statusCode >= 400
          ? c.red
          : c.yellow;
  const duration = result.duration !== undefined ? `${result.duration}ms` : '';
  const method = result.method.padEnd(6);
  const name = result.name.length > 60 ? result.name.slice(0, 57) + '...' : result.name.padEnd(60);

  process.stdout.write(
    `${g.color}${g.icon}${c.reset} ${c.dim}${method}${c.reset} ${name} ${statusColor}${status}${c.reset} ${c.gray}${duration}${c.reset}\n`
  );

  if (result.errorMessage) {
    process.stdout.write(`  ${c.red}└ ${result.errorMessage}${c.reset}\n`);
  }

  for (const test of result.tests) {
    const symbol = test.passed ? `${c.green}✓${c.reset}` : `${c.red}✗${c.reset}`;
    const text = test.passed ? test.name : `${test.name} — ${test.error || 'failed'}`;
    process.stdout.write(`  ${symbol} ${c.dim}${text}${c.reset}\n`);
  }
};

export const printSummary = (summary: RunSummary, collectionName: string): void => {
  const totalSec = (summary.durationMs / 1000).toFixed(2);
  const passColor = summary.failed === 0 && summary.errored === 0 ? c.green : c.red;

  process.stdout.write('\n');
  process.stdout.write(`${c.bold}${collectionName}${c.reset}\n`);
  process.stdout.write(
    `  ${c.green}${summary.passed} passed${c.reset}, ` +
      `${c.red}${summary.failed} failed${c.reset}, ` +
      `${c.yellow}${summary.errored} errored${c.reset}, ` +
      `${c.gray}${summary.skipped} skipped${c.reset}\n`
  );
  if (summary.totalTests > 0) {
    process.stdout.write(
      `  ${c.dim}Test assertions: ${summary.totalTestsPassed}/${summary.totalTests} passed${c.reset}\n`
    );
  }
  process.stdout.write(`  ${c.dim}Completed in ${totalSec}s${c.reset}\n\n`);
  process.stdout.write(
    `${passColor}${summary.failed === 0 && summary.errored === 0 ? '✓ PASS' : '✗ FAIL'}${c.reset}\n`
  );
};

const escapeXml = (s: string): string =>
  s.replace(/[<>&'"]/g, (ch) => {
    switch (ch) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return ch;
    }
  });

export const writeJUnitXml = (summary: RunSummary, collectionName: string, path: string): void => {
  const totalSec = (summary.durationMs / 1000).toFixed(3);

  const failures = summary.results.filter((r) => r.status === 'failed').length;
  const errors = summary.results.filter((r) => r.status === 'errored').length;
  const skipped = summary.results.filter((r) => r.status === 'skipped').length;

  const cases = summary.results
    .map((r) => {
      const caseDuration = r.duration ? (r.duration / 1000).toFixed(3) : '0';
      const classname = r.folderPath.length > 0 ? r.folderPath.join('.') : collectionName;
      const name = `${r.method} ${r.name}`;
      let body = '';

      if (r.status === 'failed') {
        const msg = r.errorMessage || 'Test failed';
        const details = r.tests
          .filter((t) => !t.passed)
          .map((t) => `${t.name}: ${t.error}`)
          .join('\n');
        body = `<failure message="${escapeXml(msg)}">${escapeXml(details || msg)}</failure>`;
      } else if (r.status === 'errored') {
        body = `<error message="${escapeXml(r.errorMessage || 'Errored')}"/>`;
      } else if (r.status === 'skipped') {
        body = `<skipped/>`;
      }

      return `    <testcase classname="${escapeXml(classname)}" name="${escapeXml(name)}" time="${caseDuration}">${body}</testcase>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="${escapeXml(collectionName)}" tests="${summary.total}" failures="${failures}" errors="${errors}" skipped="${skipped}" time="${totalSec}">
  <testsuite name="${escapeXml(collectionName)}" tests="${summary.total}" failures="${failures}" errors="${errors}" skipped="${skipped}" time="${totalSec}">
${cases}
  </testsuite>
</testsuites>
`;

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, xml, 'utf-8');
};
