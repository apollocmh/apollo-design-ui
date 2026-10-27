import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-button-browser-'));
const results = [],
  errors = [];
const check = (name, actual, expected = true) => {
  let passed = true;
  try {
    assert.deepEqual(actual, expected);
  } catch {
    passed = false;
  }
  results.push({ name, actual, expected, passed });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
};
let server, browser;
try {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'button-contract-audit.html') },
    },
  });
  server = await preview({
    root,
    configFile: false,
    logLevel: 'warn',
    build: { outDir },
    preview: { host: '127.0.0.1', port: 0 },
  });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({ viewport: { width: 1100, height: 1200 } });
  page.setDefaultTimeout(10000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}button-contract-audit.html`);
  await page.waitForFunction(() => Boolean(window.buttonAudit));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const host = page.locator('#audit-button');
  const set = (options) => page.evaluate((options) => window.buttonAudit.set(options), options);
  const snap = () => page.evaluate(() => window.buttonAudit.snapshot());
  const css = (locator, property) =>
    locator.evaluate((n, p) => getComputedStyle(n).getPropertyValue(p).trim(), property);
  const original = await host.elementHandle();
  const label = await host.locator('[data-business-label]').elementHandle();
  const draft = page.getByRole('textbox', { name: 'Button sibling draft' });
  await draft.fill('Stable native draft');
  await draft.focus();
  const draftNode = await draft.elementHandle();
  check('real exposed native root', (await snap()).nativeId, 'audit-button');
  check('Compact exposes its typed native root', (await snap()).compactNativeTag, 'DIV');
  check('Compact is the real published component', (await snap()).compactName, 'ASpaceCompact');
  check(
    'complete default Vue slot',
    (await host.locator('strong,em,.apollo-btn-content>span').count()) >= 2,
  );
  for (const style of [
    'padding-inline:13px',
    [{ paddingInline: '17px' }],
    { paddingInline: '19px' },
    undefined,
  ]) {
    await set({ style });
    check(
      `native style form ${JSON.stringify(style)}`,
      await host.evaluate((n, old) => n === old, original),
    );
  }
  for (const name of ['first', 'second']) {
    await set({
      provider: {
        className: `${name}-provider`,
        shape: 'round',
        color: 'danger',
        variant: 'solid',
        autoInsertSpace: false,
        classNames: { content: `${name}-content` },
        styles: { content: { opacity: 0.8 } },
      },
      source: true,
      tokens: { contentFontSize: 18 },
    });
    check(
      `${name} current Provider class`,
      await host.evaluate((n, name) => n.classList.contains(`${name}-provider`), name),
    );
    check(`${name} owned semantic content`, await host.locator(`.${name}-content`).count(), 1);
    check(
      `${name} stable caller child`,
      await host.locator('[data-business-label]').evaluate((n, old) => n === old, label),
    );
    check(`${name} actual source token`, await css(host, 'font-size'), '18px');
    check(`${name} sibling focus`, await draft.evaluate((n) => document.activeElement === n));
  }
  await set({ provider: undefined, source: false, tokens: {} });
  check(
    'removed Provider class',
    await host.evaluate((n) => !n.classList.contains('second-provider')),
  );
  check('caller state retained through Provider', (await snap()).mounts, 1);
  check('draft retained through Provider', await draft.inputValue(), 'Stable native draft');
  check('draft DOM identity', await draft.evaluate((n, old) => n === old, draftNode));
  await set({ rtl: true });
  check('actual RTL', await css(host, 'direction'), 'rtl');
  await set({ nativeDirection: 'ltr' });
  check('native dir wins', await css(host, 'direction'), 'ltr');
  await set({ nativeDirection: undefined });
  check('native dir removal restores current Provider', await css(host, 'direction'), 'rtl');
  await set({ rtl: false });
  check('current LTR', await css(host, 'direction'), 'ltr');
  for (const compactSize of ['small', 'large', undefined]) {
    await set({ compactSize });
    check(
      `Compact size ${compactSize}`,
      await css(host, 'height'),
      compactSize === 'small' ? '24px' : compactSize === 'large' ? '40px' : '32px',
    );
  }
  await set({ slot: 'plain', label: '确定', props: {} });
  check('continuous Chinese DOM', await host.textContent(), '确定');
  check(
    'actual visual Chinese spacing',
    (await css(host.locator('.apollo-btn-content'), 'letter-spacing')) !== 'normal',
  );
  check(
    'continuous native accessible name',
    await page.getByRole('button', { name: '确定', exact: true }).count(),
    1,
  );
  await set({ label: 'Cancel' });
  check(
    'removed Chinese spacing',
    await host.evaluate((n) => !n.classList.contains('apollo-btn-two-chinese-chars')),
  );
  for (const iconSlot of ['full', 'empty', 'absent', 'full', 'absent']) {
    await set({ iconSlot, props: { icon: 'Fallback' } });
    const icons = host.locator('.apollo-btn-icon');
    check(`current ${iconSlot} icon slot`, await icons.count(), iconSlot === 'empty' ? 0 : 1);
    if (iconSlot !== 'empty')
      check(
        `complete ${iconSlot} icon content`,
        await icons.textContent(),
        iconSlot === 'full' ? 'IconTail0' : 'Fallback',
      );
  }
  for (const slot of ['empty', 'absent', 'full', 'empty', 'full']) {
    await set({ slot, ariaLabel: slot === 'full' ? undefined : 'Current action' });
    check(
      `current ${slot} content host`,
      await host.locator('.apollo-btn-content').count(),
      slot === 'full' ? 1 : 0,
    );
  }
  await set({ props: {}, iconSlot: 'absent', slot: 'plain', label: 'Action' });
  await host.focus();
  await page.keyboard.press('Space');
  check('one native keyboard click', (await snap()).clicks, 1);
  check('one native ancestor click', (await snap()).parents, 1);
  await set({ props: { htmlType: 'submit' } });
  await host.click();
  check('native form submit', (await snap()).submits, 1);
  await set({ props: { htmlType: 'reset' } });
  await host.click();
  check('native form reset', (await snap()).resets, 1);
  check('native reset default value', await draft.inputValue(), 'Initial draft');
  await set({ props: { shape: 'square' } });
  check('effective square corners', await css(host, 'border-radius'), '0px');
  await set({ props: { href: '#target' }, tabindex: -1 });
  check('anchor root and exposed native', (await snap()).nativeTag, 'A');
  check('enabled native anchor tabindex', await host.getAttribute('tabindex'), '-1');
  await set({ props: { href: '#target', disabled: true } });
  check('disabled anchor link semantics', await host.getAttribute('role'), 'link');
  check('disabled anchor href', await host.getAttribute('href'), null);
  check('disabled anchor tabindex', await host.getAttribute('tabindex'), '-1');
  await page.clock.install();
  await set({ props: { href: '#target', loading: { delay: 1000 } }, tabindex: 0 });
  check('pending anchor link semantics', await host.getAttribute('role'), 'link');
  check('pending anchor navigation removed', await host.getAttribute('href'), null);
  check('pending busy exposed', await host.getAttribute('aria-busy'), 'true');
  check('pending indicator absent', await host.locator('.apollo-btn-loading-icon').count(), 0);
  const beforeLoading = await snap();
  const box = await host.boundingBox();
  assert.ok(box);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  check('pending activation blocked', (await snap()).clicks, beforeLoading.clicks);
  check('pending ancestor propagation blocked', (await snap()).parents, beforeLoading.parents);
  await page.clock.fastForward(400);
  await set({ props: { href: '#target', loading: { delay: 1000, icon: 'Changed' } } });
  await page.clock.fastForward(600);
  check(
    'icon replacement keeps original deadline',
    await host.evaluate((n) => n.classList.contains('apollo-btn-loading')),
  );
  check('current delayed icon', await host.locator('.apollo-btn-icon').textContent(), 'Changed');
  await set({ props: { loading: { icon: 0 } } });
  check('explicit loading zero', await host.locator('.apollo-btn-icon').textContent(), '0');
  await set({ props: { loading: { icon: false } } });
  check('intentional empty loading icon', await host.locator('.apollo-btn-icon').count(), 0);
  await set({ props: { loading: true } });
  check(
    'owned loading graphic decoration',
    await host.locator('svg').getAttribute('aria-hidden'),
    'true',
  );
  check(
    'system reduced motion',
    await css(host.locator('.apollo-icon-spin'), 'animation-name'),
    'none',
  );
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await set({ source: true, motion: false });
  check(
    'source motion false pauses glyph',
    await css(host.locator('.apollo-icon-spin'), 'animation-play-state'),
    'paused',
  );
  await set({ motion: true });
  check(
    'current source motion restores glyph',
    await css(host.locator('.apollo-icon-spin'), 'animation-play-state'),
    'running',
  );
  check(
    'default loading indicator has a real animation',
    (await css(host.locator('.apollo-icon-spin'), 'animation-name')) !== 'none',
  );
  await set({ props: { loading: { delay: 1000 } } });
  await set({ visible: false });
  await page.clock.fastForward(1200);
  check('unmount clears nullable native expose', (await snap()).nativeTag, null);
  await set({ visible: true, props: {}, source: false, motion: undefined });
  check(
    'independent remount is not loading',
    await host.evaluate((n) => !n.classList.contains('apollo-btn-loading')),
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const tokenValues = JSON.parse(
    readFileSync(new URL('./fixtures/button-token-values.json', import.meta.url), 'utf8'),
  );
  const normalize = (property, value, fontSize) =>
    page.evaluate(
      ({ property, value, fontSize }) => {
        const node = document.createElement('span');
        node.style.fontSize = fontSize;
        node.style.setProperty(property, String(value));
        document.body.append(node);
        const actual = getComputedStyle(node).getPropertyValue(property).trim();
        node.remove();
        return actual;
      },
      { property, value, fontSize },
    );
  for (const [name, value] of Object.entries(tokenValues)) {
    let props = {},
      target = host,
      property,
      state = 'normal';
    const suffix = name.endsWith('LG') ? 'LG' : name.endsWith('SM') ? 'SM' : '';
    if (suffix) props.size = suffix === 'LG' ? 'large' : 'small';
    if (name === 'fontWeight') property = 'font-weight';
    else if (name === 'iconGap') {
      property = 'gap';
      props.icon = 0;
    } else if (name.startsWith('contentFontSize')) property = 'font-size';
    else if (name.startsWith('contentLineHeight')) property = 'line-height';
    else if (name.startsWith('paddingInline')) property = 'padding-inline-start';
    else if (name.startsWith('paddingBlock')) property = 'padding-block-start';
    else if (name.startsWith('onlyIconSize')) {
      property = 'font-size';
      props.icon = 0;
      target = host.locator('.apollo-btn-icon');
    } else if (name === 'primaryShadow' || name === 'primaryColor') {
      props.type = 'primary';
      property = name.endsWith('Shadow') ? 'box-shadow' : 'color';
    } else if (name === 'dangerShadow' || name === 'dangerColor') {
      props.type = 'primary';
      props.danger = true;
      property = name.endsWith('Shadow') ? 'box-shadow' : 'color';
    } else if (name.endsWith('ShadowColor')) {
      props.color = name.slice(0, -11);
      props.variant = 'solid';
      property = 'box-shadow';
    } else if (name === 'defaultShadow') property = 'box-shadow';
    else if (name === 'solidTextColor') {
      props.color = 'default';
      props.variant = 'solid';
      property = 'color';
    } else if (name === 'groupBorderColor') {
      props.type = 'primary';
      property = 'background-color';
      target = page.locator('.audit-adjacent');
    } else if (name === 'borderColorDisabled') {
      props.color = 'primary';
      props.variant = 'outlined';
      props.disabled = true;
      property = 'border-top-color';
    } else if (name === 'defaultBorderColorDisabled') {
      props.disabled = true;
      property = 'border-top-color';
    } else if (name === 'defaultBgDisabled') {
      props.disabled = true;
      property = 'background-color';
    } else if (name === 'dashedBgDisabled') {
      props.type = 'dashed';
      props.disabled = true;
      property = 'background-color';
    } else if (name.includes('Ghost') || name === 'ghostBg') {
      props.ghost = true;
      property = name.includes('Border')
        ? 'border-top-color'
        : name === 'ghostBg'
          ? 'background-color'
          : 'color';
    } else if (name.startsWith('textText') || name === 'textHoverBg') {
      props.type = 'text';
      property = name.endsWith('Bg') ? 'background-color' : 'color';
      state = name.includes('Active') ? 'active' : name.includes('Hover') ? 'hover' : 'normal';
    } else if (name === 'linkHoverBg') {
      props.type = 'link';
      property = 'background-color';
      state = 'hover';
    } else {
      property = name.endsWith('BorderColor')
        ? 'border-top-color'
        : name.endsWith('Bg')
          ? 'background-color'
          : 'color';
      state = name.includes('Active') ? 'active' : name.includes('Hover') ? 'hover' : 'normal';
    }
    await set({
      source: true,
      tokens: tokenValues,
      props,
      slot: name.startsWith('onlyIconSize') ? 'absent' : 'plain',
      label: 'Token action',
      ariaLabel: 'Token action',
      adjacentSolid: name === 'groupBorderColor',
    });
    await page.mouse.move(0, 0);
    if (state !== 'normal') {
      await host.hover();
      if (state === 'active') await page.mouse.down();
    }
    const actual =
      name === 'groupBorderColor'
        ? await target.evaluate((n) => getComputedStyle(n, '::before').backgroundColor)
        : await css(target, property);
    const unit =
      typeof value === 'number' &&
      ['font-size', 'gap', 'padding-inline-start', 'padding-block-start'].includes(property)
        ? `${value}px`
        : value;
    const expected = await normalize(property, unit, await css(target, 'font-size'));
    check(`consumed token ${name}`, actual, expected);
    if (state === 'active') await page.mouse.up();
  }
  await set({
    source: true,
    tokens: { contentFontSize: 0, paddingInline: 0, paddingBlock: 0, iconGap: 0 },
    props: {},
    slot: 'plain',
    adjacentSolid: false,
  });
  for (const property of ['font-size', 'padding-inline-start', 'padding-block-start', 'gap'])
    check(`token zero ${property}`, await css(host, property), '0px');
  await page.evaluate(() =>
    window.buttonAudit.set({
      tokens: { contentFontSize: NaN, contentFontSizeLG: -1, iconGap: Infinity },
    }),
  );
  check('invalid numeric font falls back', await css(host, 'font-size'), '14px');
  check('invalid numeric gap falls back', await css(host, 'gap'), '8px');
  await set({
    tokens: { contentFontSize: 18 },
    style: { '--apollo-btn-content-font-size': '25px' },
  });
  check('native component variable wins', await css(host, 'font-size'), '25px');
  await set({ style: undefined });
  check('native variable removal restores source', await css(host, 'font-size'), '18px');
  await set({ source: false, tokens: {}, props: {}, ariaLabel: undefined });
  check('source removal restores static font', await css(host, 'font-size'), '14px');
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  for (const mode of ['default', 'dark', 'compact', 'both']) {
    await set({ mode });
    const violations = await page.locator('main').evaluate(async (n) =>
      (await window.axe.run(n)).violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((x) => ({ html: x.html, failure: x.failureSummary })),
      })),
    );
    check(`${mode} actual default axe`, violations, []);
  }
  check('no page or Vue errors', errors, []);
  writeFileSync(
    process.env.BUTTON_BROWSER_EVIDENCE ?? '/tmp/apollo-button-browser.json',
    `${JSON.stringify({ browser: browser.version(), results, errors }, null, 2)}\n`,
  );
  assert.ok(results.every((r) => r.passed));
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
