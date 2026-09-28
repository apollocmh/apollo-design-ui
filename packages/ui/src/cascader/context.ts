/**
 * CascaderContext —— rc `context.js` 的 Vue 版（provide/inject）。
 *
 * OptionList / Panel 从这里读「级联状态」（options / values / onSelect / 搜索结果 /
 * 展开图标 / 列样式 …），与 rc 的 Context.Provider 同构。
 */

import type { InjectionKey, VNodeChild } from 'vue';
import { inject, provide } from 'vue';

import type { SearchConfig } from './hooks/search';
import type { BaseOptionType, FilledFieldNames, ValueCell } from './utils';

export interface CascaderContextProps {
  classNames?: Record<string, unknown>;
  styles?: Record<string, unknown>;
  options: BaseOptionType[];
  fieldNames: FilledFieldNames;
  /** 勾选值（多选；单选时为 [当前路径]） */
  values: ValueCell[];
  halfValues: ValueCell[];
  changeOnSelect?: boolean;
  onSelect: (valuePath: ValueCell) => void;
  checkable?: boolean | unknown;
  searchOptions: BaseOptionType[];
  popupPrefixCls?: string;
  loadData?: (options: BaseOptionType[]) => void;
  expandTrigger?: 'click' | 'hover';
  expandIcon?: VNodeChild | null;
  loadingIcon?: VNodeChild | null;
  popupMenuColumnStyle?: Record<string, string | number>;
  optionRender?: ((option: BaseOptionType) => VNodeChild) | null;
}

const KEY: InjectionKey<CascaderContextProps> = Symbol('CascaderContext');

export function provideCascaderContext(props: CascaderContextProps): void {
  provide(KEY, props);
}

export function useCascaderContext(): CascaderContextProps {
  const ctx = inject(KEY, null);
  if (!ctx) {
    throw new Error('[cascader] CascaderContext 缺失 —— OptionList 必须在 Cascader 内渲染');
  }
  return ctx;
}

export type { SearchConfig };
