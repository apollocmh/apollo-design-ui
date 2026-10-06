/**
 * ColorPicker 的类型契约（G2 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/color-picker/interface.d.ts` + `es/color-picker/index.d.ts`
 * 与 rc 内核 `@rc-component/color-picker/es/interface.d.ts` —— **重新定义**，不搬运（H2）。
 * 判据逐条见 `docs/analysis/color-picker.md`（G1 产物）。禁 any / as any / @ts-expect-error（H10）。
 *
 * ── 与上游的三处结构性差异（都是判据，别"统一"）────────────────────────────────
 *
 * 1. **`ColorPickerProps = Omit<RcColorPickerProps, 7 个键> & {…自有} & Pick<PopoverProps, 4>`
 *    ⇒ 被 `Omit` 掉的 7 个键（`onChange` / `value` / `defaultValue` / `panelRender` /
 *    `disabledAlpha` / `onChangeComplete` / `components`）在本组件里是**重新声明**的，
 *    签名与 rc 那版**不同**（尤其 `onChange` 的第二个参数是 CSS 串，rc 的是 info 对象）。
 * 2. **语义槽是不对称的**：`classNames` 有 5 个（`popup` 是**嵌套对象**），
 *    `styles` 有 6 个（多一个 `popupOverlayInner`）。**别"补齐"成对称的**。
 * 3. **`popup` 是嵌套槽**（`popup: { root }`），且上游走
 *    `useMergeSemantic(..., { popup: { _default: 'root' } })` —— 只给 `popup.root`
 *    传值时 `root` 也吃到它。本仓的 `_internal/use-merge-semantic.ts` **不支持**
 *    `schema` 档（文件头明说「等出现第一个嵌套语义对象再实现」）⇒ 这一档由
 *    `ColorPicker.vue` **显式展开**，不依赖合并器（见该文件 §语义槽）。
 *
 * ── Vue 化映射（COMPATIBILITY.md）──────────────────────────────────────────────
 *
 * | React | Vue | 规则 |
 * |---|---|---|
 * | `value` + `onChange(color, css)` | `v-model:value` + `@change(color, css)`（**双发**） | C11 |
 * | `open` + `onOpenChange` | `v-model:open` + `@openChange`（**双发**） | C11 |
 * | `format` + `onFormatChange` | `v-model:format` + `@formatChange`（**双发**） | C11 |
 * | `onChangeComplete` / `onClear` | `@changeComplete` / `@clear`（纯通知，无 v-model） | C5 |
 * | `panelRender(panel, extra)` | **函数 prop + 同名 scoped slot 双通道** | C8 |
 * | `children`（覆盖触发器） | 默认插槽 | — |
 * | `ref` | ⚠️ **上游没有 ref**（`ColorPicker.d.ts` 是裸 `React.FC`，`ColorPicker.js` 里 `forwardRef` 出现 **0** 次）⇒ **本仓不 expose** | — |
 *
 * ── 为什么**不**声明 HTML 透传属性 ──────────────────────────────────────────────
 *
 * 根是 `<Popover>`（它自己渲染触发元素），原生属性由 `attrs` 兜住。
 * ⚠️ 代价是**未声明的自定义 prop 会静默进 attrs**（跨包判据 1）⇒
 * 上游 `ColorPickerProps` 的每一个键都必须在下面声明。
 */

import type { Component, CSSProperties, VNodeChild } from 'vue';
import type { TooltipArrow, TooltipPlacement } from '../tooltip/interface';
import type { AggregationColor } from './color';
import type { ColorGenInput, HSB, HSBA, RGB, RGBA, TransformOffset } from './engine/interface';

// ---------------------------------------------------------------------------
// 复用导出的引擎类型（消费方少写一个 import 路径）
// ---------------------------------------------------------------------------

export type { ColorGenInput, HSB, HSBA, RGB, RGBA, TransformOffset };

// ---------------------------------------------------------------------------
// 值类型（上游 `interface.ts` 的枚举与联合，值必须与 antd 一致）
// ---------------------------------------------------------------------------

/** 渐变段的**输入**形态（`color` 可以是字符串 / 颜色实例）。 */
export type Colors<T> = {
  color: ColorGenInput<T>;
  percent: number;
}[];

/** 三个格式常量。**值是判据**（会出现在 DOM 与 `@formatChange` 的载荷里）。 */
export const FORMAT_HEX = 'hex';
export const FORMAT_RGB = 'rgb';
export const FORMAT_HSB = 'hsb';

/** 输入区可切换的三种格式。 */
export type ColorFormatType = typeof FORMAT_HEX | typeof FORMAT_RGB | typeof FORMAT_HSB;

/** 预设面板的一组预设色。 */
export interface PresetsItem {
  /** 分组标题。 */
  label: VNodeChild;
  /** 该组的颜色（字符串 / 颜色实例 / 渐变）。 */
  colors: (string | AggregationColor | LineGradientType)[];
  /** 初始是否展开（默认 **`true`**）。 */
  defaultOpen?: boolean;
  /** 分组 key（不传则用下标）。 */
  key?: string | number;
}

