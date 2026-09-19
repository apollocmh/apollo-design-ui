/**
 * Vue 侧（@apollo-design/ui）的 ConfigProvider 视觉用例。
 *
 * 与 `render/cases/react/config-provider.jsx` **逐条对应**。用 `h()` 而不是 SFC：
 * 用例是「一份 props 组合」，写成函数调用才能与 React 侧一一对照。
 */

import { darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider, Empty, Spin } from '@apollo-design/ui';
import { h } from 'vue';

import { CP_COLOR_PRIMARY, CP_DARK_BG_STYLE, CP_LOCALE } from '../shared.mjs';

export default {
  locale: () => h(ConfigProvider, { locale: CP_LOCALE }, () => h(Empty)),

  'theme-token': () =>
    h(ConfigProvider, { theme: { token: { colorPrimary: CP_COLOR_PRIMARY } } }, () => h(Spin)),

  'theme-dark': () =>
    h(ConfigProvider, { theme: { algorithm: darkAlgorithm } }, () =>
      h('div', { style: CP_DARK_BG_STYLE }, [h(Empty)]),
    ),
};
