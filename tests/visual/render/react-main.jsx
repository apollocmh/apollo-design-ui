/**
 * React 侧渲染入口（antd 6.6.4）。
 *
 * 一个 bundle 服务全部 case：`?component=empty&variant=default&theme=light`。
 * 渲染完成后置 `window.__VISUAL_READY__`，Playwright 等这个标志而不是 sleep（`A3`）。
 */

import 'antd/dist/reset.css';

import { theme as antdTheme, ConfigProvider } from 'antd';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

import { SEMANTIC_INJECT_CSS } from './cases/shared.mjs';

/** 组件用例注册表：文件名即组件名。 */
const modules = import.meta.glob('./cases/react/*.jsx', { eager: true });

const ALGORITHMS = {
  light: antdTheme.defaultAlgorithm,
  dark: antdTheme.darkAlgorithm,
  compact: antdTheme.compactAlgorithm,
};

const params = new URLSearchParams(location.search);
const component = params.get('component') ?? 'empty';
const variant = params.get('variant') ?? 'default';
const themeId = params.get('theme') ?? 'light';

const mod = modules[`./cases/react/${component}.jsx`];
if (!mod) {
  throw new Error(
    `没有 React 用例文件：./cases/react/${component}.jsx（已有：${Object.keys(modules).join(', ')}）`,
  );
}

const renderCase = mod.default[variant];
if (!renderCase) {
  throw new Error(
    `组件 ${component} 没有 React 用例「${variant}」（已有：${Object.keys(mod.default).join(', ')}）`,
  );
}

// 语义化用例的配套 CSS（两侧同一份，见 shared.mjs 的说明）
const style = document.createElement('style');
style.textContent = SEMANTIC_INJECT_CSS;
document.head.appendChild(style);

const app = (
  <ConfigProvider theme={{ algorithm: ALGORITHMS[themeId] ?? antdTheme.defaultAlgorithm }}>
    <div id="stage">{renderCase()}</div>
  </ConfigProvider>
);

const root = createRoot(document.getElementById('root'));
// flushSync：让 render 同步完成，截图前不必猜「渲染好了没」
flushSync(() => {
  root.render(app);
});

window.__VISUAL_READY__ = true;
