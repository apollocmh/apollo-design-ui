import { type ComputedRef, type InjectionKey, inject, provide, type VNodeChild } from 'vue';
import type {
  CascaderPanelProps,
  CascaderSemanticClassNames,
  CascaderSemanticStyles,
} from './interface';
import type { BaseOptionType, FilledFieldNames, ValueCell } from './utils';
export interface CascaderContextProps {
  classNames: CascaderSemanticClassNames;
  styles: CascaderSemanticStyles;
  options: BaseOptionType[];
  fieldNames: FilledFieldNames;
  values: ValueCell[];
  halfValues: ValueCell[];
  changeOnSelect: boolean;
  onSelect: (path: ValueCell) => void;
  searchOptions: BaseOptionType[];
  loadData?: CascaderPanelProps['loadData'];
  expandTrigger: 'click' | 'hover';
  expandIcon: VNodeChild;
  loadingIcon: VNodeChild;
  popupMenuColumnStyle?: CascaderPanelProps['popupMenuColumnStyle'];
}
const KEY: InjectionKey<ComputedRef<CascaderContextProps>> = Symbol('CascaderContext');
export function provideCascaderContext(context: ComputedRef<CascaderContextProps>): void {
  provide(KEY, context);
}
export function useCascaderContext(): ComputedRef<CascaderContextProps> {
  const context = inject(KEY, null);
  if (!context) throw new Error('[Cascader] OptionList must be rendered inside a Cascader');
  return context;
}
export type { SearchConfig } from './hooks/search';
