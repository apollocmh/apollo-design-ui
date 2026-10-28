/**
 * `useHasSider` —— antd 的 `es/layout/hooks/useHasSider.js` 对应物。
 *
 * 判据顺序（**不可调换**）：
 *   1. `hasSider` 是 boolean ⇒ 原样返回（用户显式指定优先）
 *   2. 已注册的 sider 数 > 0 ⇒ true（运行时 register）
 *   3. children 里存在 `type === Sider` 的节点 ⇒ true（**首帧/SSR 也要成立**）
 *
 * ⚠️ 第 3 条是 SSR 契约：上游 `auto check hasSider` 用例用 `renderToString` 断言
 *    `ant-layout-has-sider`，那时 `addSider` 还没跑（mount 后才有）。
 */

import { Fragment, isVNode, type VNodeChild } from 'vue';
import { SiderComponent } from '../Sider';

/** 展平一层 children（antd 的 `toArray(children)` + some）。 */
function hasSiderNode(nodes: unknown): boolean {
  if (Array.isArray(nodes)) return nodes.some(hasSiderNode);
  if (!isVNode(nodes)) return false;
  if (nodes.type === SiderComponent) return true;
  // Fragments are transparent; a nested Layout owns its own Siders.
  return nodes.type === Fragment && hasSiderNode(nodes.children);
}

export function useHasSider(
  siders: string[],
  children: VNodeChild | VNodeChild[] | undefined | null,
  hasSider?: boolean,
): boolean {
  if (typeof hasSider === 'boolean') return hasSider;
  if (siders.length > 0) return true;
  return hasSiderNode(children);
}

export default useHasSider;
