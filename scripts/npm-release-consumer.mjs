/** Run only in a clean consumer installed from the public npm registry. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getDesignToken } from '@apollo-design/theme';
import { Button, ConfigProvider, Input } from '@apollo-design/ui';
import DeepButton from '@apollo-design/ui/button';
import { ApolloResolver } from '@apollo-design/ui-resolver';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';

const version = process.argv[2];
assert.equal(Button, DeepButton);
assert.equal(typeof getDesignToken(), 'object');
const html = await renderToString(
  createSSRApp({
    render: () =>
      h(ConfigProvider, null, {
        default: () => [
          h(Button, { type: 'primary' }, () => 'npm release verified'),
          h(Input, { value: version }),
        ],
      }),
  }),
);
assert.ok(html.includes('npm release verified'));
assert.ok(html.includes('apollo-btn-primary'));
assert.ok(html.includes(`value="${version}"`));
for (const name of [
  '@apollo-design/theme/tokens.css',
  '@apollo-design/theme/presets/material3.css',
  '@apollo-design/ui/style.css',
  '@apollo-design/ui/button/style.css',
])
  assert.ok(fs.statSync(new URL(import.meta.resolve(name))).size > 0, name);
assert.equal((await ApolloResolver().resolve('AButton')).from, '@apollo-design/ui/button');
const lock = JSON.parse(fs.readFileSync('package-lock.json'));
const packages = Object.entries(lock.packages).filter(([name]) =>
  name.startsWith('node_modules/@apollo-design/'),
);
assert.ok(packages.length >= 14, 'All public runtime packages and resolver must install');
for (const [name, pkg] of packages) {
  assert.equal(pkg.version, version, name);
  assert.ok(pkg.resolved.startsWith('https://registry.npmjs.org/'), name);
}
console.log('PASS npm consumer: exact versions, root/deep exports, Vue SSR, CSS and resolver');
