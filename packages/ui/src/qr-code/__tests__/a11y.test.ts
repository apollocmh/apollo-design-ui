/**
 * L5 · 无障碍 —— QrCode
 *
 * ⚠️ 拆成两组：canvas 与 svg 形态触发的 axe 规则不同（role-img-alt vs
 *    svg-img-alt），而豁免是**按次调用**全局匹配的 —— 混在一组里会互相判 stale。
 *
 * 豁免登记（UPSTREAM）：antd 的 canvas/svg 是 `role="img"` 且无 aria-label/title
 * （上游 6.6.4 原样）。补可访问名称会偏离 DOM 契约（L4 byte 级对齐），对齐 antd。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';

const ROLE_IMG_ALT_ALLOWANCE = {
  rule: 'role-img-alt',
  reason:
    'antd 的 QRCode canvas 是 role="img" 且无 aria-label（上游 6.6.4 原样）。补充可访问名称会偏离 DOM 契约（L4 byte 级对齐），对齐 antd，豁免该规则。',
  deviationId: 'U11',
};

const SVG_IMG_ALT_ALLOWANCE = {
  rule: 'svg-img-alt',
  reason:
    'antd 的 QRCode svg 同样是 role="img" 且无 title/aria-label（上游 6.6.4 原样）。对齐 antd，豁免该规则。',
  deviationId: 'U11',
};

a11yDemoTest('QrCode (canvas)', {
  demos: import.meta.glob('../demo/{basic,custom,status}.vue', { eager: true }),
  expectCount: 3,
  allow: [ROLE_IMG_ALT_ALLOWANCE],
});

a11yDemoTest('QrCode (svg)', {
  demos: import.meta.glob('../demo/svg.vue', { eager: true }),
  expectCount: 1,
  allow: [SVG_IMG_ALT_ALLOWANCE],
});
