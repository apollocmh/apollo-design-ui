/** Drive real visibility before whole-page captures; module failures must fail the gate. */
export async function materializeDemos(page) {
  await page.locator('.page-loading').waitFor({ state: 'detached', timeout: 30_000 });
  const demos = page.locator('.demo-renderer');
  for (const demo of await demos.all()) {
    await demo.scrollIntoViewIfNeeded();
    await demo.locator('.demo-renderer-loading').waitFor({ state: 'detached', timeout: 30_000 });
    if (await demo.locator('.demo-renderer-error').count()) {
      throw new Error(`Demo failed to load: ${await demo.getAttribute('data-demo')}`);
    }
  }
  const frames = page.locator('iframe.demo-frame');
  for (const frame of await frames.all()) {
    await frame.scrollIntoViewIfNeeded();
    const demo = frame.contentFrame().locator('.demo-renderer');
    await demo.waitFor({ state: 'attached', timeout: 30_000 });
    await demo.scrollIntoViewIfNeeded();
    await demo.locator('.demo-renderer-loading').waitFor({ state: 'detached', timeout: 30_000 });
    if (await demo.locator('.demo-renderer-error').count()) {
      throw new Error(`Isolated demo failed to load: ${await frame.getAttribute('src')}`);
    }
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForFunction(() => !document.querySelector('.demo-renderer-loading'), undefined, {
    timeout: 30_000,
  });
  return (await demos.count()) + (await frames.count());
}
