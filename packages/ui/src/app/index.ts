/**
 * App 的公共导出。
 *
 * 与 antd 的 es/app/index.js 对齐的对外面（App.useApp 静态属性同构）。
 */

import { withInstall } from '../_internal/with-install';
import AppComponent from './App';
import { useApp } from './useApp';

/** App 组件。注册名 `AApp`（COMPONENT-RULES.md 规则 R2）。 */
export const App = Object.assign(withInstall(AppComponent), { useApp });

export type { AppConfig, UseAppProps } from '../_internal/app-context';
export type { AppComponentType, AppProps, AppSlots } from './interface';
export { useApp } from './useApp';

export default App;