/** 触发方式。⚠️ 只有两档（不像 Tooltip 有 4 档 + 数组）。 */
export type TriggerType = 'click' | 'hover';

/** 浮层对齐位置（= `TooltipPlacement` 的别名，上游注释「Alias, to prevent breaking changes」）。 */
export type TriggerPlacement = TooltipPlacement;

/** 单色值。 */
export type SingleValueType = AggregationColor | string;

/** 渐变值（`{ color, percent }[]`）。 */
export type LineGradientType = {
  color: SingleValueType;
  percent: number;
}[];

/** `value` / `defaultValue` 的全部合法形态。`null` 表示「空」。 */
export type ColorValueType = SingleValueType | null | LineGradientType;

/** 模式。 */
export type ModeType = 'single' | 'gradient';

// ---------------------------------------------------------------------------
// 语义槽（5 个 classNames / 6 个 styles —— **不对称**，别补齐）
// ---------------------------------------------------------------------------

export interface ColorPickerSemanticType {
  classNames?: {
    root?: string;
    body?: string;
    content?: string;
    description?: string;
    /** ⚠️ **嵌套槽**：`popup.root` 会经 `_default` 同时落到 `root`。 */
    popup?: { root?: string };
  };
  styles?: {
    root?: CSSProperties;
    body?: CSSProperties;
    content?: CSSProperties;
    description?: CSSProperties;
    /** ⚠️ 只有 `styles` 有它（映射到 Popover 的 `styles.container`）。 */
    popupOverlayInner?: CSSProperties;
    /** ⚠️ **嵌套槽**，同 `classNames.popup`。 */
    popup?: { root?: CSSProperties };
  };
}

/** 语义化类名（对象形态）。 */
export type ColorPickerSemanticClassNames = NonNullable<ColorPickerSemanticType['classNames']>;
/** 语义化样式（对象形态）。 */
export type ColorPickerSemanticStyles = NonNullable<ColorPickerSemanticType['styles']>;

/** 语义化输入：对象或函数（上游 `GenerateSemantic` 的 `classNamesAndFn` / `stylesAndFn`）。 */
export type ColorPickerSemanticValue<T, Props> = T | ((info: { props: Props }) => T);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** `panelRender` 的第二个参数（上游给两个**组件引用**）。 */
export interface ColorPickerPanelRenderExtra {
  components: {
    /** 取色面板（HSB + 滑块 + 渐变条）。 */
    Picker: Component;
    /** 预设面板。 */
    Presets: Component;
  };
}

export interface ColorPickerProps {
  // ============================================================ 值 / 模式
  /** 模式（单色 / 渐变，可多选）。默认 `'single'`。 */
  mode?: ModeType | ModeType[];
  /** 受控值。 */
  value?: ColorValueType;
  /** 非受控初值。⚠️ 都不传时上游取 **`#1677ff`**（引擎 `defaultColor`）。 */
  defaultValue?: ColorValueType;
  /** 当前格式（受控）。默认 `'hex'`。 */
  format?: ColorFormatType;
  /** 非受控初始格式。 */
  defaultFormat?: ColorFormatType;
  /** 是否禁用格式下拉（**下拉**没了，输入框仍在）。 */
  disabledFormat?: boolean;

  // ============================================================ 开合
  /** 受控开合。 */
  open?: boolean;
  /** 触发方式（默认 `'click'`）。 */
  trigger?: TriggerType;
  /** 浮层位置（默认 `'bottomLeft'`）。 */
  placement?: TriggerPlacement;
  /** 箭头（默认跟随 ConfigProvider）。 */
  arrow?: TooltipArrow;
  /** 挂载容器。 */
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  /** 溢出自动调整（默认 **`true`**）。 */
  autoAdjustOverflow?: boolean;
  /** ⚠️ 已废弃，请用 `destroyOnHidden`。 */
  destroyTooltipOnHide?: boolean | { keepParent?: boolean };
  /** 关闭后卸载浮层。 */
  destroyOnHidden?: boolean;

  // ============================================================ 能力
  /** 是否允许清空（显示清空按钮）。默认 `false`。 */
  allowClear?: boolean;
  /**
   * 是否禁用 alpha。
   *
   * 🚨 两条联动行为：① 面板里**不渲染** alpha 滑块与 alpha 输入；
   * ② 已是半透明色（`getColorAlpha < 100`）时，`onChange` / `onChangeComplete`
   * 拿到的值会被 `genAlphaColor` **改写**成 alpha=1（且开发期告警）。
   */
  disabledAlpha?: boolean;
  /** 预设面板（数组才渲染，且会多一条 `<Divider/>`）。 */
  presets?: PresetsItem[];
  /** 是否显示触发器右侧的文本。`true` 走 locale 文案，函数则自定义。 */
  showText?: boolean | ((color: AggregationColor) => VNodeChild);
  /** 尺寸（默认跟随 ConfigProvider）。 */
  size?: 'small' | 'middle' | 'large' | string;
  /** 禁用。 */
  disabled?: boolean;

