/** Published Skeleton contracts must work in Node without browser globals. */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import {
  ConfigProvider,
  Skeleton,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonImage,
  SkeletonInput,
  SkeletonNode,
} from '../../packages/ui/dist/index.mjs';

assert.equal(typeof window, 'undefined');
assert.equal(typeof document, 'undefined');
const results = [];
const check = async (name, run) => {
  try {
    await run();
    results.push({ name, passed: true });
  } catch (error) {
    results.push({ name, passed: false, error: error.message.split('\n')[0] });
  }
};
const render = (vnode) => renderToString(createSSRApp({ render: () => vnode }));
const variants = [
  ['main', Skeleton],
  ['avatar', SkeletonAvatar],
  ['button', SkeletonButton],
  ['input', SkeletonInput],
  ['image', SkeletonImage],
  ['node', SkeletonNode],
];
for (const [name, Component] of variants) {
  await check(`${name} native SSR root and string style`, async () => {
    const html = await render(
      h(Component, { id: `server-${name}`, 'data-server': name, style: 'padding:13px' }),
    );
    assert.ok(html.includes(`id="server-${name}"`));
    assert.ok(html.includes(`data-server="${name}"`));
    assert.ok(html.includes('padding:13px'));
  });
  await check(`${name} current source tokens before mount`, async () => {
    const html = await render(
      h(
        ConfigProvider,
        {
          theme: {
            components: {
              Skeleton: {
                gradientFromColor: '#123456',
                gradientToColor: '#abcdef',
                titleHeight: 27,
                blockRadius: 9,
                paragraphMarginTop: 31,
                paragraphLiHeight: 19,
              },
            },
          },
        },
        () => h(Component),
      ),
    );
    for (const value of [
      '--apollo-skeleton-gradient-from-color:#123456',
      '--apollo-skeleton-title-height:27px',
      '--apollo-skeleton-block-radius:9px',
      '--apollo-skeleton-paragraph-margin-top:31px',
      '--apollo-skeleton-paragraph-li-height:19px',
    ])
      assert.ok(html.includes(value), value);
  });
}
await check('loading owns busy and all decoration has hidden owners', async () => {
  const html = await render(h(Skeleton, { avatar: true, 'aria-busy': false }));
  assert.ok(html.includes('aria-busy="true"'));
  assert.equal((html.match(/aria-hidden="true"/g) ?? []).length, 2);
});
await check('nonloading content is complete and has no copied root attrs', async () => {
  const html = await render(
    h(
      Skeleton,
      { loading: false, id: 'no-loading-root' },
      {
        default: () => [h('input', { 'aria-label': 'Server content draft' }), h('b', 'Tail')],
      },
    ),
  );
  assert.ok(html.includes('Server content draft') && html.includes('Tail'));
  assert.ok(!html.includes('no-loading-root') && !html.includes('apollo-skeleton'));
});
await check('nested block configuration classes and styles are consumed', async () => {
  const html = await render(
    h(Skeleton, {
      avatar: { className: 'server-configured-avatar', style: { opacity: 0.7 } },
      title: { style: { height: '23px' } },
      classNames: { avatar: 'server-semantic-avatar' },
    }),
  );
  for (const value of [
    'server-configured-avatar',
    'server-semantic-avatar',
    'opacity:0.7',
    'height:23px',
  ])
    assert.ok(html.includes(value), value);
});
await check('Image complete native content wins over its SVG fallback', async () => {
  const html = await render(
    h(
      SkeletonImage,
      {},
      { default: () => [h('b', 'Custom'), h('input', { 'aria-label': 'Server image draft' })] },
    ),
  );
  assert.ok(html.includes('Custom') && html.includes('Server image draft'));
  assert.ok(!html.includes('<svg'));
});
await check('intentional empty Image content suppresses the fallback', async () => {
  const html = await render(h(SkeletonImage, {}, { default: () => [] }));
  assert.ok(!html.includes('<svg'));
});
await check('nonfinite rows render an empty paragraph without exceptions', async () => {
  const html = await render(h(Skeleton, { paragraph: { rows: Infinity } }));
  assert.ok(!html.includes('<li'));
});
const report = { results, browserGlobals: false };
writeFileSync(
  process.env.SKELETON_SSR_EVIDENCE ?? '/tmp/apollo-skeleton-ssr.json',
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(report);
assert.ok(results.every((r) => r.passed));
