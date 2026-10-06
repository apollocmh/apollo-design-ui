/**
 * Rate 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 `es/rate/index.d.ts`（RcRateProps）+ 壳的扩展字段
 * （rootClassName / tooltips / size），**重新定义**（H2），不复制搬运。
 *
 * C8-R2：antd 的 `character`（ReactNode）→ `#character` 插槽；
 * `characterRender`（fn）→ `#characterRender` 作用域插槽。`tooltips` 是数据 prop。
 */

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
  /** 根 ul 的 tabIndex（disabled 时强制 -1）。 */
  tabIndex?: number;
  /** 挂载后自动聚焦。 */
  autoFocus?: boolean;
  /** 文本方向（rtl 时半星判据与左右键反向）。 */
  direction?: 'ltr' | 'rtl';
  /** 透传给根 ul 的 id。 */
  id?: string;
  /** antd 的 `onChange` —— props 形态回调（本仓惯例，switch/radio 同判）。 */
  onChange?: (value: number) => void;
  /** antd 的 `onHoverChange`（移出传 `undefined`）。 */
  onHoverChange?: (value: number | undefined) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;
  /** 每颗星的提示文案（string 或 TooltipProps 对象；数据 prop，C8-R2 豁免）。 */
  tooltips?: (TooltipProps | string)[];
  /** antd 尺寸语义：`-large` / `-small`（middle 不落类）。 */
  size?: 'large' | 'small' | 'middle';
}

/** `ref` 的 expose 面（rc 的 RateRef）。 */
export interface RateRef {
  focus: () => void;
  blur: () => void;
}
