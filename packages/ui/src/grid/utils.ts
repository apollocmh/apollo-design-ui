/**
 * Grid 的判据纯函数。
 *
 * 契约来源：antd 6.6.4 的 `es/grid/row.js` / `col.js` 内联函数（getMergedPropByScreen /
 * parseFlex），抽到独立文件供 L1 直接测试（affix 的 utils 范式）。
 */

import { isPlainObject, isString } from '@apollo-design/utils';
import { responsiveArray, type Screens } from '../_internal/responsive-observer';

/**
 * 响应式 prop 合并：字符串直通；对象按 responsiveArray **从大到小**找第一个
 * `screens[bp] && value !== undefined` 的值；都没有返回 `''`（antd 原样 ——
 * 空串在类名对象里是 falsy，不产生类名）。
 */
export function getMergedPropByScreen<T extends string>(
  oriProp: T | Partial<Record<string, T>> | undefined,
  screen: Screens | null,
): string {
  if (isString(oriProp)) {
    return oriProp;
  }
  if (isPlainObject(oriProp)) {
    const byScreen = oriProp as Record<string, string | undefined>;
    for (const breakpoint of responsiveArray) {
      if (!screen?.[breakpoint]) {
        continue;
      }
      const curVal = byScreen[breakpoint];
      if (curVal !== undefined) {
        return curVal;
      }
    }
  }
  return '';
}

/** 长度串：flex 可接受的「固定基准长度」写法（antd 的正则逐字）。 */
const FLEX_LENGTH_RE = /^\d+(\.\d+)?(px|em|rem|%)$/;

/**
 * flex prop → CSS flex 值（antd 的 parseFlex 逐字）：
 *   'auto' → '1 1 auto'；数字 → `${n} ${n} auto`；
 *   长度串 → `0 0 ${flex}`；其余原样。
 */
export function parseFlex(flex: string | number): string {
  if (flex === 'auto') {
    return '1 1 auto';
  }
  if (typeof flex === 'number') {
    return `${flex} ${flex} auto`;
  }
  if (FLEX_LENGTH_RE.test(flex)) {
    return `0 0 ${flex}`;
  }
  return flex;
}
