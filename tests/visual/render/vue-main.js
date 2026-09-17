/**
 * Vue 侧渲染入口（@apollo-design/ui）。
 *
 * 与 `react-main.jsx` 同样的 URL 协议、同样的 `#stage` 结构、同样的 ready 标志，
 * 因此 `run.mjs` 可以用完全相同的步骤处理两侧。
 */

// 注意是 `@apollo-design/theme/tokens.css`（不含 dist）。theme 的 exports 只暴露这个
// 规范路径 —— 仓库里多处文档曾写成 `/dist/tokens.css`，那在 exports 下解析不到。
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/style.css';

import { createApp, h } from 'vue';

import { SEMANTIC_INJECT_CSS } from './cases/shared.mjs';

/** 组件用例注册表：文件名即组件名。 */
const modules = import.meta.glob('./cases/vue/*.js', { eager: true });

const params = new URLSearchParams(location.search);
const component = params.get('component') ?? 'empty';
const variant = params.get('variant') ?? 'default';

const mod = modules[`./cases/vue/${component}.js`];
if (!mod) {
  throw new Error(
    `没有 Vue 用例文件：./cases/vue/${component}.js（已有：${Object.keys(modules).join(', ')}）`,
  );
}

const renderCase = mod.default[variant];
if (!renderCase) {
  throw new Error(
    `组件 ${component} 没有 Vue 用例「${variant}」（已有：${Object.keys(mod.default).join(', ')}）`,
  );
}

// 语义化用例的配套 CSS（与 React 侧同一份，见 shared.mjs 的说明）
const style = document.createElement('style');
style.textContent = SEMANTIC_INJECT_CSS;
document.head.appendChild(style);

const app = createApp({
  render: () => h('div', { id: 'stage' }, [renderCase()]),
});

app.mount('#root');

// Vue 的 mount 是同步的；ConfigProvider 落地后若引入异步主题注入，这里要改成 await。
window.__VISUAL_READY__ = true;
