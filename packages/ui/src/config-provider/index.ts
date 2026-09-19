/**
 * ConfigProvider 的公共导出。
 *
 * 与 antd 的 `es/config-provider/index.js` 对齐的对外面：
 *
 * | antd | 本项目 |
 * |---|---|
 * | `ConfigProvider`（默认导出） | `ConfigProvider`（默认 + 具名） |
 * | `ConfigProvider.ConfigContext` | `ConfigProvider.ConfigContext`（= `configContextKey`，配合 `inject`） |
 * | `ConfigProvider.config()` | `ConfigProvider.config()` / 具名 `setGlobalConfig` |
 * | `ConfigProvider.useConfig()` | `ConfigProvider.useConfig()` / 具名 `useConfig` |
 * | `ConfigProvider.SizeContext` | **不导出**（antd 已废弃，它的 getter 里就打废弃告警） |
 * | `globalConfig()` | `globalConfig()` |
 * | `ConfigConsumer` | **不导出**（React 的 render-props 形态，Vue 用 `inject`） |
 *
 * ── ⭐ 渐进式类型形态（D25）──────────────────────────────────────────────────
 *
 * `ConfigProviderProps` 只声明了 4 个精确组件配置 prop（`divider` / `empty` /
 * `spin` / `form`），其余 53 个走 `components` 弱类型逃生口。每落地一个新组件，
 * 就把它提升成精确 prop。详见 `docs/analysis/config-provider.md` §6.1。
 */

import { withInstall } from '../_internal/with-install';
import ConfigProviderComponent from './ConfigProvider';
import { configContextKey } from './context';
import { setGlobalConfig } from './global-config';
import { useConfig } from './use-config';

/**
 * ConfigProvider 组件。注册名 `AConfigProvider`（`COMPONENT-RULES.md` 规则 R2）。
 *
 * ⚠️ `Object.assign` 而不是在 `ConfigProvider.ts` 里挂：静态方法与组件实例无关，
 *    挂在组件对象上是 React `forwardRef` + 静态属性的同构写法（同 `Spin`）。
 */
export const ConfigProvider = withInstall(
  Object.assign(ConfigProviderComponent, {
    /**
     * antd 的 `ConfigProvider.ConfigContext` 是 React Context 对象，可以
     * `useContext(ConfigProvider.ConfigContext)`。
     * 本项目的对应物是**注入键** —— `inject(ConfigProvider.ConfigContext)`。
     * 更常用的是 `useConfigContext()`（带了兜底默认值）。
     */
    ConfigContext: configContextKey,
    config: setGlobalConfig,
    useConfig,
  }),
);

export default ConfigProvider;

// ---------------------------------------------------------------------------
// context（叶子模块）
// ---------------------------------------------------------------------------
export type {
  ComponentConfig,
  ComponentConfigBase,
  ComponentStyleConfig,
  ConfigContextBase,
  ConfigContextValue,
  CSPConfig,
  DirectionType,
  GetPopupContainer,
  GetPrefixCls,
  GetTargetContainer,
  PopupOverflow,
  RenderEmptyComponentName,
  RenderEmptyHandler,
  Variant,
  Variants,
  WaveConfig,
} from './context';
export {
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
  defaultGetPrefixCls,
  defaultIconPrefixCls,
  defaultPrefixCls,
  useComponentConfig,
  useConfigContext,
  useDirection,
  useThemeConfig,
} from './context';
// ---------------------------------------------------------------------------
// 空状态兜底
// ---------------------------------------------------------------------------
export { DefaultRenderEmpty, defaultRenderEmpty } from './default-render-empty';
export { disabledContextKey, useDisabled } from './disabled-context';
// ---------------------------------------------------------------------------
// 全局配置
// ---------------------------------------------------------------------------
export { globalConfig, resetGlobalConfig, setGlobalConfig } from './global-config';
export type { ConfigProviderThemeConfig } from './hooks/use-theme';
export { useTheme } from './hooks/use-theme';
// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------
export type {
  ComponentConfigLike,
  ConfigProviderProps,
  FormConfig,
  GlobalConfigProps,
  UseConfigResult,
} from './interface';
// ---------------------------------------------------------------------------
// 独立 context：尺寸与全局禁用
// ---------------------------------------------------------------------------
export type { SizeType } from './size-context';
export { sizeContextKey, useSize } from './size-context';
// ---------------------------------------------------------------------------
// 组合式能力
// ---------------------------------------------------------------------------
export { useConfig } from './use-config';
