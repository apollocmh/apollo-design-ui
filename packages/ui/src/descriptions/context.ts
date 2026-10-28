import type { ComputedRef, InjectionKey } from 'vue';
import type { DescriptionsSemanticClassNames, DescriptionsSemanticStyles } from './interface';

export interface DescriptionsContext {
  prefixCls: string;
  colon: boolean;
  classNames: DescriptionsSemanticClassNames;
  styles: DescriptionsSemanticStyles;
}
export const descriptionsContextKey: InjectionKey<ComputedRef<DescriptionsContext>> =
  Symbol('apolloDescriptions');
