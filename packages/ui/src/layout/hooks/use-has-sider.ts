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

import type { VNode, VNodeChild } from 'vue';
import { SiderComponent } from '../Sider';

/** 展平一层 children（antd 的 `toArray(children)` + some）。 */
function hasSiderNode(nodes: VNodeChild | VNodeChild[] | undefined | null): boolean {
  if (nodes === undefined || nodes === null) return false;
  const list = Array.isArray(nodes) ? nodes : [nodes];
  return list.some((node) => {
    if (!node || typeof node !== 'object') return false;
    const vnode = node as VNode;
    // `type === Sider`（withInstall 返回同一对象，故只比这一个引用即可）
    return vnode.type === SiderComponent;
  });
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
