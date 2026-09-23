/**
 * Switch 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/switch/index.d.ts`（源码 `components/switch/index.tsx`）
 * + `@rc-component/switch@1.0.3` 的 `es/index.d.ts`。**逐字段对齐**。
 *
 * 差异（`React.*` → Vue，规则 C16 / C18）：
 *   - `React.CSSProperties` → Vue 的 `CSSProperties`
 *   - `React.ReactNode` → `VNodeChild`（⚠️ 见下）
 *   - rc-switch 的 `SwitchProps extends Omit<React.HTMLAttributes<HTMLButtonElement>, …>`
 *     —— React 的 `HTMLAttributes` 没有 Vue 对应物，那部分（`title` / `tabIndex` /
 *     其余 `on*`）在 Vue 侧是**声明过的 prop + `$attrs` 透传**的组合
 *
 * ⚠️ `checkedChildren` / `unCheckedChildren` 是 `VNodeChild`：运行时 prop 声明必须
 *    用 `type: null as unknown as PropType<VNodeChild>` + 显式 `default: undefined`
 *    （规则 D21 —— 含 `Boolean` 的运行时类型会把「未传」转成 `false`，让内容整块消失）。
 */

import type { CSSProperties, VNodeChild } from 'vue';

/**
 * antd：`Exclude<SizeType, 'large'> | 'default'`。
 *
 * ⚠️ `'default'` **已废弃**（antd 的告警提示改用 `'medium'`），但仍在类型里 —— 保留
 * 并输出 deprecation 告警（规则 R4「枚举值与 antd 一致」，`COMPONENT-RULES.md` §4）。
 */
export type SwitchSize = 'small' | 'medium' | 'middle' | 'default';

/** 触发变更的事件（鼠标或键盘）。 */
export type SwitchEvent = MouseEvent | KeyboardEvent;

/**
 * ⚠️ 与 Radio / Checkbox 的**事件形状不同**：这是 `(checked, event)` 两个参数，
 * 不是 `{ target: {...}, nativeEvent }` 的事件对象。
 */
export type SwitchChangeEventHandler = (checked: boolean, event: SwitchEvent) => void;

/** antd：`SwitchClickEventHandler = SwitchChangeEventHandler`（同一签名）。 */
export type SwitchClickEventHandler = SwitchChangeEventHandler;

// ============================== 语义化 ==============================

/** antd 的 `SwitchSemanticType['classNames']`。 */
export interface SwitchSemanticClassNames {
  root?: string;
  content?: string;
  indicator?: string;
}

/** antd 的 `SwitchSemanticType['styles']`。 */
export interface SwitchSemanticStyles {
  root?: CSSProperties;
  content?: CSSProperties;
  indicator?: CSSProperties;
}

/** 语义化函数形态的入参（antd 的 `GenerateSemantic`）。 */
export interface SwitchSemanticContext {
  props: SwitchProps;
}

export type SwitchSemanticClassNamesFn = (
  context: SwitchSemanticContext,
) => SwitchSemanticClassNames;
export type SwitchSemanticStylesFn = (context: SwitchSemanticContext) => SwitchSemanticStyles;

// ============================== Switch ==============================

export interface SwitchProps {
  prefixCls?: string;
  size?: SwitchSize;
  className?: string;
  rootClassName?: string;
  /** 指定当前是否选中（受控）。 */
  checked?: boolean;
  /** 初始是否选中（非受控）。 */
  defaultChecked?: boolean;
  /** `checked` 的别名（antd `@since 5.12.0`）。 */
  value?: boolean;
  /** `defaultChecked` 的别名（antd `@since 5.12.0`）。 */
  defaultValue?: boolean;
  onChange?: SwitchChangeEventHandler;
  /**
   * ⚠️ 收到的是**结果值**（不是原生事件），且 disabled 时**仍会触发**
   *    —— rc-switch 的 legacy 行为，逐字对齐。
   */
  onClick?: SwitchClickEventHandler;
  /** 选中时的内容。 */
  checkedChildren?: VNodeChild;
  /** 未选中时的内容。 */
  unCheckedChildren?: VNodeChild;
  /** 失效状态；⚠️ `loading` 会**强制** disabled（`||` 判据）。 */
  disabled?: boolean;
  loading?: boolean;
  autoFocus?: boolean;
  style?: CSSProperties;
  title?: string;
  tabIndex?: number;
  id?: string;
  classNames?: SwitchSemanticClassNames | SwitchSemanticClassNamesFn;
  styles?: SwitchSemanticStyles | SwitchSemanticStylesFn;
}

/**
 * 暴露给父组件的实例。
 *
 * ⚠️ 与 antd 的**有意差异**（PLATFORM）：antd 的 `ref` 就是 `HTMLButtonElement` 本身
 * （`forwardRef<HTMLButtonElement>`），本仓按组件库惯例暴露对象并给出 `nativeElement`
 * （与 `Button` / `Empty` 等同形）—— 迁移时 `ref.current.focus()` 要写成
 * `ref.value.focus()` 或 `ref.value.nativeElement.focus()`。
 */
export interface SwitchRef {
  nativeElement: HTMLButtonElement | null;
  focus: (options?: FocusOptions) => void;
  blur: () => void;
}
