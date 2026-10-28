import type { InjectionKey, VNodeChild } from 'vue';
import type { BreadcrumbSemanticClassNames, BreadcrumbSemanticStyles } from './interface';

/** Current owning Breadcrumb values; content functions are only invoked during render. */
export interface BreadcrumbContextValue {
  readonly prefixCls: string;
  readonly classNames: BreadcrumbSemanticClassNames;
  readonly styles: BreadcrumbSemanticStyles;
  separator: () => VNodeChild;
  dropdownIcon: () => VNodeChild;
}
export const breadcrumbContextKey: InjectionKey<BreadcrumbContextValue> =
  Symbol('apolloBreadcrumb');
