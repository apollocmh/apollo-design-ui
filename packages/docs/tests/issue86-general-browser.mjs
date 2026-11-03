/** Issue #86: real Demo controls, independent targets, iframe previews and current-theme colors. */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { launchBrowser } from '../../../tests/visual/stabilize.mjs';

const base = (process.env.DOCS_BASE_URL ?? 'http://127.0.0.1:4175/apollo-design-ui').replace(
  /\/$/,
  '',
);
const reportPath =
  process.env.DOCS_GENERAL_REPORT ?? '/tmp/apollo-issue86-general-interactions.json';
const results = [];
const errors = [];
const { browser } = await launchBrowser();
let page;
async function check(name, action) {
  if (process.env.DOCS_GENERAL_FILTER && !name.includes(process.env.DOCS_GENERAL_FILTER)) return;
  try {
    const detail = await action();
    results.push({ name, status: 'passed', detail });
    console.log(`PASS ${name}`);
  } catch (error) {
    results.push({ name, status: 'failed', error: String(error) });
    console.error(`FAIL ${name}: ${error}`);
  }
}
async function standalone(component, demo, { mode = 'light', preset = 'default' } = {}) {
  await page.goto(`${base}/components/${component}/demo/${demo}?theme=${mode}&preset=${preset}`, {
    waitUntil: 'domcontentloaded',
  });
  const root = page.locator('.demo-renderer');
  await root.waitFor();
  await root.locator('.demo-renderer-loading,.demo-renderer-error').waitFor({ state: 'hidden' });
  return root;
}
async function component(name) {
  await page.goto(`${base}/components/${name}`, { waitUntil: 'domcontentloaded' });
  await page.locator('.demo-preview').first().waitFor();
}
async function loadPreview(name) {
  const preview = page.locator(`#demo-${name}`);
  await preview.evaluate((element) =>
    element.scrollIntoView({ behavior: 'instant', block: 'center' }),
  );
  const handle = await preview.locator('iframe').elementHandle();
  assert(handle, `${name} iframe exists`);
  const frame = await handle.contentFrame();
  assert(frame, `${name} frame document exists`);
  await frame.locator('.demo-renderer').waitFor();
  await frame.locator('.demo-renderer-loading,.demo-renderer-error').waitFor({ state: 'hidden' });
  return { preview, frame };
}
async function floatStability() {
  const samples = await page.evaluate(async () => {
    const seen = { basic: false, group: false };
    const zeros = { basic: 0, group: 0 };
    const maximum = { basic: 0, group: 0 };
    let frames = 0;
    let readyAt = null;
    const start = performance.now();
    return new Promise((resolve) => {
      const sample = () => {
        frames++;
        for (const name of ['basic', 'group']) {
          const document = window.document.querySelector(`#demo-${name} iframe`)?.contentDocument;
          const count = document?.querySelectorAll('.apollo-float-btn').length ?? 0;
          maximum[name] = Math.max(maximum[name], count);
          if (count > 0) seen[name] = true;
          else if (seen[name]) zeros[name]++;
        }
        if (seen.basic && seen.group && readyAt === null) readyAt = performance.now();
        if (
          performance.now() - start < 30000 &&
          (readyAt === null || performance.now() - readyAt < 1800)
        )
          requestAnimationFrame(sample);
        else resolve({ seen, zeros, maximum, frames });
      };
      sample();
    });
  });
  assert(
    samples.seen.basic && samples.seen.group,
    `both previews finish loading: ${JSON.stringify(samples)}`,
  );
  assert.equal(samples.zeros.basic, 0, 'basic remains present after appearing');
  assert.equal(samples.zeros.group, 0, 'group remains present after appearing');
  assert.equal(samples.maximum.basic, 1);
  assert.equal(samples.maximum.group, 7);
  return samples;
}

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', (error) => errors.push(error.message));

  await check('Divider uses Apollo controls and live title/token state', async () => {
    let root = await standalone('divider', 'with-text');
    const draft = root.getByRole('textbox', { name: 'Divider title draft' });
    await draft.fill('Current heading');
    await root.getByRole('checkbox', { name: 'Plain title', exact: true }).check();
    assert.equal(await draft.inputValue(), 'Current heading');
    await root.getByRole('checkbox', { name: 'Show title', exact: true }).uncheck();
    assert.equal(await draft.count(), 0);
    root = await standalone('divider', 'component-token');
    const slider = root.getByRole('slider', { name: 'Divider text padding' });
    await slider.focus();
    await slider.press('End');
    assert.equal(await slider.getAttribute('aria-valuenow'), '40');
    await root.getByRole('button', { name: 'Reset Divider theme' }).click();
    assert.equal(await slider.getAttribute('aria-valuenow'), '16');
  });

  await check(
    'Grid separates rows, distinguishes adjacent columns and keeps zero gutter',
    async () => {
      const root = await standalone('grid', 'basic');
      const geometry = await root.locator('.apollo-row').evaluateAll((rows) =>
        rows.map((row) => {
          const rect = row.getBoundingClientRect();
          return { top: rect.top, bottom: rect.bottom };
        }),
      );
      for (let i = 1; i < geometry.length; i++)
        assert(geometry[i].top - geometry[i - 1].bottom >= 15);
      const colors = await root
        .locator('.apollo-row')
        .nth(1)
        .locator('.apollo-col > div')
        .evaluateAll((elements) =>
          elements.map((element) => getComputedStyle(element).backgroundColor),
        );
      assert.notEqual(colors[0], colors[1]);
      const gutter = await root
        .locator('.apollo-col')
        .first()
        .evaluate((element) => getComputedStyle(element).paddingInlineStart);
      assert.equal(gutter, '0px');
      return { geometry, colors, gutter };
    },
  );

  await check(
    'Affix previews keep fixed buttons and scrolling inside their own iframe',
    async () => {
      await component('affix');
      assert.equal(await page.locator('.demo-preview iframe').count(), 5);
      const measured = [];
      for (const name of ['basic', 'offset-bottom', 'on-change', 'update-position']) {
        const { frame } = await loadPreview(name);
        await frame.evaluate(() => window.scrollTo({ top: 220, behavior: 'instant' }));
        await frame.waitForFunction(() => scrollY > 100);
        const fixed = await frame.locator('.apollo-affix').count();
        assert(fixed > 0, `${name} affixes within its frame`);
        if (name === 'update-position')
          await frame.getByRole('button', { name: '手动重新测量' }).click();
        measured.push({ name, fixed, scrollY: await frame.evaluate(() => scrollY) });
      }
      const { frame } = await loadPreview('target');
      const scroller = frame.locator('[aria-label="Affix scroll container"]');
      await scroller.evaluate((element) => {
        element.scrollTop = 220;
        element.dispatchEvent(new Event('scroll'));
      });
      await frame.waitForFunction(() => !!document.querySelector('.apollo-affix'));
      assert.equal(
        await page.locator('.apollo-affix').count(),
        0,
        'fixed nodes never leak into the documentation',
      );
      return measured;
    },
  );

  await check('Anchor targets belong to each Demo and scroll their own container', async () => {
    await component('anchor');
    for (const name of [
      'basic',
      'onChange',
      'target-offset',
      'target-offset-per-link',
      'horizontal',
      'replace',
    ]) {
      const preview = page.locator(`#demo-${name}`);
      await preview.evaluate((element) =>
        element.scrollIntoView({ behavior: 'instant', block: 'center' }),
      );
      const root = preview.locator('.demo-renderer');
      await root
        .locator('.demo-renderer-loading,.demo-renderer-error')
        .waitFor({ state: 'hidden' });
      const link = root.locator('.apollo-anchor-link-title').nth(1);
      const hash = await link.getAttribute('href');
      assert(hash);
      assert.equal(await root.locator(`[id="${hash.slice(1)}"]`).count(), 1);
      const scroller = root.locator('[aria-label="Anchor scroll content"]');
      const outer = await page.evaluate(() => window.scrollY);
      const historyLength = await page.evaluate(() => window.history.length);
      await link.click();
      await scroller.evaluate(
        (element) =>
          new Promise((resolve, reject) => {
            const started = performance.now();
            const read = () => {
              if (element.scrollTop > 70) resolve(element.scrollTop);
              else if (performance.now() - started > 1500)
                reject(new Error('local scroll did not advance'));
              else requestAnimationFrame(read);
            };
            read();
          }),
      );
      assert(Math.abs((await page.evaluate(() => window.scrollY)) - outer) < 3, name);
      if (name === 'replace')
        assert.equal(await page.evaluate(() => history.length), historyLength);
    }
    const duplicates = await page.locator('[id^="anchor-"]').evaluateAll((elements) => {
      const ids = elements.map((element) => element.id);
      return ids.filter((id, index) => ids.indexOf(id) !== index);
    });
    assert.deepEqual(duplicates, []);
  });

  await check(
    'Tag creation keeps keyboard focus through the Apollo Input/Button refs',
    async () => {
      const root = await standalone('tag', 'control');
      await root.getByRole('button', { name: 'New Tag' }).click();
      const input = root.getByRole('textbox', { name: 'New tag name' });
      assert(await input.evaluate((element) => element === document.activeElement));
      await input.fill('Keyboard tag');
      await input.press('Enter');
      assert(await root.locator('.apollo-tag').filter({ hasText: 'Keyboard tag' }).count());
      assert(
        await root
          .getByRole('button', { name: 'New Tag' })
          .evaluate((element) => element === document.activeElement),
      );
    },
  );

  await check('Typography controls update conditional content and live title spacing', async () => {
    let root = await standalone('typography', 'editable');
    await root.getByRole('button', { name: 'Update editable text' }).click();
    await root.getByRole('button', { name: 'Toggle editable content' }).click();
    assert(
      (await root.locator('[data-conditional-typography]').innerText()).includes(
        'Current template text 1',
      ),
    );
    root = await standalone('typography', 'component-token');
    const title = root.locator('[data-spacing-title]');
    const before = await title.evaluate((element) => getComputedStyle(element).marginTop);
    await root.getByRole('button', { name: 'Cycle title spacing' }).click();
    const after = await title.evaluate((element) => getComputedStyle(element).marginTop);
    assert.notEqual(before, after);
    await root.getByRole('button', { name: 'Cycle title spacing' }).click();
    assert.equal(await title.evaluate((element) => getComputedStyle(element).marginTop), '0px');
    return { before, after };
  });

  for (const mode of ['light', 'dark']) {
    for (const preset of ['default', 'mono', 'material3']) {
      await check(`Menu Alias colors and selection: ${preset}/${mode}`, async () => {
        const root = await standalone('menu', 'inline', { mode, preset });
        const menu = root.locator('.apollo-menu-root');
        const colors = await menu.evaluate((element) => {
          const style = getComputedStyle(element);
          const probe = document.createElement('i');
          element.appendChild(probe);
          const normalize = (value) => {
            probe.style.color = value;
            return getComputedStyle(probe).color;
          };
          const expectedBg = normalize(style.getPropertyValue('--apollo-color-bg-container'));
          const expectedPrimary = normalize(style.getPropertyValue('--apollo-color-primary'));
          const background = style.backgroundColor;
          const selected = getComputedStyle(
            element.querySelector('.apollo-menu-item-selected'),
          ).color;
          probe.remove();
          return { expectedBg, expectedPrimary, background, selected };
        });
        assert.equal(colors.background, colors.expectedBg);
        assert.equal(colors.selected, colors.expectedPrimary);
        const target = root.getByRole('menuitem', { name: 'Option 2', exact: true });
        await target.click();
        assert((await target.getAttribute('class')).includes('selected'));
        return colors;
      });
    }
  }

  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    await check(`Layout iframe, Mac window and sticky header at ${width}px`, async () => {
      await component('layout');
      assert.equal(await page.locator('.demo-preview iframe').count(), 11);
      const dots = await page
        .locator('.demo-viewport')
        .first()
        .locator('.demo-viewport-dots i')
        .evaluateAll((elements) =>
          elements.map((element) => getComputedStyle(element).backgroundColor),
        );
      assert.equal(new Set(dots).size, 3);
      const { frame } = await loadPreview('fixed');
      await frame.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }));
      const headerTop = await frame
        .locator('.demo-fixed-header')
        .evaluate((element) => element.getBoundingClientRect().top);
      assert(headerTop <= 1);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        true,
      );
      return { dots, headerTop };
    });
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const mode of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: mode });
    await check(`FloatButton fresh load remains stable: ${mode}`, async () => {
      await component('float-button');
      return floatStability();
    });
    await check(`FloatButton refresh remains stable: ${mode}`, async () => {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('.demo-preview').first().waitFor();
      return floatStability();
    });
    await check(`FloatButton entered through navigation remains stable: ${mode}`, async () => {
      await component('button');
      await page
        .locator('a[href$="/components/float-button"]')
        .filter({ visible: true })
        .first()
        .click();
      await page.locator('#demo-basic').waitFor();
      return floatStability();
    });
  }

  for (const reducedMotion of ['no-preference', 'reduce']) {
    await page.emulateMedia({ reducedMotion });
    await check(`FloatButton scroll uses its easing once: ${reducedMotion}`, async () => {
      await standalone('float-button', 'progress-ring');
      await page.evaluate(() => window.scrollTo({ top: 1000, behavior: 'instant' }));
      const samples = await page.evaluate(async () => {
        const samples = [];
        const start = performance.now();
        document.querySelector('.apollo-float-btn').click();
        return new Promise((resolve) => {
          const sample = () => {
            samples.push({ t: performance.now() - start, y: scrollY });
            if (performance.now() - start < 1100) requestAnimationFrame(sample);
            else resolve(samples);
          };
          sample();
        });
      });
      assert.equal(samples.at(-1).y, 0);
      for (let i = 1; i < samples.length; i++) assert(samples[i].y <= samples[i - 1].y);
      if (reducedMotion === 'reduce') assert.equal(samples[0].y, 0);
      else {
        assert(samples.some((sample) => sample.y > 0 && sample.y < 1000));
        assert(
          samples.find((sample) => sample.y === 0).t < 800,
          'no native-smooth tail after JS easing',
        );
      }
      return samples;
    });
  }
  await context.close();
} finally {
  await browser.close();
  writeFileSync(reportPath, JSON.stringify({ base, results, errors }, null, 2));
}
assert.deepEqual(errors, []);
assert(results.length > 0, 'No matching Demo checks ran');
assert(
  results.every((result) => result.status === 'passed'),
  `See ${reportPath}`,
);
console.log(`Issue #86 general Demo checks passed (${results.length}).`);
