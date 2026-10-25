/** Production Node SSR: deliberately do not install jsdom or DOM globals. */
import assert from 'node:assert/strict';
import { h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ConfigProvider, Image, ImagePreviewGroup } from '../../packages/ui/dist/index.mjs';

assert.equal(typeof window, 'undefined');
assert.equal(typeof document, 'undefined');
assert.equal(typeof globalThis.Image, 'undefined');
let previewCalls = 0;
for (const open of [false, true]) {
  for (const grouped of [false, true]) {
    const slots = {
      previewImage: () => {
        previewCalls++;
        return h('b', 'Client preview');
      },
    };
    const html = await renderToString(
      grouped
        ? h(
            ImagePreviewGroup,
            { defaultOpen: open, defaultCurrent: 1 },
            {
              ...slots,
              default: () => [h(Image, { src: 'first.png' }), h(Image, { src: 'second.png' })],
            },
          )
        : h(
            Image,
            {
              src: 'source.png',
              srcSet: 'source-2x.png 2x',
              fallback: 'fallback.png',
              defaultOpen: open,
            },
            slots,
          ),
    );
    assert.match(html, /<img/);
    // Vue SSR serializes an empty native attribute as `alt` without quotes.
    assert.match(html, /<img\b[^>]*\salt(?:=""|(?=[\s>]))/);
    assert.doesNotMatch(html, /role="dialog"/);
  }
}
const placeholder = await renderToString(h(Image, { placeholder: 0 }));
assert.match(placeholder, />0</);
assert.equal(previewCalls, 0, 'SSR must not eagerly evaluate client preview slots');
for (const open of [false, true]) {
  const themed = await renderToString(
    h(
      ConfigProvider,
      {
        theme: {
          token: { colorBgSpotlight: '#123456' },
          components: { Image: { previewOperationSize: 31 } },
        },
      },
      {
        default: () => [
          h(Image, { src: 'themed.png', defaultOpen: open }),
          h(
            ImagePreviewGroup,
            { items: ['first.png', 'second.png'], defaultOpen: open },
            { default: () => h('input', { 'aria-label': 'SSR themed draft' }) },
          ),
        ],
      },
    ),
  );
  assert.match(themed, /src="themed.png"/);
  assert.match(themed, /SSR themed draft/);
  assert.match(themed, /--apollo-image-preview-operation-size:31px/);
  assert.doesNotMatch(themed, /role="dialog"/);
}
// The former validation request rejected asynchronously after rendering HTML.
await new Promise((resolve) => setImmediate(resolve));
console.log(
  'PASS published Image/Group Node SSR: no DOM globals, native resources, open/closed state, placeholder data and no eager preview slots.',
);
