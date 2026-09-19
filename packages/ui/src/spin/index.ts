/**
 * Spin 的公共导出。
 *
 * 与 antd 的 `es/spin/index.js` 对齐的对外面：
 *   - 默认导出 `Spin`（含静态方法 `setDefaultIndicator`）
 *   - `setDefaultIndicator` 同时提供**具名导出**（Vue 生态的惯例，也便于 tree-shaking）
 *   - 全部类型（`SpinProps` / `SpinRef` / `SpinSize` / `SpinIndicator` / `SpinPercent` /
 *     语义化类型 / `SpinConfig`）
 *
 * ── 关于 `Spin.setDefaultIndicator`（对应 antd 的 `SpinType`）——─────────────────
 *
 * antd 的 `Spin` 类型里带 `setDefaultIndicator: (indicator: React.ReactNode) => void`，
 * 它改的是一个**模块级单例**。`<script setup>` 每个实例都会执行一遍，写在那里的
 * `let` 是实例级的 —— 所以真身住在 `./defaultIndicator.ts`（ESM 模块单例），
 * `Spin.setDefaultIndicator` 只是把那个模块的 setter 挂到组件上。
 */

import { withInstall } from '../_internal/with-install';
import { setDefaultIndicator } from './defaultIndicator';
import SpinComponent from './Spin.vue';

/**
 * Spin 组件。注册名 `ASpin`（`COMPONENT-RULES.md` 规则 R2）。
 *
 * ⚠️ `Object.assign` 而不是在 `Spin.vue` 里挂：静态方法与组件实例无关，
 *    挂在组件对象上是 React `forwardRef` + 静态属性的同构写法。
 */
export const Spin = withInstall(Object.assign(SpinComponent, { setDefaultIndicator }));

export default Spin;

export type {
  SpinConfig,
  SpinIndicator,
  SpinPercent,
  SpinProps,
  SpinRef,
  SpinSemanticAllType,
  SpinSemanticClassNames,
  SpinSemanticStyles,
  SpinSemanticType,
  SpinSemanticValue,
  SpinSize,
  SpinSlot,
} from './interface';
export { genSpinStyle } from './style';
export { CONTENT_HEIGHT } from './style/token';
export type { ComponentToken as SpinComponentToken } from './style/token';
export { prepareComponentToken as prepareSpinComponentToken } from './style/token';
export { getDefaultIndicator, setDefaultIndicator } from './defaultIndicator';
