/**
 * React 侧（antd 6.6.4）的 ConfigProvider 视觉用例。
 *
 * 与 `render/cases/vue/config-provider.js` **逐条对应**：同 variant 名、同输入常量
 * （都来自 `shared.mjs`）、同下游组件。
 *
 * ⚠️ `react-main.jsx` 已经在最外层包了一层 `ConfigProvider theme={{algorithm}}`，
 *    所以这里的三层都是**嵌套**用法 —— 正好也是我们要验的形态（继承 / 覆盖）。
 *
 * 这里允许 import antd —— `TESTING.md` A9 的唯一例外是测试目录（`tests/`）。
 */

import { theme as antdTheme, ConfigProvider, Empty, Spin } from 'antd';

import { CP_COLOR_PRIMARY, CP_DARK_BG_STYLE, CP_LOCALE } from '../shared.mjs';

export default {
  locale: () => (
    <ConfigProvider locale={CP_LOCALE}>
      <Empty />
    </ConfigProvider>
  ),

  'theme-token': () => (
    <ConfigProvider theme={{ token: { colorPrimary: CP_COLOR_PRIMARY } }}>
      <Spin />
    </ConfigProvider>
  ),

  'theme-dark': () => (
    <ConfigProvider theme={{ algorithm: antdTheme.darkAlgorithm }}>
      <div style={CP_DARK_BG_STYLE}>
        <Empty />
      </div>
    </ConfigProvider>
  ),
};
