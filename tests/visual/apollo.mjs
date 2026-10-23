#!/usr/bin/env node
/** Apollo screenshot regression. The optional upstream harness remains run.mjs. */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import {
  acceptCandidates,
  checkEntry,
  digest,
  duplicateProblems,
  imagePath,
  readManifest,
} from './baseline-store.mjs';
import { buildCases, COMPONENTS } from './matrix.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const BASELINES = path.join(HERE, 'baselines/apollo');
const CANDIDATES = path.join(HERE, 'candidates/apollo');
const ARTIFACTS = path.join(HERE, '.artifacts');
const { values } = parseArgs({
  options: {
    component: { type: 'string' },
    variant: { type: 'string' },
    viewport: { type: 'string' },
    candidate: { type: 'boolean' },
    accept: { type: 'boolean' },
    check: { type: 'boolean' },
    'approved-only': { type: 'boolean' },
    'no-build': { type: 'boolean' },
    'review-note': { type: 'string' },
    help: { type: 'boolean' },
  },
});
if ([values.candidate, values.accept, values.check].filter(Boolean).length > 1) {
  throw new Error('Choose only one of --candidate, --accept or --check');
}
if (values.help) {
  console.log(`Apollo visual regression (default: compare selected cases to approved Apollo baselines)
  --component NAME --variant NAME --viewport mobile|tablet|desktop
  --candidate             Render Vue candidates; never changes approved images
  --accept --review-note  Accept selected candidates after visual review
  --check                 Check selected baseline images and review records without a browser
  --approved-only         Transitional subset; prints the unreviewed count (never full coverage)
  --no-build              Reuse existing Vue test bundle
Upstream comparison: pnpm test:visual:reference -- --mode compare`);
} else {
  await main();
}

async function main() {
  const selected = buildCases({
    component: values.component,
    variants: values.variant ? [values.variant] : undefined,
  }).filter((item) => !values.viewport || item.viewport === values.viewport);
  if (!selected.length) throw new Error('No matching cases');
  const baseline = readManifest(BASELINES);
  const pending = selected.filter((item) => !baseline.entries[item.id]).length;
  const cases = values['approved-only']
    ? selected.filter((item) => baseline.entries[item.id])
    : selected;
  console.log(
    `Apollo selected=${selected.length}, pending review=${pending}, running=${cases.length}`,
  );
  if (!cases.length) throw new Error('No approved cases; generate and review candidates first');
  if (values.accept) {
    const duplicateErrors = duplicateProblems(readManifest(CANDIDATES).entries, COMPONENTS);
    if (duplicateErrors.length) throw new Error(duplicateErrors.join('\n'));
    acceptCandidates(
      CANDIDATES,
      BASELINES,
      cases.map((item) => item.id),
      values['review-note'],
    );
    console.log(`Accepted ${cases.length} Apollo baselines; review records saved`);
    return;
  }
  if (!values.candidate) {
    const problems = cases.flatMap((item) => {
      const reason = checkEntry(BASELINES, item.id, baseline.entries[item.id]);
      return reason ? [`${item.id}: ${reason}`] : [];
    });
    if (problems.length) {
      console.error(problems.slice(0, 10).join('\n'));
      throw new Error(`${problems.length} baseline problems; missing baselines are not passes`);
    }
    const duplicateErrors = duplicateProblems(baseline.entries, COMPONENTS);
    if (duplicateErrors.length) throw new Error(duplicateErrors.join('\n'));
    if (values.check) {
      console.log(`Verified ${cases.length} reviewed image hashes`);
      return;
    }
  }
  // Import browser/build dependencies only for rendering; metadata checks need no React installation.
  const { buildSide } = await import('./build.mjs');
  const { comparePair } = await import('./compare.mjs');
  const { launchBrowser, newStablePage, stabilizePage, screenshotElement } = await import(
    './stabilize.mjs'
  );
  if (!values['no-build']) await buildSide('vue', path.join(ARTIFACTS, 'vue'));
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(ARTIFACTS, `.${pathname}`);
    if (
      !file.startsWith(`${ARTIFACTS}${path.sep}`) ||
      !fs.existsSync(file) ||
      !fs.statSync(file).isFile()
    ) {
      response.writeHead(404);
      response.end();
      return;
    }
    response.setHeader(
      'Content-Type',
      {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.svg': 'image/svg+xml',
      }[path.extname(file)] ?? 'application/octet-stream',
    );
    fs.createReadStream(file).pipe(response);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  let browser;
  const results = [];
  const candidateManifest = { complete: false, entries: {} };
  if (values.candidate) {
    fs.mkdirSync(CANDIDATES, { recursive: true });
    fs.writeFileSync(path.join(CANDIDATES, 'manifest.json'), JSON.stringify(candidateManifest));
  }
  try {
    const launched = await launchBrowser();
    browser = launched.browser;
    const environment = `${process.platform}/${process.arch}/${browser.version()}/${launched.channel}`;
    const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
    const dirty = Boolean(
      execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' }).trim(),
    );
    for (const item of cases) {
      if (!values.candidate && baseline.entries[item.id].environment !== environment) {
        results.push({
          id: item.id,
          verdict: 'FAIL',
          reason: 'baseline-environment-mismatch',
          environment,
        });
        continue;
      }
      const output = imagePath(
        values.candidate ? CANDIDATES : path.join(HERE, 'snapshots/apollo'),
        item.id,
      );
      const { context, page } = await newStablePage(browser, {
        width: item.width,
        height: item.height,
      });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      try {
        const query = new URLSearchParams({
          component: item.component,
          variant: item.variant,
          theme: item.theme,
        });
        await page.goto(`http://127.0.0.1:${server.address().port}/vue/vue.html?${query}`, {
          waitUntil: 'load',
        });
        await page.waitForFunction(() => window.__VISUAL_READY__ === true, null, {
          timeout: 20000,
        });
        await stabilizePage(page);
        fs.mkdirSync(path.dirname(output), { recursive: true });
        await screenshotElement(page, '#stage', output);
        if (errors.length) throw new Error(errors.join(' | '));
        if (values.candidate) {
          candidateManifest.entries[item.id] = {
            sha256: digest(output),
            environment,
            sourceCommit,
            dirty,
            capturedAt: new Date().toISOString(),
          };
          results.push({ id: item.id, verdict: 'CANDIDATE' });
        } else {
          const comparison = await comparePair(
            imagePath(BASELINES, item.id),
            output,
            imagePath(path.join(HERE, 'diff/apollo'), item.id),
          );
          results.push({ id: item.id, ...comparison });
        }
      } catch (error) {
        results.push({
          id: item.id,
          verdict: 'FAIL',
          reason: 'render-error',
          message: error.message,
        });
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
  const failed = results.filter((result) => result.verdict === 'FAIL');
  if (values.candidate) {
    candidateManifest.complete = failed.length === 0 && results.length === cases.length;
    fs.writeFileSync(
      path.join(CANDIDATES, 'manifest.json'),
      `${JSON.stringify(candidateManifest, null, 2)}\n`,
    );
  }
  fs.writeFileSync(
    path.join(HERE, 'report-apollo.json'),
    `${JSON.stringify({ expected: cases.length, pending, results }, null, 2)}\n`,
  );
  for (const result of results)
    console.log(`${result.verdict}: ${result.id} ${result.reason ?? ''}`);
  if (failed.length || results.length !== cases.length)
    throw new Error(`${failed.length} visual failures`);
}
