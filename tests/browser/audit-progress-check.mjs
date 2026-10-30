/** Actual progress-page assertions, shared by the batch check and a focused workflow smoke. */
import assert from 'node:assert/strict';
import path from 'node:path';
import { readAudit, summarizeAudit } from '../../registry/tools/audit-workflow.mjs';

export async function checkAuditProgress(page, base, locales = ['zh-CN', 'en-US']) {
  const doc = readAudit(path.resolve(import.meta.dirname, '../..'));
  const summary = summarizeAudit(doc);
  const titles = {
    'zh-CN': 'Vue 原生化：架构整改与最终验收',
    'en-US': 'Vue native architecture and final acceptance',
  };
  const results = [];
  await page.goto(`${base}/guide/audit-progress`);
  for (const locale of locales) {
    await page.evaluate((value) => localStorage.setItem('apollo-site-locale', value), locale);
    const response = await page.goto(`${base}/guide/audit-progress`);
    assert.equal(response.status(), 200);
    const main = page.locator('main');
    await main.getByRole('heading', { name: titles[locale], exact: true }).waitFor();
    assert.equal(
      await main
        .getByRole('heading', { name: titles[locale === 'zh-CN' ? 'en-US' : 'zh-CN'], exact: true })
        .count(),
      0,
    );
    const rows = main.locator('table').first().getByRole('row');
    for (const [index, key] of ['components', 'foundations'].entries()) {
      const cells = await rows
        .nth(index + 1)
        .getByRole('cell')
        .allTextContents();
      const value = summary[key];
      assert.deepEqual(
        cells.slice(1).map((text) => text.trim()),
        [
          `${value.architectureDone}/${value.total}`,
          String(value.historicalAccepted),
          String(value.finalAccepted),
        ],
      );
    }
    assert.equal(await main.locator('table').last().getByRole('row').count(), doc.tasks.length + 1);
    const content = await main.textContent();
    assert.ok(content.includes(`${summary.activeTasks.length}/${doc.dispatch.maxParallel}`));
    assert.ok(content.includes(doc.finalAcceptance.status));
    assert.ok(
      content.includes(
        locale === 'zh-CN'
          ? doc.dispatch.status === 'paused'
            ? '暂停'
            : '进行中'
          : doc.dispatch.status,
      ),
    );
    results.push({
      locale,
      heading: titles[locale],
      components: summary.components,
      foundations: summary.foundations,
      dispatch: doc.dispatch.status,
      finalAcceptance: doc.finalAcceptance.status,
    });
  }
  return results;
}
