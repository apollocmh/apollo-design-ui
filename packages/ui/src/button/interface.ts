/**
 * Button 的类型面。
 *
 * 契约来源：antd 6.6.4 的 `es/button/Button.d.ts` 与 `es/button/buttonHelpers.d.ts`
 * （行为实现见 `/tmp/antd-repo/.../button/Button.tsx`，逐条行号记录在
 * `docs/analysis/button.md`）。**逐字段对齐**，包括 `@deprecated` 标记与可选性。
 *
 * ── 与 antd 类型面的差异（都有据可查）────────────────────────────────────────
 *
 * 1. `children` 不在 Props 里（规则 C19）—— Vue 侧是默认插槽。
 * 2. `SizeType` 改名为 `ButtonSize`。antd 的 `SizeType` 住在 config-provider；
 *    这里不重复导出同名类型，避免 `index.ts` 重名导出（与 Divider 同一处置）。
 * 3. `React.CSSProperties` → Vue 的 `CSSProperties`，`React.ReactNode` → `VNodeChild`
 *    （规则 C16 / C18）。
 * 4. ⚠️ **语义化不支持函数式变体**（`classNamesAndFn` / `stylesAndFn`）。
 *    依据 `empty-semantic-fn` 开放决策的建议 B：形态统一优先。
 *    已完成的 divider / spin / space 同样不支持 —— 见 `docs/analysis/button.md` §1。
 */

import type { CSSProperties, VNodeChild } from 'vue';
import type { ComponentStyleConfig } from '../config-provider/context';

// ---------------------------------------------------------------------------
// 基础枚举（取值集合逐字来自 antd 的 `buttonHelpers.d.ts`）
// ---------------------------------------------------------------------------

/** 按钮类型（旧 API，v6 里被 `color` + `variant` 取代，但仍受支持）。 */
export type ButtonType = 'default' | 'primary' | 'dashed' | 'link' | 'text';

/** 按钮形状。 */
export type ButtonShape = 'default' | 'circle' | 'round' | 'square';

/** `<button>` 的原生 `type`。 */
export type ButtonHTMLType = 'submit' | 'button' | 'reset';

/** 视觉变体。`filled` 存在但 `ButtonTypeMap` 未映射 ⇒ 只能由 `variant` 显式传入。 */
export type ButtonVariantType = 'outlined' | 'dashed' | 'solid' | 'filled' | 'text' | 'link';

/** 语义色 + 预设色。注意 `'link'` 不是真颜色，antd 为了兼容才放进这个联合。 */
export type ButtonColorType =
  | 'default'
  | 'primary'
  | 'danger'
  | 'blue'
  | 'purple'
  | 'cyan'
  | 'green'
  | 'magenta'
  | 'pink'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'volcano'
  | 'geekblue'
  | 'lime'
  | 'gold';

/** 尺寸。与 antd 的 `SizeType` 同集合。 */
export type ButtonSize = 'small' | 'middle' | 'large';

/** 图标位置。 */
export type ButtonIconPlacement = 'start' | 'end';

/**
 * loading 的两种形态。
 *
 * ⚠️ 对象形态的判据是「`delay` 是否存在且 > 0」，不是「是不是对象」——
 *    见 `docs/analysis/button.md` §4.2（`Button.tsx:100-114`）。
 */
export type ButtonLoading = boolean | { delay?: number; icon?: VNodeChild };

// ---------------------------------------------------------------------------
// 语义化
// ---------------------------------------------------------------------------

export interface ButtonSemanticClassNames {
  root?: string;
  icon?: string;
  content?: string;
}

export interface ButtonSemanticStyles {
  root?: CSSProperties;
  icon?: CSSProperties;
  content?: CSSProperties;
}

export interface ButtonSemanticType {
  classNames?: ButtonSemanticClassNames;
  styles?: ButtonSemanticStyles;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Button 的 Props。
 *
 * ⚠️ 合成事件在 Vue 侧是 `emit`，不在 Props 里 —— 见 `Button.vue` 的 `defineEmits`。
 */
export interface ButtonProps {
  /** 旧版类型糖，会被解析成 `color` + `variant`（见 `ButtonTypeMap`）。 */
  type?: ButtonType;
  color?: ButtonColorType;
  variant?: ButtonVariantType;
  /** 图标。也支持 `icon` 插槽。 */
  icon?: VNodeChild;
  /** @deprecated 请用 `iconPlacement` */
  iconPosition?: ButtonIconPlacement;
  iconPlacement?: ButtonIconPlacement;
  shape?: ButtonShape;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: ButtonLoading;
  prefixCls?: string;
  className?: string;
  rootClassName?: string;
  ghost?: boolean;
  danger?: boolean;
  block?: boolean;
  /** 有值 ⇒ 渲染 `<a>`，否则渲染 `<button>`。 */
  href?: string;
  htmlType?: ButtonHTMLType;
  /** 两个中文字之间是否自动插空格。默认 `true`（上游 `?? true`）。 */
  autoInsertSpace?: boolean;
  classNames?: ButtonSemanticClassNames;
  styles?: ButtonSemanticStyles;
  style?: CSSProperties;
}

// ---------------------------------------------------------------------------
// 其它
// ---------------------------------------------------------------------------

export interface ButtonRef {
  /** 根元素（`<button>` 或 `<a>`）。 */
  nativeElement: HTMLButtonElement | HTMLAnchorElement | null;
}

export type ButtonSlot = () => VNodeChild;

/**
 * ConfigProvider 的 `button` 段。
 *
 * 比 DividerConfig 多了 4 项 —— 它们来自上游 `useComponentConfig('button')` 的解构
 * （`Button.tsx:165-177`）：`loadingIcon` / `shape` / `color` / `variant`，
 * 以及 `autoInsertSpace`。
 */
export type ButtonConfig = ComponentStyleConfig &
  Pick<ButtonProps, 'classNames' | 'styles'> & {
    loadingIcon?: VNodeChild;
    shape?: ButtonShape;
    color?: ButtonColorType;
    variant?: ButtonVariantType;
    autoInsertSpace?: boolean;
  };
