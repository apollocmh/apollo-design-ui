/** Issue #86: one JS easing loop, even when the target has CSS smooth scrolling. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const entry = path.resolve(
  root,
  process.env.SCROLL_ENTRY ?? 'packages/ui/dist/_internal/scroll-to.mjs',
);
const report = path.resolve('docs/audit/evidence/scroll-animation.json');
const bundle = await build({
  entryPoints: [entry],
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'apolloScroll',
  platform: 'browser',
  define: { 'import.meta.env.DEV': 'false' },
  alias: { '@apollo-design/utils': path.join(root, 'packages/utils/dist/index.mjs') },
});
const results = [];
const { browser } = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.setContent(
    `<!doctype html><html style="scroll-behavior:smooth"><body style="margin:0;width:1400px;height:2400px"><div id="target" style="width:300px;height:200px;overflow:auto;scroll-behavior:smooth"><div style="width:700px;height:2000px"></div></div></body></html>`,
  );
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  for (const kind of ['window', 'document', 'element']) {
    const result = await page.evaluate(async (kind) => {
      const target = kind === 'element' ? document.getElementById('target') : window;
      const container = kind === 'document' ? document : target;
      const y = () => (target === window ? scrollY : target.scrollTop);
      const x = () => (target === window ? scrollX : target.scrollLeft);
      target.scrollTo({ top: 1000, left: 40, behavior: 'instant' });
      const start = y();
      const samples = [{ y: start, t: 0 }];
      const began = performance.now();
      let ended = false;
      const observe = () => {
        samples.push({ y: y(), t: performance.now() - began });
        if (!ended) requestAnimationFrame(observe);
      };
      requestAnimationFrame(observe);
      const atComplete = await new Promise((resolve) => {
        window.apolloScroll.scrollTo(0, {
          getContainer: () => container,
          duration: 300,
          callback: () => {
            ended = true;
            resolve({ y: y(), x: x(), t: performance.now() - began });
          },
        });
      });
      await new Promise((resolve) => requestAnimationFrame(resolve));
      target.scrollTo({ top: 1000, left: 40, behavior: 'instant' });
      let immediateCalls = 0;
      window.apolloScroll.scrollTo(0, {
        getContainer: () => container,
        duration: 0,
        callback: () => {
          immediateCalls += 1;
        },
      });
      const immediate = { y: y(), x: x(), calls: immediateCalls };
      target.scrollTo({ top: 1000, left: 40, behavior: 'instant' });
      let cancelledCalls = 0;
      const cancel = window.apolloScroll.scrollTo(0, {
        getContainer: () => container,
        duration: 300,
        callback: () => {
          cancelledCalls += 1;
        },
      });
      await new Promise((resolve) => requestAnimationFrame(resolve));
      cancel();
      const stopped = y();
      await new Promise((resolve) => setTimeout(resolve, 400));
      return {
        kind,
        behavior: getComputedStyle(kind === 'element' ? target : document.documentElement)
          .scrollBehavior,
        start,
        samples,
        atComplete,
        immediate,
        cancelled: { stopped, final: y(), calls: cancelledCalls },
      };
    }, kind);
    results.push(result);
    assert.equal(result.behavior, 'smooth', `${kind}: CSS smooth boundary is exercised`);
    assert.equal(result.start, 1000);
    assert.equal(
      result.atComplete.y,
      0,
      `${kind}: animation reaches zero before its completion callback`,
    );
    assert.equal(result.atComplete.x, 40, `${kind}: horizontal position is preserved`);
    assert.ok(
      result.samples.some((sample) => sample.y > 0 && sample.y < result.start),
      `${kind}: real intermediate frames`,
    );
    assert.ok(
      result.samples.every(
        (sample, index) => index === 0 || sample.y <= result.samples[index - 1].y,
      ),
      `${kind}: monotonic motion`,
    );
    assert.deepEqual(
      result.immediate,
      { y: 0, x: 40, calls: 1 },
      `${kind}: duration zero is synchronously immediate`,
    );
    assert.deepEqual(
      result.cancelled,
      { stopped: result.cancelled.stopped, final: result.cancelled.stopped, calls: 0 },
      `${kind}: cancellation stops all animation`,
    );
  }
  console.log(
    'PASS Issue #86 scroll animation: Window, Document and Element, CSS smooth, immediate and cancellation',
  );
} finally {
  fs.mkdirSync(path.dirname(report), { recursive: true });
  fs.writeFileSync(report, `${JSON.stringify({ entry, results }, null, 2)}\n`);
  await browser.close();
}
