/** Plain Node consumers of the actual published entry, with no DOM globals. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { getDesignToken, token2CSSVar } from '@apollo-design/theme';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import DeepButton, {
  prepareButtonComponentToken as deepPrepare,
  Button as NamedButton,
} from '../../packages/ui/dist/button/index.mjs';
import {
  Button,
  ConfigProvider,
  genButtonStyle,
  prepareButtonComponentToken,
} from '../../packages/ui/dist/index.mjs';

assert.equal(typeof window, 'undefined');
assert.equal(typeof document, 'undefined');
const results = [];
const check = async (name, fn) => {
  try {
    await fn();
    results.push({ name, passed: true });
  } catch (e) {
    results.push({ name, passed: false, error: e.message });
  }
};
const render = (vnode) => renderToString(createSSRApp({ render: () => vnode }));
await check('legal root and deep published exports keep one component identity', () => {
  assert.equal(Button, DeepButton);
  assert.equal(Button, NamedButton);
  assert.equal(prepareButtonComponentToken, deepPrepare);
  assert.equal(Button.name, 'AButton');
  assert.equal(Object.keys(prepareButtonComponentToken(getDesignToken())).length, 58);
  assert.ok(genButtonStyle('custom').includes('.custom-btn'));
});
await check('owned complete contents retain caller text and semantic ownership', async () => {
  const html = await render(
    h(
      Button,
      { classNames: { content: 'owned' }, styles: { content: { opacity: 0.5 } }, icon: 0 },
      () => [h('strong', { style: { opacity: 0.9 } }, '确定'), h('em', 'Tail'), 0],
    ),
  );
  assert.ok(html.includes('apollo-btn-content owned'));
  assert.ok(html.includes('opacity:0.5'));
  assert.ok(html.includes('<strong style="opacity:0.9;">确定</strong>'));
  assert.ok(html.includes('Tail'));
  assert.ok(!html.includes('确 定'));
});
await check('complete icon slot wins and intentional empty slot hides fallback', async () => {
  const full = await render(
    h(
      Button,
      { icon: 'Fallback' },
      { icon: () => [h('b', 'Icon'), h('i', 'Tail'), 0], default: () => 'Save' },
    ),
  );
  assert.ok(full.includes('Icon') && full.includes('Tail'));
  assert.ok(!full.includes('Fallback'));
  const empty = await render(
    h(Button, { icon: 'Fallback' }, { icon: () => [], default: () => 'Save' }),
  );
  assert.ok(!empty.includes('apollo-btn-icon'));
});
await check('native form and anchor attrs and caller styles survive SSR', async () => {
  const html = await render(
    h(
      Button,
      {
        htmlType: 'submit',
        form: 'native-form',
        name: 'action',
        value: 'save',
        style: [{ paddingInline: '17px' }],
      },
      () => 'Submit',
    ),
  );
  for (const text of [
    'type="submit"',
    'form="native-form"',
    'name="action"',
    'value="save"',
    'padding-inline:17px',
  ])
    assert.ok(html.includes(text), text);
  const link = await render(
    h(Button, { href: '#target', tabindex: -1, target: '_blank', rel: 'noopener' }, () => 'Link'),
  );
  for (const text of ['<a', 'tabindex="-1"', 'href="#target"', 'target="_blank"', 'rel="noopener"'])
    assert.ok(link.includes(text), text);
});
await check('delay requests are busy without scheduling client timers in SSR', async () => {
  let calls = 0;
  const original = globalThis.setTimeout;
  globalThis.setTimeout = (...args) => {
    calls++;
    return original(...args);
  };
  let html;
  try {
    html = await render(h(Button, { loading: { delay: 1000 } }, () => 'Server save'));
  } finally {
    globalThis.setTimeout = original;
  }
  assert.equal(calls, 0);
  assert.ok(html.includes('aria-busy="true"'));
  assert.ok(html.includes('aria-disabled="true"'));
  assert.ok(!html.includes('apollo-btn-loading-icon'));
});
await check('loading links have no navigation even during delayed SSR', async () => {
  const html = await render(h(Button, { href: '#target', loading: { delay: 1000 } }, () => 'Wait'));
  assert.ok(html.includes('<a'));
  assert.ok(html.includes('role="link"'));
  assert.ok(!html.includes('href='));
  assert.ok(html.includes('tabindex="0"'));
});
await check(
  'current Provider/native direction and effective square are server behaviors',
  async () => {
    const html = await render(
      h(
        ConfigProvider,
        {
          direction: 'rtl',
          components: {
            button: {
              shape: 'square',
              variant: 'filled',
              color: 'blue',
              classNames: { content: 'source-content' },
            },
          },
        },
        () => h(Button, null, () => '保存'),
      ),
    );
    for (const text of [
      'apollo-btn-square',
      'apollo-btn-variant-filled',
      'apollo-btn-color-blue',
      'dir="rtl"',
      'source-content',
      '保存',
    ])
      assert.ok(html.includes(text), text);
    assert.ok(!html.includes('保 存'));
  },
);
await check('all58 current source token fields exist in SSR and native variables win', async () => {
  const schema = JSON.parse(
    readFileSync(new URL('../browser/fixtures/button-token-values.json', import.meta.url), 'utf8'),
  );
  const html = await render(
    h(ConfigProvider, { theme: { components: { Button: schema } } }, () =>
      h(Button, { style: { '--apollo-btn-content-font-size': '25px' } }, () => 'Source'),
    ),
  );
  for (const name of Object.keys(schema))
    assert.ok(html.includes(`${token2CSSVar(name, 'apollo-btn')}:`), name);
  assert.ok(html.includes('--apollo-btn-content-font-size:25px'));
  assert.ok(!html.includes('--apollo-btn-content-font-size:18px'));
  for (const text of [
    '--apollo-btn-blue-shadow-color:',
    '--apollo-btn-default-border-color-disabled:',
    '--apollo-btn-group-border-color:',
    '--apollo-btn-solid-text-color:',
  ])
    assert.ok(html.includes(text), text);
  assert.ok(!html.includes('--apollo-image-'));
  assert.ok(!html.includes('--apollo-result-'));
});
writeFileSync(
  process.env.BUTTON_SSR_EVIDENCE ?? '/tmp/apollo-button-ssr.json',
  `${JSON.stringify({ results }, null, 2)}\n`,
);
for (const r of results)
  console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}${r.error ? `: ${r.error}` : ''}`);
assert.ok(results.every((r) => r.passed));
