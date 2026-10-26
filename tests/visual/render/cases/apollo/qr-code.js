import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider, QrCode } from '@apollo-design/ui';
import { createCommentVNode, h } from 'vue';

const value = 'https://apollo.design/current';
const logo = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" rx="8" fill="#38598b"/><path d="M10 28L20 9l10 19h-6l-4-8-4 8z" fill="white"/></svg>')}`;
const titles = {
  basic: 'Canvas rendering',
  svg: 'Vector rendering',
  icon: 'Local center images',
  expired: 'Expired access',
  loading: 'Loading access',
  scanned: 'Scanned access',
  'custom-status': 'Native status content',
  tokens: 'Current cover token',
  'theme-dark': 'Dark workspace',
  'theme-compact': 'Compact workspace',
  'theme-dark-compact': 'Dark compact workspace',
  'native-focus': 'Native keyboard focus',
};
const qr = (props = {}, slots) =>
  h(QrCode, { id: 'qr-main', value, title: 'Workspace access', ...props }, slots);
const frame = (name, children) =>
  h(
    'main',
    {
      'data-qrcode-visual-case': name,
      style: {
        boxSizing: 'border-box',
        width: '100%',
        minHeight: '280px',
        padding: '16px',
        color: 'var(--apollo-color-text)',
        background: 'var(--apollo-color-bg-container)',
        fontFamily: 'var(--apollo-font-family)',
        fontSize: 'var(--apollo-font-size)',
      },
    },
    [
      h('h1', { style: { margin: '0 0 12px', fontSize: '20px' } }, 'QR workspace'),
      h('h2', { style: { margin: '0 0 16px', fontSize: '14px' } }, titles[name]),
      ...children,
    ],
  );
const nativeStatus = ({ status, refresh }) => [
  createCommentVNode('conditional first child'),
  h('input', {
    id: 'qr-focus-draft',
    'aria-label': 'QR access note',
    value: 'Review draft',
    style: { width: '110px', maxWidth: '100%' },
  }),
  h('output', { 'aria-label': 'Access state' }, status),
  h('button', { type: 'button', onClick: refresh }, 'Continue'),
];
const themed = (name, algorithm) =>
  h(ConfigProvider, { theme: { algorithm } }, () => frame(name, [qr({ status: 'expired' })]));
export default {
  basic: () => frame('basic', [qr()]),
  svg: () => frame('svg', [qr({ type: 'svg' })]),
  icon: () =>
    frame('icon', [
      h(
        'div',
        { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px' } },
        [
          qr({ icon: logo }),
          qr({
            id: 'qr-secondary',
            type: 'svg',
            size: 120,
            iconSize: 24,
            icon: logo,
            title: 'Vector icon access',
          }),
        ],
      ),
    ]),
  expired: () => frame('expired', [qr({ status: 'expired' })]),
  loading: () => frame('loading', [qr({ status: 'loading' })]),
  scanned: () => frame('scanned', [qr({ status: 'scanned' })]),
  'custom-status': () =>
    frame('custom-status', [qr({ status: 'expired' }, { status: nativeStatus })]),
  tokens: () =>
    h(
      ConfigProvider,
      { theme: { components: { QRCode: { QRCodeCoverBackgroundColor: '#e8f4ec' } } } },
      () => frame('tokens', [qr({ status: 'scanned' })]),
    ),
  'theme-dark': () => themed('theme-dark', darkAlgorithm),
  'theme-compact': () => themed('theme-compact', compactAlgorithm),
  'theme-dark-compact': () => themed('theme-dark-compact', [darkAlgorithm, compactAlgorithm]),
  'native-focus': () =>
    frame('native-focus', [
      h(
        'button',
        { id: 'qr-before', type: 'button', style: { display: 'block', marginBottom: '8px' } },
        'Before QR',
      ),
      qr({ status: 'expired' }, { status: nativeStatus }),
    ]),
};
