/** Issue #86: real interactions and responsive surfaces for the feedback Demo group. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import sharp from 'sharp';
import { launchBrowser } from '../../../tests/visual/stabilize.mjs';

const base = (process.env.DOCS_URL ?? 'http://127.0.0.1:4174/apollo-design-ui').replace(/\/$/, '');
const evidence =
  process.env.FEEDBACK_DEMOS_EVIDENCE ?? '/tmp/apollo-issue86-feedback-regression.json';
const selectedCases = new Set((process.env.FEEDBACK_CASES ?? '').split(',').filter(Boolean));
const wants = (name) => selectedCases.size === 0 || selectedCases.has(name);
const results = [];
const errors = [];
let notificationProgress = null;
const { browser } = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 440, height: 900 }, locale: 'zh-CN' });
  page.setDefaultTimeout(10000);
  page.on('pageerror', (error) => errors.push(error.message));
  let bootstrapped = false;
  async function go(component, demo, theme = 'light') {
    const route = `/components/${component}/demo/${demo}?theme=${theme}&preset=default&lang=zh-CN`;
    if (!bootstrapped) {
      await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.locator('.standalone-body .demo-renderer').waitFor();
      bootstrapped = true;
    } else {
      await page.evaluate(
        async (next) =>
          document.querySelector('#app').__vue_app__.config.globalProperties.$router.push(next),
        route,
      );
    }
    await page.waitForFunction(
      (id) =>
        document.querySelector('.demo-renderer')?.dataset.demo === id &&
        !document.querySelector('.demo-renderer-loading'),
      `${component}-${demo}`,
    );
    assert.equal(await page.locator('.demo-renderer-error,.demo-error').count(), 0);
  }
  async function noOverflow(label) {
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
      label,
    );
  }
  if (wants('result')) {
    for (const theme of ['light', 'dark']) {
      for (const width of [390, 300]) {
        await page.setViewportSize({ width, height: 900 });
        await go('result', 'success', theme);
        const first = await page
          .getByRole('button', { name: 'Go Console', exact: true })
          .boundingBox();
        const next = await page
          .getByRole('button', { name: 'Buy Again', exact: true })
          .boundingBox();
        assert.ok(
          next.y > first.y + 2
            ? next.y - first.y - first.height >= 7.5
            : next.x - first.x - first.width >= 7.5,
        );
        await noOverflow(`Result success ${theme}/${width}`);
        results.push({
          name: 'Result independent actions retain a gap when wrapping',
          theme,
          width,
        });
      }
    }
  }
  if (wants('notification-progress')) {
    await page.setViewportSize({ width: 440, height: 900 });
    await go('notification', 'show-with-progress');
    await page.getByRole('button', { name: 'Pause on hover', exact: true }).click();
    await page.locator('.apollo-notification-notice-progress').waitFor();
    assert.equal(await page.locator('.apollo-notification-notice').count(), 1);
    await page.locator('.apollo-notification-notice-close').click();
    await page.locator('.apollo-notification-notice').waitFor({ state: 'detached' });
    await page.getByRole('button', { name: "Don't pause on hover", exact: true }).click();
    assert.equal(await page.locator('.apollo-notification-notice').count(), 1);
    results.push({ name: 'Both progress buttons invoke notification actions' });
  }
  if (wants('notification-context')) {
    await go('notification', 'hooks');
    await page.getByRole('button', { name: 'topLeft', exact: true }).click();
    await page.getByText('Hello, Apollo Design!', { exact: true }).waitFor();
    results.push({ name: 'Notification content consumes the provided context below its Holder' });
  }
  if (wants('notification-token')) {
    await go('notification', 'component-token');
    const notificationPanel = page.locator('.apollo-notification-notice-pure-panel').last();
    assert.equal(Math.round((await notificationPanel.boundingBox()).width), 320);
    await page.getByRole('button', { name: 'Use default tokens', exact: true }).click();
    assert.equal(Math.round((await notificationPanel.boundingBox()).width), 384);
    await page.getByRole('button', { name: 'Use custom tokens', exact: true }).click();
    assert.equal(Math.round((await notificationPanel.boundingBox()).width), 320);
    results.push({
      name: 'Notification component token Demo applies and removes its actual width',
    });
  }
  if (wants('message-token')) {
    await go('message', 'component-token');
    const messagePanel = page
      .locator('.apollo-message-notice-pure-panel')
      .last()
      .locator('.apollo-message-notice');
    assert.equal(
      await messagePanel.evaluate((node) => getComputedStyle(node).padding),
      '16px 24px',
    );
    await page.getByRole('button', { name: 'Use default tokens', exact: true }).click();
    assert.notEqual(
      await messagePanel.evaluate((node) => getComputedStyle(node).padding),
      '16px 24px',
    );
    results.push({ name: 'Message component token Demo changes its actual padding' });
  }
  if (wants('notification-color')) {
    await go('notification', 'progress-color');
    await page.getByRole('button', { name: 'Show custom progress color', exact: true }).click();
    const progress = page.locator('.apollo-notification-notice-progress');
    await progress.waitFor();
    const progressNode = await progress.elementHandle();
    notificationProgress = {
      before: await progress.evaluate((node) => {
        const notice = node.closest('.apollo-notification-notice');
        return { className: notice.className, opacity: getComputedStyle(notice).opacity };
      }),
    };
    // A visible native <progress> can still belong to the first, almost transparent
    // notification frame. Wait for the real entrance to finish before testing its color.
    await page.waitForFunction((node) => {
      const notice = node.closest('.apollo-notification-notice');
      if (!node.isConnected || /-fade-(appear|enter|leave)(-|\b)/.test(notice.className))
        return false;
      for (let ancestor = node; ancestor; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor);
        if (
          Number(style.opacity) !== 1 ||
          style.visibility !== 'visible' ||
          style.display === 'none' ||
          ancestor
            .getAnimations()
            .some((animation) => animation.pending || animation.playState === 'running')
        )
          return false;
      }
      return node.value > 0;
    }, progressNode);
    const progressStyle = await progress.evaluate((node) => ({
      background: getComputedStyle(node).backgroundImage,
      custom: getComputedStyle(node).getPropertyValue('--apollo-notification-progress-bg'),
      success: getComputedStyle(node).getPropertyValue('--apollo-color-success').trim(),
    }));
    assert.ok(progressStyle.success.length > 0);
    assert.ok(progressStyle.custom.includes(progressStyle.success));
    notificationProgress.settled = await progress.evaluate((node) => {
      const notice = node.closest('.apollo-notification-notice');
      return {
        className: notice.className,
        opacity: getComputedStyle(notice).opacity,
        transform: getComputedStyle(notice).transform,
        rect: node.getBoundingClientRect().toJSON(),
        value: node.value,
        ...Object.fromEntries(
          ['--apollo-notification-progress-bg', '--apollo-color-success'].map((name) => [
            name,
            getComputedStyle(node).getPropertyValue(name),
          ]),
        ),
      };
    });
    const progressImage = await progress.screenshot();
    notificationProgress.image = `${evidence}.notification-progress.png`;
    fs.writeFileSync(notificationProgress.image, progressImage);
    const barPixels = await sharp(progressImage)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const pixelOffset =
      (Math.floor(barPixels.info.height / 2) * barPixels.info.width +
        Math.floor(barPixels.info.width / 4)) *
      barPixels.info.channels;
    const gradientPixel = [...barPixels.data.subarray(pixelOffset, pixelOffset + 3)];
    notificationProgress.gradientPixel = gradientPixel;
    assert.ok(
      gradientPixel[1] > gradientPixel[0] + 20 && gradientPixel[1] > gradientPixel[2] + 20,
      `Expected the visible success gradient, got ${gradientPixel}`,
    );
    progressStyle.gradientPixel = gradientPixel;
    results.push({
      name: 'Notification progress inherits the local success gradient',
      ...progressStyle,
    });
  }
  if (wants('dark-modal')) {
    await page.setViewportSize({ width: 390, height: 900 });
    for (const theme of ['light', 'dark']) {
      await go('modal', 'dark', theme);
      assert.equal(await page.getByRole('dialog').count(), 0);
      await page.getByRole('button', { name: 'Open dark modal', exact: true }).click();
      const slider = page.getByRole('slider', { name: 'Dark modal value', exact: true });
      await slider.waitFor();
      await slider.focus();
      await slider.press('ArrowRight');
      assert.equal(await slider.getAttribute('aria-valuenow'), '31');
      await page.getByRole('switch', { name: 'Disable dark modal slider', exact: true }).click();
      assert.equal(await slider.getAttribute('aria-disabled'), 'true');
      await page.keyboard.press('Escape');
      results.push({
        name: 'Dark modal opens deliberately and its real slider responds to keyboard and switch',
        theme,
      });
    }
  }
  if (wants('tooltip-controls')) {
    await go('tooltip', 'disabled-children');
    const select = page.getByRole('combobox', { name: 'demo select', exact: true });
    assert.equal(await select.isEnabled(), false);
    await page.getByRole('checkbox', { name: 'Disabled', exact: true }).uncheck();
    assert.equal(await select.isEnabled(), true);
    await select.click();
    await page.locator('.apollo-select-item-option[title="bb"]').click();
    assert.equal(await page.locator('.apollo-select-content').innerText(), 'bb');
    results.push({
      name: 'Disabled Tooltip controls consistently follow the checkbox, including Apollo Select',
    });
  }
  if (wants('tooltip-arrow')) {
    await go('tooltip', 'arrow');
    await page.getByRole('combobox', { name: 'arrow mode', exact: true }).click();
    await page.locator('.apollo-select-item-option[title="Hide Arrow"]').click();
    await page.getByRole('button', { name: 'topLeft', exact: true }).hover();
    const shownHint = page
      .locator('.apollo-tooltip')
      .filter({ hasText: 'topLeft' })
      .filter({ visible: true });
    await shownHint.waitFor();
    assert.equal(await shownHint.locator('.apollo-tooltip-arrow').count(), 0);
    results.push({ name: 'Apollo Select changes the actual Tooltip arrow mode' });
  }
  if (wants('watermark')) {
    await go('watermark', 'custom');
    await page
      .getByRole('textbox', { name: 'Watermark content', exact: true })
      .fill('Apollo checked');
    const rotation = page.getByRole('slider', { name: 'Watermark rotation', exact: true });
    await rotation.focus();
    await rotation.press('ArrowRight');
    assert.equal(await rotation.getAttribute('aria-valuenow'), '-21');
    await noOverflow('Responsive Watermark controls');
    results.push({
      name: 'Watermark Apollo input and keyboard slider update the live configuration',
    });
  }
  if (wants('carousel')) {
    await go('carousel', 'basic', 'dark');
    assert.equal(
      await page
        .locator('.slick-dots button')
        .first()
        .evaluate((node) => getComputedStyle(node).backgroundColor),
      'rgb(255, 255, 255)',
    );
    const second = page.getByRole('button', { name: '2', exact: true });
    await second.click();
    await page.waitForFunction(() =>
      document.querySelector('.slick-dots li:nth-child(2)')?.classList.contains('slick-active'),
    );
    await second.click();
    await second.focus();
    assert.equal(
      await second.locator('..').evaluate((node) => getComputedStyle(node).outlineStyle),
      'solid',
    );
    results.push({
      name: 'Carousel progress decoration preserves real active-dot pointer and focus access',
    });
  }
  assert.ok(results.length > 0, 'No feedback cases matched FEEDBACK_CASES');
  assert.deepEqual(errors, []);
} finally {
  fs.writeFileSync(
    evidence,
    `${JSON.stringify({ base, browser: browser.version(), results, errors, notificationProgress }, null, 2)}\n`,
  );
  await browser.close();
}
console.log(`PASS ${results.length} Issue #86 feedback regressions; evidence: ${evidence}`);
