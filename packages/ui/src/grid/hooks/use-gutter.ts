/**
 * useGutter —— 把 gutter prop 归一成 `[水平, 纵向]` 两个实值。
 *
 * 契约来源：antd 6.6.4 的 `es/grid/hooks/useGutter.js`（逐字对齐）。
 *
 * ── 两条最容易写错的判据 ─────────────────────────────────────────────────────
 *
 * 1. **响应式 gutter 的遍历方向**：`responsiveArray` 是**从大到小**
 *    （['xxxl',…,'xs']），命中第一个 `screens[bp] && g[bp] !== undefined` 的值。
 *    「从大到小」意味着**取的是 ≥ 当前屏幕的最接近断点的配置**。
 * 2. **screens 为 null/undefined 时的兜底**：全部断点视为 true —— 也就是
 *    SSR / 首帧时响应式 gutter **命中 xxxl**（数组第一个）。这是 antd 的
 *    原始行为（上游注释「By default use as `xs`」与实现不符，以实现为准）。
 */

import { isPlainObject } from '@apollo-design/utils';
import { responsiveArray, type Screens } from '../../_internal/responsive-observer';
import type { Gutter, GutterValue } from '../interface';

export default function useGutter(
  gutter: Gutter | undefined,
  screens: Screens | null,
): [GutterValue | undefined, GutterValue | undefined] {
  const results: [GutterValue | undefined, GutterValue | undefined] = [undefined, undefined];
  // antd: Array.isArray(gutter) ? gutter : [gutter, undefined]
  // 嵌套数组（gutter=[16,24] → 元素本身不是数组）不会出现在正常用法里；
  // 类型上 readonly 元素可能是数组形态，else 分支用 typeof 守卫收窄（antd 的
  // 隐式 any 假设了这一点）。
  const normalizedGutter: readonly (Gutter | undefined)[] = Array.isArray(gutter)
    ? gutter
    : [gutter, undefined];
  // By default use as `xs`（antd 原注释；实际实现是「全部 true」—— 见文件头）
  const mergedScreens: Screens = screens || {
    xs: true,
    sm: true,
    md: true,
    lg: true,
    xl: true,
    xxl: true,
    xxxl: true,
  };

  normalizedGutter.forEach((g, index) => {
    if (isPlainObject(g)) {
      const byScreen = g as Partial<Record<string, GutterValue>>;
      for (const breakpoint of responsiveArray) {
        if (mergedScreens[breakpoint] && byScreen[breakpoint] !== undefined) {
          results[index] = byScreen[breakpoint];
          break;
        }
      }
    } else if (typeof g === 'number' || typeof g === 'string') {
      results[index] = g;
    }
  });
  return results;
}