  // ============================================================ 渲染
  /** 自定义面板。**函数 prop** 形态（C8 双通道，另有同名 scoped slot）。 */
  panelRender?: (panel: VNodeChild, extra: ColorPickerPanelRenderExtra) => VNodeChild;

  // ============================================================ 外观与语义槽
  /** 类名前缀。默认 = `getPrefixCls('color-picker')` = **`apollo-color-picker`**。 */
  prefixCls?: string;
  /** 语义化类名（5 槽，`popup` 嵌套）。支持**函数形态**。 */
  classNames?: ColorPickerSemanticValue<ColorPickerSemanticClassNames, ColorPickerProps>;
  /** 语义化样式（6 槽，`popup` 嵌套）。支持**函数形态**。 */
  styles?: ColorPickerSemanticValue<ColorPickerSemanticStyles, ColorPickerProps>;

  // ============================================================ 回调（prop 形态）
  //
  // ⚠️ 上游这些是 **prop**（不是事件）。本仓按 C11/C5 分流：
  //    状态型（value / open / format）走 `v-model` + 语义事件**双发**；
  //    纯通知型（change / changeComplete / clear）只发事件（`emit` 自己会调 `onXxx` prop）。
  // ----------------------------------------------------------------
  /** 开合变化（与 `update:open` 双发）。 */
  onOpenChange?: (open: boolean) => void;
  /** 格式变化（与 `update:format` 双发；⚠️ **同值不发**）。 */
  onFormatChange?: (format?: ColorFormatType) => void;
  /** 值变化。⚠️ 第二个参数是 `toCssString()` 的 CSS 串。 */
  onChange?: (value: AggregationColor, css: string) => void;
  /** 清空。 */
  onClear?: () => void;
  /**
   * 值变化**完成**（拖拽结束 / 非拖拽变化）。
   *
   * 🚨 **拖拽期间不发**（`changeFromPickerDrag` 为真时跳过）—— 见
   * `docs/analysis/color-picker.md` §2.2。
   */
  onChangeComplete?: (value: AggregationColor) => void;

  /** 触发器内容（传了就**完全不要**内置触发器，`rest` 也随之落空）。 */
  children?: VNodeChild;
}

// ---------------------------------------------------------------------------
// Emits
// ---------------------------------------------------------------------------

/**
 * 事件面。
 *
 * ⚠️ **C11：`v-model` 与语义事件必须同时发出**。三条发出路径：
 *
 * ```
 * triggerOpenChange(open):
 *   ⚠️ 禁用时「开」被吞掉（`!open || !disabled` 守卫），但「关」仍然放行
 *   update:open + openChange
 * triggerFormatChange(fmt):
 *   update:format + (⚠️ 只有 fmt !== 当前值 才发) formatChange
 * onInternalChange(color, css, fromDrag):
 *   update:value + change(color, css) + (⚠️ 非拖拽才发) changeComplete(color)
 * ```
 */
export interface ColorPickerEmits {
  /** `v-model:value`。 */
  'update:value': (value: AggregationColor) => void;
  /** 值变化（语义事件；第二个参数是 CSS 串）。 */
  change: (value: AggregationColor, css: string) => void;
  /** 值变化完成（拖拽期间不发）。 */
  changeComplete: (value: AggregationColor) => void;
  /** 清空。 */
  clear: () => void;
  /** `v-model:open`。 */
  'update:open': (open: boolean) => void;
  /** 开合变化。 */
  openChange: (open: boolean) => void;
  /**
   * `v-model:format`。
   *
   * ⚠️ 允许 `undefined`：上游 `triggerFormatChange(newFormat?)` 会把「无格式」写回状态
   * （`useControlledState(defaultFormat, format)`，`defaultFormat` 缺省是 `undefined`）。
   */
  'update:format': (format: ColorFormatType | undefined) => void;
  /** 格式变化（⚠️ 同值不发）。 */
  formatChange: (format: ColorFormatType | undefined) => void;
}

// ---------------------------------------------------------------------------
// Slots
// ---------------------------------------------------------------------------

/**
 * 插槽面。
 *
 * ⚠️ 上游 `ColorPickerProps` 里**没有** slot 型字段：`children` 是「覆盖触发器」，
 * `panelRender` 是函数 prop。这两个插槽是本仓按 C8 补的等价物。
 */
export interface ColorPickerSlots {
  /** 触发器内容（等价上游 `children`）。 */
  default?: () => VNodeChild;
  /** `panelRender` 的插槽形态。`props` 与函数 prop 的入参同形。 */
  panelRender?: (props: { panel: VNodeChild; extra: ColorPickerPanelRenderExtra }) => VNodeChild;
}

/**
 * 命令面 —— **空**。
 *
 * 🚨 上游 `ColorPicker` **没有任何 ref 转发**（`ColorPicker.d.ts` 是裸
 * `React.FC<ColorPickerProps>`，`ColorPicker.js` 里 `forwardRef` 出现 **0** 次）
 * ⇒ 本仓**不 expose**（补一个 `nativeElement` 会是上游没有的 API）。
 * 需要 DOM 的用例走 `wrapper.element`。
 */
export type ColorPickerExpose = Record<never, never>;
