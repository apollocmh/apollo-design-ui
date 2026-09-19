/**
 * `ConfigProvider.config()` / `globalConfig()` —— 模块级全局配置。
 *
 * 契约来源：antd 6.6.4 的 `es/config-provider/index.js:284-330`（`setGlobalConfig` +
 * `globalConfig`）。影响的是**没有挂 ConfigProvider** 的那部分组件 —— 与 antd 同。
 *
 * ⚠️ 状态必须是**模块级单例**，不能写在组件里：`<script setup>` 编译成 `setup()`，
 *    每个实例都会执行一遍，写在那里就成了实例级（PITFALLS 91 同源）。
 *
 * ⚠️ `holderRender` **不实现**（D30）：它是 React 特有的「把 children 再包一层」
 *    （给 `message` / `Modal` 的静态方法挂 holder）。Vue 侧用插槽包裹即可，
 *    不需要一个额外的 API 面。
 */

import type { ThemeConfig } from '@apollo-design/theme';
import { defaultIconPrefixCls, defaultPrefixCls, globalConfigState } from './context';
import type { ConfigProviderThemeConfig } from './hooks/use-theme';
import type { GlobalConfigProps } from './interface';

/** 全局主题。typed 为本组件的 `ConfigProviderThemeConfig`（多了 `inherit`）。 */
let globalTheme: ConfigProviderThemeConfig | undefined;

/**
 * 设置全局配置。与 antd 的 `setGlobalConfig` 逐条对应：
 *
 *   - `prefixCls` / `iconPrefixCls`：`!== undefined` 才写入（传 `undefined` 不是「清空」）
 *   - `theme`：真值才写入
 */
export function setGlobalConfig(props: GlobalConfigProps): void {
  const { prefixCls, iconPrefixCls, theme } = props;

  if (prefixCls !== undefined) {
    globalConfigState.prefixCls = prefixCls;
  }
  if (iconPrefixCls !== undefined) {
    globalConfigState.iconPrefixCls = iconPrefixCls;
  }
  if (theme) {
    globalTheme = theme;
  }
}

/** 与 antd 的 `globalConfig()` 同构的读取器。 */
export function globalConfig(): {
  getPrefixCls: (suffixCls?: string, customizePrefixCls?: string) => string;
  getIconPrefixCls: () => string;
  getRootPrefixCls: () => string;
  getTheme: () => ThemeConfig | undefined;
} {
  return {
    getPrefixCls: (suffixCls, customizePrefixCls) =>
      defaultGetPrefixClsForGlobal(suffixCls, customizePrefixCls),
    getIconPrefixCls: getGlobalIconPrefixCls,
    getRootPrefixCls: () => globalConfigState.prefixCls ?? getGlobalPrefixCls(),
    getTheme: () => globalTheme,
  };
}

function getGlobalPrefixCls(): string {
  return globalConfigState.prefixCls || defaultPrefixCls;
}

function getGlobalIconPrefixCls(): string {
  return globalConfigState.iconPrefixCls || defaultIconPrefixCls;
}

function defaultGetPrefixClsForGlobal(suffixCls?: string, customizePrefixCls?: string): string {
  if (customizePrefixCls) return customizePrefixCls;
  const root = getGlobalPrefixCls();
  return suffixCls ? `${root}-${suffixCls}` : root;
}

/**
 * 测试辅助：把全局配置恢复出厂。
 *
 * ⚠️ 只给测试用 —— 生产代码调用它会让「用户调用 `ConfigProvider.config()` 之后
 *    又挂载的组件」拿到错误前缀。`globalConfigState` 也一并清空（它是 `context.ts`
 *    里 `defaultGetPrefixCls` 的数据源）。
 */
export function resetGlobalConfig(): void {
  globalConfigState.prefixCls = undefined;
  globalConfigState.iconPrefixCls = undefined;
  globalTheme = undefined;
}
