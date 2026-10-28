// Initial class/rule reference: Ant Design 6.6.4 (MIT); docs/analysis/flex.md.
// Current behavior is defined by Apollo public contracts.
/** Semantic classes for the current resolved Flex direction and public CSS values. */

import type { FlexAlign, FlexJustify, FlexProps, FlexWrap } from './interface';

/** `clsx({...})` 单对象入参的等价实现（见文件头）。 */
const joinTruthyKeys = (obj: Record<string, unknown>): string =>
  Object.entries(obj)
    .filter(([, value]) => value)
    .map(([key]) => key)
    .join(' ');

export const flexWrapValues: FlexWrap[] = ['wrap', 'nowrap', 'wrap-reverse'];

export const justifyContentValues: FlexJustify[] = [
  'flex-start',
  'flex-end',
  'start',
  'end',
  'center',
  'space-between',
  'space-around',
  'space-evenly',
  'stretch',
  'normal',
  'left',
  'right',
];

export const alignItemsValues: FlexAlign[] = [
  'center',
  'start',
  'end',
  'flex-start',
  'flex-end',
  'self-start',
  'self-end',
  'baseline',
  'normal',
  'stretch',
];

const genClsWrap = (prefixCls: string, props: FlexProps) => {
  const wrap = props.wrap === true ? 'wrap' : props.wrap;
  return {
    [`${prefixCls}-wrap-${wrap}`]: wrap && flexWrapValues.includes(wrap),
  };
};

const genClsAlign = (prefixCls: string, props: FlexProps) => {
  const alignCls: Record<string, boolean> = {};
  alignItemsValues.forEach((cssKey) => {
    alignCls[`${prefixCls}-align-${cssKey}`] = props.align === cssKey;
  });
  if (!props.align && props.vertical) alignCls[`${prefixCls}-align-stretch`] = true;
  return alignCls;
};

const genClsJustify = (prefixCls: string, props: FlexProps) => {
  const justifyCls: Record<string, boolean> = {};
  justifyContentValues.forEach((cssKey) => {
    justifyCls[`${prefixCls}-justify-${cssKey}`] = props.justify === cssKey;
  });
  return justifyCls;
};

const createFlexClassNames = (prefixCls: string, props: FlexProps): string => {
  return joinTruthyKeys({
    ...genClsWrap(prefixCls, props),
    ...genClsAlign(prefixCls, props),
    ...genClsJustify(prefixCls, props),
  });
};

export default createFlexClassNames;
