import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const descriptionsRepo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Source checks never read dist. Published checks reject implementation/style source modules. */
export function descriptionsAssets(source = process.env.DESCRIPTIONS_SOURCE !== '0') {
  const packages = [
    'utils',
    'theme',
    'icons',
    'ui',
    'motion',
    'portal',
    'position',
    'overlay',
    'a11y',
    'virtual-list',
    'form-core',
    'picker',
    'locale',
  ];
  const modules = new Set();
  return {
    source,
    alias: packages.map((name) => ({
      find: new RegExp(`^@apollo-design/${name}$`),
      replacement: path.join(
        descriptionsRepo,
        'packages',
        name,
        source ? 'src/index.ts' : 'dist/index.mjs',
      ),
    })),
    vue: createRequire(import.meta.url).resolve('vue/dist/vue.runtime.esm-bundler.js'),
    entry: source
      ? `import {getCSSVarDeclarations,getDesignToken} from '@apollo-design/theme';import {genAllStyles} from '${path.join(descriptionsRepo, 'packages/ui/src/style/index.ts')}';const sourceStyles=document.createElement('style');sourceStyles.dataset.descriptionsSourceStyles='';sourceStyles.textContent=getCSSVarDeclarations(getDesignToken())+genAllStyles();document.head.append(sourceStyles);`
      : "import '@apollo-design/theme/tokens.css';import '@apollo-design/ui/style.css';",
    plugin: {
      name: 'descriptions-asset-origin',
      moduleParsed(info) {
        if (info.id.startsWith(`${descriptionsRepo}/packages/`)) {
          modules.add(info.id);
          if (source) assert.ok(!/\/dist\//.test(info.id), `Source check loaded dist: ${info.id}`);
        }
        if (!source && /\/packages\/[^/]+\/src\//.test(info.id)) {
          assert.ok(
            info.id.includes('/ui/src/descriptions/demo/'),
            `Published Descriptions checks loaded implementation/style source: ${info.id}`,
          );
        }
      },
    },
    evidence() {
      const paths = [...modules].map((id) => path.relative(descriptionsRepo, id)).sort();
      if (!source) {
        for (const css of ['packages/theme/dist/tokens.css', 'packages/ui/dist/index.css'])
          assert.ok(paths.includes(css), `Published CSS was not loaded: ${css}`);
      }
      return {
        mode: source ? 'source' : 'published',
        javascript: source ? 'packages/*/src' : 'packages/*/dist',
        css: source ? 'source generators' : 'published tokens.css + ui/style.css',
        sourceStyleInjection: source,
        modules: paths,
      };
    },
  };
}
