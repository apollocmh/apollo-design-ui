/**
 * Dropdown 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 `es/dropdown/dropdown.d.ts` + `components/dropdown/dropdown.tsx`。
 * 按本仓 Vue 化约定重新定义（H2）：classNames/styles 收窄为静态对象形态
 * （函数式语义槽 PENDING，D36 同判）。
 */

import type { VNodeChild } from 'vue';

import type { MenuProps } from '../menu/interface';

export type DropdownPlacement =
  | 'topLeft'
  | 'topCenter'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomCenter'
  | 'bottomRight'
  | 'top'
  | 'bottom'
  | 'left'
  | 'leftTop'
  | 'leftBottom'
  | 'right'
  | 'rightTop'
  | 'rightBottom';

/** 实际可用的 placement（Center 系 deprecated ⇒ 归一到无 Center 形态）。 */
export type DropdownPopupPlacement = Exclude<DropdownPlacement, 'topCenter' | 'bottomCenter'>;

export interface DropdownArrowOptions {
  pointAtCenter?: boolean;
}

export type DropdownTriggerAction = 'click' | 'hover' | 'contextMenu';

export interface DropdownSemanticType {
  classNames?: {
    root?: string;
    item?: string;
    itemTitle?: string;
    itemIcon?: string;
    itemContent?: string;
  };
  styles?: {
    root?: Record<string, string | number>;
    item?: Record<string, string | number>;
    itemTitle?: Record<string, string | number>;
    itemIcon?: Record<string, string | number>;
    itemContent?: Record<string, string | number>;
  };
}

export interface DropdownProps {
  prefixCls?: string;
  /** 触发动作（默认 `['hover']`；`disabled` 时置空）。 */
  trigger?: DropdownTriggerAction[];
  /** 下拉内容（items 数据通道 —— 与 antd 的 menu prop 同名同构）。 */
  menu?: MenuProps;
  arrow?: boolean | DropdownArrowOptions;
  /** 受控开合（`v-model:open` 等价）。 */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, info: { source: 'trigger' | 'menu' }) => void;
  afterOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  placement?: DropdownPlacement;
  /** 动画名覆盖（默认按 placement 推 slide-up/down/left/right）。 */
  transitionName?: string;
  autoAdjustOverflow?: boolean;
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
  /** ⚠️ deprecated：用 `destroyOnHidden`。 */
  destroyPopupOnHide?: boolean;
  destroyOnHidden?: boolean;
  forceRender?: boolean;
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  popupRender?: (originNode: VNodeChild) => VNodeChild;
  /** ⚠️ deprecated：用 `popupRender`。 */
  dropdownRender?: (originNode: VNodeChild) => VNodeChild;
  /** ⚠️ deprecated：用 `classNames.root`。 */
  overlayClassName?: string;
  /** ⚠️ deprecated：用 `styles.root`。 */
  overlayStyle?: Record<string, string | number>;
  /**
   * 浮层根节点类名。
   *
   * ⚠️ Dropdown **没有自有 DOM 根**（渲染的是 Trigger + 浮层），所以这是**独立目标**
   *    （落浮层，不是「组件根」）⇒ 不随「根别名 → 原生 `class`」一起收敛。
   *    触发元素的类名请用原生 `class`。
   *
   * @deprecated 用 `classNames.root`（**同一个落点**）。上游 antd 6.6.4
   *   `es/dropdown/dropdown.d.ts:56` 就是这条 `@deprecated Use \`classNames.root\` instead`，
   *   本仓跟随（同 `image`）。
   */
  rootClassName?: string;
  openClassName?: string;
  id?: string;
  zIndex?: number;
  classNames?: DropdownSemanticType['classNames'];
  styles?: DropdownSemanticType['styles'];
}

/** DropdownButton 的 props（Button 面 + Dropdown 面的并集，redirect 字段收窄）。 */
export interface DropdownButtonProps {
  // Button 通道
  type?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
  size?: 'large' | 'middle' | 'small';
  loading?: boolean;
  danger?: boolean;
  icon?: VNodeChild;
  href?: string;
  target?: string;
  disabled?: boolean;
  onClick?: (e: MouseEvent) => void;
  // Dropdown 通道
  menu?: MenuProps;
  placement?: DropdownPlacement;
  trigger?: DropdownTriggerAction[];
  arrow?: boolean | DropdownArrowOptions;
  open?: boolean;
  onOpenChange?: (open: boolean, info: { source: 'trigger' | 'menu' }) => void;
  /** split：按钮与箭头分离（点击主钮 = onClick；箭头区触发下拉）。 */
  split?: boolean;
  /** ⚠️ deprecated：不再需要。 */
  buttonsRender?: (buttons: VNodeChild[]) => VNodeChild[];
  /** ⚠️ deprecated：直接写原生 attrs（`class` / `style` 会经 attrs 透传到根 div）。 */
  style?: Record<string, string | number>;
  autoAdjustOverflow?: boolean;
  destroyOnHidden?: boolean;
  forceRender?: boolean;
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  popupRender?: (originNode: VNodeChild) => VNodeChild;
  id?: string;
  zIndex?: number;
}
