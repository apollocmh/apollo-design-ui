/**
 * App 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 `components/app/App.tsx`（AppProps）。按本仓 Vue 化
 * 约定重新定义（H2）：component 收窄为 `'div' | 'section' | 'main' | 'span'`
 * 或 `false`（antd 的 CustomComponent 泛型族收窄，H2）。
 */

import type { AppConfig } from '../_internal/app-context';

export type AppComponentType = 'div' | 'section' | 'main' | 'span' | false;

export interface AppProps extends AppConfig {
  prefixCls?: string;
  /** 渲染的根元素；`false` ⇒ 无包裹（Fragment）。 */
  component?: AppComponentType;
}
