import type { CollapseMotionPreset } from '@apollo-design/motion';
import type { ComputedRef, InjectionKey, VNodeChild } from 'vue';
import type {
  CollapseExpandIconScope,
  CollapseHeadingLevel,
  CollapseSemanticClassNames,
  CollapseSemanticStyles,
  CollapseSize,
  CollapsibleType,
  ExpandIconPlacement,
} from './interface';
export interface CollapseContext {
  prefixCls: ComputedRef<string>;
  activeKeys: ComputedRef<string[]>;
  accordion: ComputedRef<boolean>;
  bordered: ComputedRef<boolean>;
  ghost: ComputedRef<boolean>;
  size: ComputedRef<CollapseSize>;
  placement: ComputedRef<ExpandIconPlacement>;
  direction: ComputedRef<'ltr' | 'rtl'>;
  collapsible: ComputedRef<CollapsibleType | undefined>;
  destroyOnHidden: ComputedRef<boolean>;
  headingLevel: ComputedRef<CollapseHeadingLevel>;
  classNames: ComputedRef<CollapseSemanticClassNames>;
  styles: ComputedRef<CollapseSemanticStyles>;
  motion: ComputedRef<CollapseMotionPreset>;
  supportMotion: ComputedRef<boolean>;
  allocateKey: () => string;
  toggle: (key: string) => void;
  focusRoot: () => void;
  icon: (scope: CollapseExpandIconScope) => VNodeChild;
}
export const collapseContextKey: InjectionKey<CollapseContext> = Symbol('apollo-collapse');
export function isHeadingLevel(value: unknown): value is CollapseHeadingLevel {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 6;
}
