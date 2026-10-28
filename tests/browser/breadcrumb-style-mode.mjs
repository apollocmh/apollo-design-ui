/** Keep source styles explicit and verify published runs consume both published CSS entries. */
import assert from 'node:assert/strict';
import path from 'node:path';

export function breadcrumbAliases(repo, source) {
  return source
    ? [
        'ui',
        'theme',
        'utils',
        'icons',
        'motion',
        'portal',
        'position',
        'overlay',
        'a11y',
        'virtual-list',
        'form-core',
        'picker',
        'locale',
      ].map((name) => ({
        find: new RegExp(`^@apollo-design/${name}$`),
        replacement: path.join(repo, `packages/${name}/src/index.ts`),
      }))
    : [
        {
          find: /^@apollo-design\/icons$/,
          replacement: path.join(repo, 'packages/icons/dist/index.mjs'),
        },
      ];
}

export function breadcrumbStyleMode(source) {
  const evidence = { source, cssAssets: [], publishedCSS: [], runtimeSources: [] };
  const plugin = {
    name: 'breadcrumb-style-mode',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const entry = source
          ? '<script type="module" src="/BreadcrumbSourceStyles.ts"></script>'
          : '<script type="module">import "@apollo-design/theme/tokens.css";import "@apollo-design/ui/style.css";</script>';
        return html.replace('</head>', `${entry}</head>`);
      },
    },
    generateBundle(_options, bundle) {
      const modules = [...this.getModuleIds()].map((id) => id.replaceAll('\\', '/'));
      evidence.cssAssets = Object.values(bundle)
        .filter((entry) => entry.type === 'asset' && entry.fileName.endsWith('.css'))
        .map((entry) => entry.fileName);
      evidence.publishedCSS = modules.filter((id) =>
        /\/packages\/(theme\/dist\/tokens|ui\/dist\/index)\.css(?:$|\?)/.test(id),
      );
      evidence.runtimeSources = modules.filter(
        (id) => /\/packages\/[^/]+\/src\//.test(id) && !/\/breadcrumb\/demo\//.test(id),
      );
      if (!source) {
        assert.equal(
          evidence.runtimeSources.length,
          0,
          'Published runtime must not use source aliases',
        );
        assert.equal(
          evidence.publishedCSS.length,
          2,
          'Published theme and UI CSS must both be bundled',
        );
        assert.ok(evidence.cssAssets.length > 0, 'Published CSS must be emitted');
        assert.equal(
          modules.some((id) => id.endsWith('/BreadcrumbSourceStyles.ts')),
          false,
          'Published mode must never inject source-generated component styles',
        );
      }
    },
  };
  return { plugin, evidence };
}

export async function assertBreadcrumbStyleMode(page, source) {
  assert.equal(await page.locator('style[data-breadcrumb-source-styles]').count(), source ? 1 : 0);
  assert.equal(
    await page
      .locator('.apollo-breadcrumb ol')
      .first()
      .evaluate((n) => getComputedStyle(n).display),
    'flex',
    'Real Breadcrumb CSS is active',
  );
  if (!source) assert.ok((await page.locator('link[rel="stylesheet"]').count()) > 0);
}
