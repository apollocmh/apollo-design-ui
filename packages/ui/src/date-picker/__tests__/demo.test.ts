/**
 * demo 冒烟 —— DatePicker。
 *
 * ── 🚨 与 antd 的差距（**必须知道**）──────────────────────────────────────────
 *
 * antd 6.6.4 的 `components/date-picker/demo/` 有 **33 个**用户可见 demo；
 * 本仓**只移植了 1 个**（`basic`）。
 *
 * `expectCount: 1` 钉住的是**已落地**的那批 —— 它**不是**「与 antd 一一对应」的证据。
 * 缺口登记在 `README.md` §5.2（`docsStatus` 的口径见那里）。
 *
 * ⚠️ 这条测试的价值：① 防止 demo 被误删（`import.meta.glob` 匹配不到不会报错）；
 * ② 每个 demo 渲染时**零告警**（浮层类 demo 尤其容易踩 teleport / 未注册组件的坑）。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('DatePicker', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 1,
});
