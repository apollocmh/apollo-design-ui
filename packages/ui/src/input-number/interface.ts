/**
 * InputNumber 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/input-number/index.d.ts`（80 行，**逐字段对齐**，
 * 其 Omit 清单：从 rc props 里 Omit `prefix` / `size` / `controls` /
 * `classNames` / `styles` 后重新声明）+ rc-input-number@1.6.2 的底层 props 面。
 *
 * 差异（`React.*` → Vue，规则 C16 / C18 / D21 / D42）：
 *   - `React.CSSProperties` → Vue 的 `CSSProperties`
 *   - `React.ReactNode` → `VNodeChild`（组件对象按 D42 归一化渲染）
 *   - `ValueType = string | number`
 *   - `onChange` 拆成 `v-model:value`（emit `update:value`）**与** attrs 里的
 *     `onChange` 回调 —— 两者同时发出（规则 C11 / PITFALLS 35）
 */

import type { CSSProperties, VNodeChild } from 'vue';
import type { Variant } from '../config-provider/context';
import type { InputStatus } from '../space/statusUtils';

/** antd 的 `ValueType`（rc 侧定义）：受控值的标量类型。 */
export type ValueType = string | number;

// ============================== 语义化 ==============================

/** antd 的 `InputNumberSemanticType['classNames']`（五个语义键，固定顺序）。 */
export interface InputNumberSemanticClassNames {
  root?: string;
  prefix?: string;
  suffix?: string;
  input?: string;
  actions?: string;
}

/** antd 的 `InputNumberSemanticType['styles']`。 */
export interface InputNumberSemanticStyles {
  root?: CSSProperties;
  prefix?: CSSProperties;
  suffix?: CSSProperties;
  input?: CSSProperties;
  actions?: CSSProperties;
}

/** 语义化函数形态的入参（antd 的 `GenerateSemantic`）。 */
export interface InputNumberSemanticContext {
  props: InputNumberProps;
}

export type InputNumberSemanticClassNamesFn = (
  context: InputNumberSemanticContext,
) => InputNumberSemanticClassNames;
export type InputNumberSemanticStylesFn = (
  context: InputNumberSemanticContext,
) => InputNumberSemanticStyles;

/** `controls` 的对象形态（自定义上下箭头图标）。 */
export interface InputNumberControls {
  upIcon?: VNodeChild;
  downIcon?: VNodeChild;
}

/** 展示形态（antd 6.0.0 新增 `mode`）。 */
export type InputNumberMode = 'input' | 'spinner';

/** `onStep` 的 info 入参。 */
export interface InputNumberStepInfo {
  offset: number | string;
  type: 'up' | 'down';
  emitter: 'handler' | 'keyboard' | 'wheel';
}

// ============================== Props ==============================

/**
 * antd 的 `InputNumberProps`。
 *
 * ⚠️ rc 底层的 `prefix` / `size` / `controls` / `classNames` / `styles` 被 antd
 * Omit 后重新声明 —— `prefix` 是展示前缀（不是 prefixCls 缩写）、`size` 换成
 * ConfigProvider 的三档。语义以此为准。
 */
export interface InputNumberProps {
  prefixCls?: string;
  /** 值（受控）。配合 `v-model:value` 使用。 */
  value?: ValueType | null;
  /** 初始值（非受控）。 */
  defaultValue?: ValueType;
  /** 最小值。不传 ⇒ 无下界。 */
  min?: ValueType;
  /** 最大值。不传 ⇒ 无上界。 */
  max?: ValueType;
  /** 步长，可为小数。默认 `1`。 */
  step?: ValueType;
  /** 键入 Enter 的回调（同步触发 flush）。 */
  onPressEnter?: (e: KeyboardEvent) => void;
  /** 步进回调（按钮 / 键盘 / 滚轮共用，`info.emitter` 区分来源）。 */
  onStep?: (value: number, info: InputNumberStepInfo) => void;
  /** 是否禁用键盘步进（↑/↓）。默认 `true`。 */
  keyboard?: boolean;
  /** 失焦时是否触发 `change`（把超界值回正）。默认 `true`。 */
  changeOnBlur?: boolean;
  /** 聚焦时允许滚轮步进（非 passive 监听）。默认 `false`。 */
  changeOnWheel?: boolean;
  /** 是否禁用。 */
  disabled?: boolean;
  /** 只读。 */
  readOnly?: boolean;
  /** 自动聚焦。 */
  autoFocus?: boolean;
  /** 字符值模式：开启高精度小数，`change` 返回 string。默认 `false`。 */
  stringMode?: boolean;
  /** 展示格式化（`info: { userTyping, input }`）。 */
  formatter?: (value: ValueType, info: { userTyping: boolean; input: string }) => string;
  /** 解析回数值（与 formatter 配对）。 */
  parser?: (string_: string) => string;
  /** 数值精度（键入中不生效）。 */
  precision?: number;
  /** 小数点符号（如 `','`）。 */
  decimalSeparator?: string;
  /** 占位符。 */
  placeholder?: string;
  /** 是否显示增减按钮 / 自定义上下图标。默认 `true`。 */
  controls?: boolean | InputNumberControls;
  /** 展示形态。默认 `'input'`。 */
  mode?: InputNumberMode;
  /** 前缀（D42：VNodeChild / 组件对象均可）。 */
  prefix?: VNodeChild;
  /** 后缀。 */
  suffix?: VNodeChild;
  /** 尺寸。 */
  size?: 'large' | 'medium' | 'middle' | 'small';
  /** 校验状态（Form.Item 内自动注入）。 */
  status?: InputStatus;
  /** 形态变体。默认 `'outlined'`。 */
  variant?: Variant;
  /** @deprecated 用 `variant` 替代。 */
  bordered?: boolean;
  /** @deprecated 用 `Space.Compact` 替代。 */
  addonBefore?: VNodeChild;
  /** @deprecated 用 `Space.Compact` 替代。 */
  addonAfter?: VNodeChild;
  classNames?: InputNumberSemanticClassNames | InputNumberSemanticClassNamesFn;
  styles?: InputNumberSemanticStyles | InputNumberSemanticStylesFn;
}

/** 暴露给父组件的实例（antd 的 `InputNumberRef`，rc 的 proxyObject 形状）。 */
export interface InputNumberRef {
  focus: (option?: { preventScroll?: boolean; cursor?: 'start' | 'end' | 'all' }) => void;
  blur: () => void;
  nativeElement: HTMLDivElement | null;
}
