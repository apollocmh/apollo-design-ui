/**
 * Layout 的公共导出。
 *
 * 与 antd 的 `es/layout/index.js` 对齐：默认导出 Layout，静态挂
 * `Header / Footer / Content / Sider / _InternalSiderContext`
 * （Skeleton / Statistic 同范式 —— `Object.assign` 挂静态属性）。
 */

import { withInstall } from '../_internal/with-install';
import { siderContextKey } from './context';
import {
  Content as BasicContent,
  Footer as BasicFooter,
  Header as BasicHeader,
  LayoutComponent,
} from './Layout';
import { SiderComponent } from './Sider';

/** Layout 组件。注册名 `ALayout`（COMPONENT-RULES.md 规则 R2）。 */
export const Layout = withInstall(
  Object.assign(LayoutComponent, {
    Header: BasicHeader,
    Footer: BasicFooter,
    Content: BasicContent,
    Sider: SiderComponent,
    /** @private 内部 Context（Menu 消费 `siderCollapsed`）。 */
    _InternalSiderContext: siderContextKey,
  }),
);

export const LayoutHeader = withInstall(BasicHeader);
export const LayoutFooter = withInstall(BasicFooter);
export const LayoutContent = withInstall(BasicContent);
export const LayoutSider = withInstall(SiderComponent);
/** `Header` / `Footer` / `Content` / `Sider` 别名（= `Layout.Header` 等静态属性）。 */
export const Header = LayoutHeader;
export const Footer = LayoutFooter;
export const Content = LayoutContent;
export const Sider = LayoutSider;

export default Layout;

export type {
  Breakpoint,
  CollapseType,
  LayoutContextProps,
  LayoutProps,
  LayoutRef,
  SiderContextProps,
  SiderProps,
  SiderRef,
  SiderSemanticClassNames,
  SiderSemanticStyles,
  SiderTheme,
} from './interface';
export { genLayoutStyle } from './style';
export { genSiderStyle } from './style/sider';
export type { ComponentToken as LayoutComponentToken } from './style/token';
export { prepareComponentToken as prepareLayoutComponentToken } from './style/token';
