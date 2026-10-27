import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Avatar, AvatarGroup, genAvatarStyle } from '@apollo-design/ui';
import { build, preview } from 'vite';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { launchBrowser } from '../visual/stabilize.mjs';
import App, { avatarNames } from './fixtures/AvatarThemeHydration.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures'),
  outDir = mkdtempSync(path.join(tmpdir(), 'apollo-avatar-hydration-'));
const checks = [],
  errors = [];
let server, browser;
try {
  for (const [name, render] of [
    ['visible text', () => h(Avatar, null, () => 'Olivia')],
    ['decorative image', () => h(Avatar, { src: 'data:image/svg+xml,%3Csvg/%3E' })],
    ['named image', () => h(Avatar, { src: 'image.png', alt: 'Olivia' })],
    [
      'complete image',
      () =>
        h(
          Avatar,
          { src: 'ignored.png' },
          { image: () => [h('span', 'First'), h('span', 'Tail'), 0] },
        ),
    ],
    [
      'complete icon',
      () => h(Avatar, null, { icon: () => [h('span', 'First'), h('span', 'Tail'), 0] }),
    ],
    [
      'numeric inherited size',
      () => h(AvatarGroup, { size: 48 }, () => h(Avatar, null, () => 'U')),
    ],
    [
      'responsive map',
      () => h(AvatarGroup, { size: { xs: 24, md: 48 } }, () => h(Avatar, null, () => 'U')),
    ],
    [
      'overflow native button',
      () =>
        h(AvatarGroup, { max: { count: 1 } }, () => [
          h(Avatar, null, () => 'A'),
          h(Avatar, null, () => 'B'),
        ]),
    ],
  ]) {
    const html = await renderToString(createSSRApp({ render }));
    assert.ok(html && !html.includes('NaN') && !html.includes('opacity:0'));
    if (name === 'overflow native button') assert.ok(html.includes('<button'));
    if (name === 'decorative image') assert.match(html, /<img[^>]*\salt(?:=""|(?=[\s>]))/);
    checks.push(`Node SSR: ${name}`);
  }
  const markup = await renderToString(createSSRApp(App));
  for (const name of avatarNames) assert.ok(markup.includes(`id="hydrated-${name}"`));
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'avatar-theme-hydration.html') },
    },
  });
  const file = path.join(outDir, 'avatar-theme-hydration.html');
  const html = readFileSync(file, 'utf8');
  assert.ok(html.includes('<div id="app"></div>'));
  writeFileSync(
    file,
    html.replace(
      '<div id="app"></div>',
      `<div id="app">${markup}</div><style>${genAvatarStyle('audit')}</style><script>window.avatarServerRoots=${JSON.stringify(avatarNames)}.map(n=>document.getElementById('hydrated-'+n));window.avatarServerDraft=document.getElementById('hydrated-draft');window.avatarServerDraft.value='typed before hydration';window.avatarServerDraft.focus();window.avatarServerDraft.setSelectionRange(2,5);</script>`,
    ),
  );
  server = await preview({
    root,
    configFile: false,
    logLevel: 'warn',
    build: { outDir },
    preview: { host: '127.0.0.1', port: 0 },
  });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage();
  page.setDefaultTimeout(7000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}avatar-theme-hydration.html`);
  await page.waitForFunction(() => window.avatarHydrated);
  const identity = async () =>
    assert.equal(
      await page.evaluate(
        () =>
          window.avatarServerRoots.every(
            (n, i) =>
              n ===
              document.getElementById(`hydrated-${['main', 'group', 'overflow', 'adjacent'][i]}`),
          ) &&
          window.avatarServerDraft === document.getElementById('hydrated-draft') &&
          window.avatarServerDraft.value === 'typed before hydration' &&
          document.activeElement === window.avatarServerDraft &&
          window.avatarServerDraft.selectionStart === 2 &&
          window.avatarServerDraft.selectionEnd === 5,
      ),
      true,
    );
  await identity();
  assert.deepEqual(
    (await page.evaluate(() => window.avatarHydration.snapshot())).roots,
    avatarNames.map((n) => `hydrated-${n}`),
  );
  checks.push(
    'hydration preserves four roots, pretyped editor, focus/selection and actual public refs',
  );
  for (const stage of [1, 2, 0]) {
    await page.evaluate((stage) => window.avatarHydration.stage(stage), stage);
    await identity();
    const group = page.locator('#hydrated-group');
    assert.equal(
      await group.evaluate((n) => getComputedStyle(n).direction),
      stage === 1 ? 'rtl' : 'ltr',
    );
    assert.equal(await group.locator(stage === 1 ? '.audit-avatar' : '.apollo-avatar').count(), 2);
    assert.equal(await page.locator('#hydrated-adjacent').evaluate((n) => n.offsetWidth), 32);
    checks.push(
      `current theme/config/direction/prefix stage ${stage} preserves identity and adjacent isolation`,
    );
  }
  const member = page.locator('#member-A');
  await member.fill('A draft');
  await member.focus();
  const node = await member.elementHandle();
  await page.evaluate(() => window.avatarHydration.reverse());
  assert.equal(
    await node.evaluate(
      (n) =>
        n === document.getElementById('member-A') &&
        document.activeElement === n &&
        n.value === 'A draft',
    ),
    true,
  );
  checks.push('keyed member reorder preserves actual editor, draft and focus');
  const overflow = page.locator('#hydrated-overflow button');
  await overflow.focus();
  await overflow.press(' ');
  const hidden = page.locator('#hidden-draft');
  await hidden.waitFor({ state: 'visible' });
  await hidden.fill('hidden draft');
  const hiddenNode = await hidden.elementHandle();
  await page.keyboard.press('Escape');
  await hidden.waitFor({ state: 'hidden' });
  await overflow.press('Enter');
  await hidden.waitFor({ state: 'visible' });
  assert.equal(
    await hiddenNode.evaluate(
      (n) => n === document.getElementById('hidden-draft') && n.value === 'hidden draft',
    ),
    true,
  );
  checks.push('native Space/Enter/Escape and destroyOnHidden:false preserve popup business state');
  await page.keyboard.press('Escape');
  const controlled = page.locator('#controlled-group button');
  await page.evaluate(() => window.avatarHydration.control(false));
  await controlled.click();
  assert.equal((await page.evaluate(() => window.avatarHydration.snapshot())).controlled, false);
  assert.deepEqual((await page.evaluate(() => window.avatarHydration.snapshot())).changes, [true]);
  await page.evaluate(() => window.avatarHydration.control(true));
  await controlled.click();
  assert.equal((await page.evaluate(() => window.avatarHydration.snapshot())).controlled, true);
  await page.keyboard.press('Escape');
  assert.equal((await page.evaluate(() => window.avatarHydration.snapshot())).controlled, false);
  checks.push('controlled overflow honors refused and accepted updates exactly once');
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const violations = await page.locator('main').evaluate(async (n) =>
    (await window.axe.run(n)).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((x) => x.failureSummary),
    })),
  );
  assert.deepEqual(violations, []);
  checks.push('actual hydrated document axe');
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.avatarHydration.show(false));
    assert.equal(await page.locator('#hydrated-main').count(), 0);
    assert.equal(await page.locator('.apollo-avatar-group-popover').count(), 0);
    assert.equal((await page.evaluate(() => window.avatarHydration.snapshot())).roots[0], null);
    await page.evaluate(() => window.avatarHydration.show(true));
    assert.equal(await page.locator('#hydrated-draft').inputValue(), '');
  }
  checks.push('three full unmount/remount cycles clear refs and popup ownership');
  assert.deepEqual(errors, []);
  writeFileSync(
    process.env.AVATAR_HYDRATION_EVIDENCE ?? '/tmp/apollo-avatar-hydration.json',
    `${JSON.stringify({ browser: browser.version(), checks, errors }, null, 2)}\n`,
  );
  console.log(`${checks.length} checks, 0 errors`);
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
