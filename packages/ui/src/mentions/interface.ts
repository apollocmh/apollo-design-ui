/**
 * Mentions 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 `components/mentions/index.tsx` 的类型段 +
 * `@rc-component/mentions@1.12.0` 的 `Mentions.d.ts` / `Option.d.ts`（**逐字段对齐**）。
 *
 * ── 上游的类型链（照抄，不简化）────────────────────────────────────────────────
 *
 * ```ts
 * MentionsProps = Omit<RcMentionsProps, 'suffix' | 'classNames' | 'styles'>
 * RcMentionsProps = BaseTextareaAttrs & { ...自有字段 }
 * BaseTextareaAttrs = Omit<TextAreaProps, 'prefix' | 'onChange' | 'onSelect' | 'showCount' | 'classNames'>
 * ```
 *
 * ⇒ 被 **Omit 掉**的键是 `prefix` / `onChange` / `onSelect` / `showCount` / `classNames`
 * （TextArea 层）+ `suffix` / `styles`（rc 层），然后由 Mentions 自己**重新声明**成
 * 自己的语义（`prefix` 从 `ReactNode` 变成 `string | string[]`、`onChange` 从事件变成字符串…）。
 * 本文件按同一套 Omit 语义手写（TS 的 `Omit` 保留，但类型源换成本仓的 `TextAreaProps`）。
 *
 * ── React → Vue 的四处固定映射（规则 C16 / C18 / D21 / D42）────────────────────
 *   `React.Key` → `string | number` · `React.ReactNode` → `VNodeChild` ·
 *   `React.CSSProperties` → Vue 的 `CSSProperties` · 事件走回调 prop（不声明 emits）。
 *
 * ⚠️ `suffix` **不在**公开面里（上游 Omit 掉了它，改由 `Form.Item` 的 `hasFeedback`
 *    注入）—— 但引擎层需要它，所以它只出现在 `engine/Mentions.ts` 的 props 上。
 */

import type { CSSProperties, VNodeChild } from 'vue';
import type { Variant } from '../config-provider/context';
import type { SizeType } from '../config-provider/size-context';
import type { TextAreaProps } from '../input/interface';
import type { InputStatus } from '../space/statusUtils';

/** 浮层方位（antd 只暴露这两个，内部的 right/left 由 direction 推导）。 */
export type MentionPlacement = 'top' | 'bottom';

// ============================== 候选项 ==============================

/** 数据驱动的候选项（`options` 的元素类型）。 */
export interface MentionsOptionProps {
  /** 选中后回填进文本的值。 */
  value: string;
  /** 展示内容（缺省时上游 `Menu` 不渲染文字）。 */
  label?: VNodeChild;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  /** 只用于 React 的 key / `data-menu-id`；本仓用计数器补足。 */
  key?: string | number;
}

/**
 * `Mentions.Option` 的 props。
 *
 * @deprecated 用 `options` + `MentionsOptionProps`。
 */
export interface OptionProps {
  value?: string;
  key?: string;
  disabled?: boolean;
  children?: VNodeChild;
  className?: string;
  style?: CSSProperties;
}

// ============================== 语义化 ==============================

export interface MentionsSemanticClassNames {
  root?: string;
  textarea?: string;
  popup?: string;
  suffix?: string;
}

export interface MentionsSemanticStyles {
  root?: CSSProperties;
  textarea?: CSSProperties;
  popup?: CSSProperties;
  suffix?: CSSProperties;
}

export interface MentionsSemanticContext {
  props: MentionsProps;
}

export type MentionsSemanticClassNamesFn = (
  context: MentionsSemanticContext,
) => MentionsSemanticClassNames;
export type MentionsSemanticStylesFn = (context: MentionsSemanticContext) => MentionsSemanticStyles;

// ============================== 公开 props ==============================

/**
 * 从 `TextAreaProps` 里 Omit 掉的键（上游的 `BaseTextareaAttrs`）。
 * 用常量元组表达，既给类型用，也给「逐条核对」用（见 `__tests__/index.test.ts` 的类型用例）。
 */
