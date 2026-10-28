/** Apollo Breadcrumb public data, Vue content and semantic contracts. */
import type { VNodeChild } from 'vue';
import type { DropdownProps } from '../dropdown/interface';
import type { MenuItemType, MenuProps } from '../menu/interface';

export type BreadcrumbKey = string | number;
export type BreadcrumbParams = Record<string, unknown>;

export interface BreadcrumbItemType {
  key?: BreadcrumbKey;
  href?: string;
  /** Accumulated hash route; takes precedence over href when supplied. */
  path?: string;
  /** Strings substitute params; all other Vue content is rendered unchanged. */
  title?: VNodeChild;
  /** @deprecated Use title in items. Only the routes channel converts this field. */
  breadcrumbName?: string;
  menu?: BreadcrumbItemMenu;
  /** Class/style and native click belong to the default content element. */
  className?: string;
  style?: Record<string, string | number>;
  dropdownProps?: DropdownProps;
  onClick?: (event: MouseEvent) => void;
  /** @deprecated Use menu; routes converts one legacy child level. */
  children?: Omit<BreadcrumbItemType, 'children'>[];
  [key: `aria-${string}`]: string | number | boolean | undefined;
  [key: `data-${string}`]: string | undefined;
}

export interface BreadcrumbSeparatorType {
  type: 'separator';
  separator?: VNodeChild;
}
export type BreadcrumbItemInput = Partial<BreadcrumbItemType & BreadcrumbSeparatorType>;

/** Menu-item data preserves Menu's disabled, icon, extra and business event fields. */
export interface BreadcrumbMenuItem extends Omit<MenuItemType, 'key' | 'label' | 'title'> {
  key?: BreadcrumbKey;
  title?: VNodeChild;
  label?: VNodeChild;
  /** Relative to this breadcrumb href, or used directly when there is no base href. */
  path?: string;
  /** Explicit destination takes precedence over path. */
  href?: string;
}
export type BreadcrumbItemMenu = Omit<MenuProps, 'items'> & { items?: BreadcrumbMenuItem[] };

export interface BreadcrumbSemanticClassNames {
  root?: string;
  item?: string;
  separator?: string;
}
export interface BreadcrumbSemanticStyles {
  root?: Record<string, string | number>;
  item?: Record<string, string | number>;
  separator?: Record<string, string | number>;
}

export interface BreadcrumbProps {
  prefixCls?: string;
  classNames?:
    | BreadcrumbSemanticClassNames
    | ((info: { props: BreadcrumbProps }) => BreadcrumbSemanticClassNames);
  styles?:
    | BreadcrumbSemanticStyles
    | ((info: { props: BreadcrumbProps }) => BreadcrumbSemanticStyles);
  /** A provided empty array still takes precedence over routes and the default slot. */
  items?: BreadcrumbItemInput[];
  /** @deprecated Use items. */
  routes?: BreadcrumbItemInput[];
  params?: BreadcrumbParams;
  separator?: VNodeChild;
  dropdownIcon?: VNodeChild;
}

export interface BreadcrumbItemSlotProps {
  route: BreadcrumbItemInput;
  params: BreadcrumbParams;
  routes: BreadcrumbItemInput[];
  paths: string[];
  href?: string;
}
export interface BreadcrumbSlots {
  default?: () => VNodeChild;
  itemRender?: (props: BreadcrumbItemSlotProps) => VNodeChild;
  separator?: () => VNodeChild;
  dropdownIcon?: () => VNodeChild;
}
export interface BreadcrumbExpose {
  nativeElement: HTMLElement | null;
}
export type BreadcrumbRef = BreadcrumbExpose;

/** Native class/style, attrs and listeners belong to the owning li. */
export interface BreadcrumbItemProps {
  prefixCls?: string;
  href?: string;
  menu?: BreadcrumbItemMenu;
  dropdownProps?: DropdownProps;
  dropdownIcon?: VNodeChild;
  onClick?: (event: MouseEvent) => void;
  separator?: VNodeChild;
  key?: BreadcrumbKey;
}
export interface BreadcrumbItemSlots {
  default?: () => VNodeChild;
  separator?: () => VNodeChild;
  dropdownIcon?: () => VNodeChild;
}
/** Native attrs belong to the decorative li; present empty content suppresses the slash. */
export interface BreadcrumbSeparatorSlots {
  default?: () => VNodeChild;
}
