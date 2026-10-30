/** Public rating props, Vue events, scoped slots and template-ref methods. */

import type { VNodeChild } from 'vue';
import type { TooltipProps } from '../tooltip/interface';

/** rc `Star.d.ts` 的渲染上下文（`#character` / `#characterRender` 的 slot props 面）。 */
export interface StarRenderInfo {
  /** 星序（0-based）。 */
  index: number;
  /** 当前展示值（hoverValue ?? value）。 */
  value: number;
  /** 是否允许半星。 */
  allowHalf: boolean;
  disabled?: boolean;
  /** 总星数。 */
  count: number;
  focused: boolean;
}

export interface RateProps {
  /** 主题前缀覆盖（getPrefixCls 的第二参）。 */
  prefixCls?: string;
  /** 当前值（受控；`v-model:value` 走 `update:value` 事件）。 */
  value?: number;
  /** 非受控初始值。 */
  defaultValue?: number;
  /** 星星总数。 */
  count?: number;
  /** 允许半星。 */
  allowHalf?: boolean;
  /** 再次点击同值清零（默认 true）。 */
  allowClear?: boolean;
  /** 键盘方向键控制（默认 true）。 */
  keyboard?: boolean;
  /** 禁用（与 DisabledContext 合并：显式值优先）。 */
  disabled?: boolean;
  /** 当前星项焦点入口的 tabIndex（disabled 时所有星项均为 -1）。 */
  tabIndex?: number;
  /** 挂载后自动聚焦。 */
  autoFocus?: boolean;
  /** 文本方向（rtl 时半星判据与左右键反向）。 */
  direction?: 'ltr' | 'rtl';
  /** 透传给根 ul 的 id。 */
  id?: string;
  /** `change` 事件；载荷为请求的新评分。 */
  onChange?: (value: number) => void;
  /** `update:value` 事件，供 `v-model:value` 使用。 */
  'onUpdate:value'?: (value: number) => void;
  /** `hoverChange` 事件（移出传 `undefined`）。 */
  onHoverChange?: (value: number | undefined) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;
  /** 每颗星的提示文案（string 或 TooltipProps 对象；数据 prop，C8-R2 豁免）。 */
  tooltips?: (TooltipProps | string)[];
  /** antd 尺寸语义：`-large` / `-small`（middle 不落类）。 */
  size?: 'large' | 'small' | 'middle';
}

export interface RateSlots {
  character?: (info: StarRenderInfo) => VNodeChild;
  characterRender?: (info: { node: VNodeChild; index: number }) => VNodeChild;
}

/** `ref` 的 expose 面（rc 的 RateRef）。 */
export interface RateRef {
  focus: () => void;
  blur: () => void;
}
