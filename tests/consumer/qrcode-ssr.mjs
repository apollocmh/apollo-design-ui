/** Published QRCode renders current native contracts without browser globals. */
import assert from 'node:assert/strict';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ConfigProvider, QrCode } from '../../packages/ui/dist/index.mjs';

assert.equal(typeof window, 'undefined');
assert.equal(typeof document, 'undefined');
const render = (node) => renderToString(createSSRApp({ render: () => node }));
const checks = [];
for (const type of ['canvas', 'svg'])
  for (const status of ['active', 'expired', 'loading', 'scanned']) {
    const html = await render(
      h(QrCode, { value: ['Production ', 'access'], type, status, title: 'Server access' }),
    );
    assert.match(html, /aria-label="Server access"/);
    assert.equal(html.includes('apollo-qrcode-cover'), status !== 'active');
    if (status === 'expired') assert.ok(html.includes('<button'));
    if (type === 'svg') {
      assert.ok(html.includes('<title>Server access</title>'));
      assert.ok(html.includes('shape-rendering="crispEdges"'));
    }
    checks.push(`${type} ${status}: named graphic, current status and native attributes`);
  }
const custom = await render(
  h(
    ConfigProvider,
    {
      theme: { components: { QRCode: { QRCodeCoverBackgroundColor: '#e8f4ec' } } },
      locale: { locale: 'custom', QRCode: { refresh: 'Server refresh' } },
    },
    () =>
      h(
        QrCode,
        { value: 'x', type: 'svg', status: 'expired' },
        {
          status: ({ status, locale, refresh }) => [
            h('input', { 'aria-label': 'Server draft' }),
            h('output', status),
            h('button', { onClick: refresh }, locale.refresh),
          ],
        },
      ),
  ),
);
assert.ok(custom.includes('--apollo-qrcode-cover-background-color:#e8f4ec'));
assert.ok(custom.includes('aria-label="Server draft"'));
assert.ok(custom.includes('<output>expired</output>'));
assert.ok(custom.includes('Server refresh'));
checks.push('current source token, locale, full status scope and native editor');
assert.equal('statusRender' in QrCode.props, false);
assert.equal(await render(h(QrCode, { value: '', type: 'svg' })), '<!---->');
checks.push('removed function prop and empty value contract');
console.log(JSON.stringify({ node: process.version, checks }, null, 2));