export type MentionsOmittedTextAreaKeys =
  | 'prefix'
  | 'onChange'
  | 'onSelect'
  | 'showCount'
  | 'classNames'
  /**
   * 上游在 **rc 层** Omit 掉它（`Omit<RcMentionsProps, 'suffix' | 'classNames' | 'styles'>`，
   * 而 rc 的 `RcMentionsProps` 自己重声明了 `styles`）⇒ 最终形态由 mentions 自己声明。
   */
  | 'styles';

/** 从 `TextAreaProps` 继承的底层面（去掉 5 个被重声明的键）。 */
type MentionsBaseTextareaAttrs = Omit<TextAreaProps, MentionsOmittedTextAreaKeys>;

/** antd `MentionProps`（= `MentionsProps`，两个名字都导出）。 */
export interface MentionsProps extends MentionsBaseTextareaAttrs {
  prefixCls?: string;
  rootClassName?: string;
  /** 受控值（配 `v-model:value`）。 */
  value?: string;
  defaultValue?: string;
  /** 尺寸。 */
  size?: SizeType;
  /** 候选加载中：面板显示 Spin，且 **Enter 不选中**（`silent`）。 */
  loading?: boolean;
  /** 校验状态（`Form.Item` 会注入）。 */
  status?: InputStatus;
  /** 候选项（数据驱动）。 */
  options?: MentionsOptionProps[];
  /** 浮层额外的类名。 */
  popupClassName?: string;
  /** 触发前缀，默认 `'@'`；可传数组。 */
  prefix?: string | string[];
  /** 分词符，默认 `' '`（同时是 `validateSearch` 的默认判据）。 */
  split?: string;
  /** 无候选时的内容。缺省 = `renderEmpty('Select')`。 */
  notFoundContent?: VNodeChild;
  /** 是否静默（`loading` 时置真）—— 置真后 Enter 不选中。 */
  silent?: boolean;
  /** 候选过滤。`false` ⇒ 全保留。 */
  filterOption?: false | ((input: string, option: MentionsOptionProps) => boolean);
  /** 搜索串是否合法（默认「不含 `split`」）。 */
  validateSearch?: (text: string, split: string) => boolean;
  /** 浮层方位，默认 `bottom`。 */
  placement?: MentionPlacement;
  /**
   * 浮层容器的挂载点。
   *
   * ⚠️ 上游类型是 `() => HTMLElement`（**不收触发元素**）；本仓 `Trigger` 收一个参数
   * ⇒ 引擎层做一层适配（见 `engine/KeywordTrigger.ts`）。
   */
  getPopupContainer?: () => HTMLElement;
  /** 自定义浮层渲染（收默认菜单，返回新节点）。 */
  popupRender?: (menu: VNodeChild) => VNodeChild;
  /** 浮层滚动回调。 */
  onPopupScroll?: (event: Event) => void;
  /** 值变化（**收字符串，不是事件**）。 */
  onChange?: (value: string) => void;
  /** 选中候选项。 */
  onSelect?: (option: MentionsOptionProps, prefix: string) => void;
  /** 搜索串变化（异步加载的入口）。 */
  onSearch?: (text: string, prefix: string) => void;
  /** @deprecated 用 `variant`。 */
  bordered?: boolean;
  variant?: Variant;
  classNames?: MentionsSemanticClassNames | MentionsSemanticClassNamesFn;
  styles?: MentionsSemanticStyles | MentionsSemanticStylesFn;
}

/** `MentionsProps` 的别名（上游两个名字都有）。 */
export type MentionProps = MentionsProps;

// ============================== Ref ==============================

export interface MentionsRef {
  focus: () => void;
  blur: () => void;
  /** @deprecated 上游标注「may not work as expected」。 */
  textarea: HTMLTextAreaElement | null;
  nativeElement: HTMLElement | null;
}

// ============================== getMentions ==============================

export interface MentionsConfig {
  prefix?: string | string[];
  split?: string;
}

export interface MentionsEntity {
  prefix: string;
  value: string;
}
