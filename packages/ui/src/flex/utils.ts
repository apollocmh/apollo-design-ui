/**
 * Flex 的语义类名生成。
 *
 * 契约来源：antd 6.6.4 的 `es/flex/utils.js`（逐字对齐：三个枚举数组、
 * 三个 `genCls*` 的判据、`clsx` 的键值语义）。
 *
 * ⚠️ 类名生成吃的是 **mergedVertical**（antd 在 index.js 里传
 * `{...props, vertical: mergedVertical}`），不是裸 `props.vertical` ——
 * 这决定 `-align-stretch` 是否出现。调用方（`Flex.vue`）负责先合并方向。
 *
 * ⚠️ antd 用 `clsx` 处理 `{...genClsWrap(...), ...}` 的对象键值语义
 * （值为真 → 类名出现，按插入序拼接）。本仓库不为此引入新依赖
 * （PITFALLS #6：漏声明依赖会让 unbuild 报隐式依赖），
 * `joinTruthyKeys` 是该语义在「单对象入参」场景下的等价实现：
 * `Object.entries` 保序、过滤真值、空格拼接 —— 与 clsx 的输出逐字节一致。
 */

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
  alignCls[`${prefixCls}-align-stretch`] = !props.align && !!props.vertical;
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
