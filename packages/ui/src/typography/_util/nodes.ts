/**
 * 插槽节点的归一化 —— Vue 的 vnode 树 ↔ antd 的 `React.Children` 数组。
 *
 * ── 为什么必须有这一层 ────────────────────────────────────────────────────────
 *
 * antd 的 `Base/Ellipsis.tsx` 对 `children` 做两件事，两件都依赖 React 的
 * `React.Children.toArray`：
 *
 * ```js
 * const nodeList = toArray(text);                                  // 拍平 + 去掉 null/undefined
 * const nodeLen  = nodeList.reduce((n, node) => n + (isValidText(node) ? String(node).length : 1), 0);
 * ```
 *
 * `isValidText(node)` 判的是 `typeof node === 'string' | 'number'` —— 于是
 * **「一段文字」在 React 里是数组里的一个字符串元素，长度 = 字符数**。
 *
 * Vue 侧完全不同：`slots.default()` 返回的是 **vnode 数组**，纯文字会被包成
 * `Text` vnode（`children` 是那个字符串）。照搬 antd 的判据会得到
 * 「每个文字节点长度 = 1」，于是二分裁剪的起点与终点都错位。
 *
 * 所以本模块把 Vue 的形态**还原成 antd 的形态**：
 *
 * | Vue 输入 | 归一化结果 |
 * |---|---|
 * | `'hello'` / `0` | `'hello'` / `0`（原样，长度按字符数算） |
 * | `Text` vnode（`children` 为字符串） | 那个字符串 |
 * | `Fragment` vnode | 递归拍平 |
 * | `Comment` vnode（`v-if=false`、空插槽的占位） | 丢弃 |
 * | 元素 / 组件 vnode | 原样保留（长度算 1） |
 * | 数组 | 递归拍平 |
 * | `null` / `undefined` / `true` / `false` | 丢弃 |
 *
 * ⚠️ 这是**平台差异的落点**（PLATFORM），不是「顺手加的一层工具」。
 *    少了它，`<Text ellipsis={{expandable:true}}>一段很长的中文</Text>` 的
 *    二分裁剪会以「1 个字符」为总长，永远算不出该切哪里。
 *
 * ── 这个模块没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明与 `React.Children.toArray` **逐字节**等价：React 会把字符串子节点
 *     合并成一段、把 `false` 保留在数组里，这里丢弃 `false`（Vue 把它变成注释 vnode）。
 *     差别只在「长度算 0 还是 1」的极端边界上，且两侧的渲染结果本来就都是「什么都不画」。
 */

import { isVNode } from '@apollo-design/utils';
import { Comment, cloneVNode, Fragment, Text, type VNode, type VNodeChild } from 'vue';

/** 归一化后的节点。字符串 / 数字按字符数计长，其余按 1 计长。 */
export type TypographyNode = string | number | VNode;

/**
 * 可以直接当作 `h()` 的孩子的值。
 *
 * ⚠️ 与 `VNodeChild` 的唯一区别是**去掉了 `void`**：Vue 允许渲染函数返回 `void`
 *    （所以 `VNodeChild` 里有它），但 `h(type, props, children)` 的 `children`
 *    类型（内部叫 `RawChildren`，**未导出**）不含 `void`。
 *    于是「把渲染函数的返回值原样塞回 `h()`」这种写法会在类型上失败 ——
 *    这个别名就是那处落点。运行期两者完全一样。
 *
 * ⚠️ `| undefined` 不是多余的：`Exclude<T, void>` 会**同时**去掉 `undefined`
 *    （`undefined` 可赋值给 `void`），而 `h()` 的**数组**孩子是允许 `undefined` 的
 *    （`VNodeArrayChildren` 里有它）。漏了它，`renderEllipsis` 返回的
 *    `[..., suffix]`（`suffix?: string`）就装不进数组了。
 */
export type RenderableChild = Exclude<VNodeChild, void> | undefined;

/** `isValidText`（antd `Base/util.ts`）：只有字符串与数字是「可切」的。 */
export function isValidText(value: unknown): value is string | number {
  return typeof value === 'string' || typeof value === 'number';
}

/**
 * 把一个 `VNodeChild` 归一化成 antd 语义下的节点数组。
 *
 * 与 `React.Children.toArray` 的对应关系见文件头。
 */
export function toNodeList(value: VNodeChild): TypographyNode[] {
  const out: TypographyNode[] = [];

  const walk = (input: unknown): void => {
    if (input === null || input === undefined || typeof input === 'boolean') {
      return;
    }
    if (Array.isArray(input)) {
      for (const item of input) walk(item);
      return;
    }
    if (typeof input === 'string' || typeof input === 'number') {
      out.push(input);
      return;
    }
    if (!isVNode(input)) {
      return;
    }
    if (input.type === Comment) {
      return;
    }
    if (input.type === Fragment) {
      walk(input.children);
      return;
    }
    // Vue 的文本 vnode：`type` 是 `Text` 符号，`children` 就是那个字符串（数字已被
    // Vue 的 `normalizeVNode` 统一 `String()` 过）。还原成 antd 语义下的字符串元素。
    if (input.type === Text) {
      const text = input.children as unknown;
      if (typeof text === 'string') {
        if (text !== '') out.push(text);
        return;
      }
    }
    out.push(input);
  };

  walk(value);
  return out;
}

/** 节点数组的总长度。与 antd 的 `getNodesLen` 逐字对应。 */
export function getNodesLen(nodeList: readonly TypographyNode[]): number {
  let total = 0;
  for (const node of nodeList) {
    total += isValidText(node) ? String(node).length : 1;
  }
  return total;
}

/**
 * 按长度裁剪节点数组。与 antd 的 `sliceNodes` 逐字对应。
 *
 * ⚠️ 两个必须保留的细节：
 *   1. **没有裁剪时返回原数组本身**（不是副本）—— antd 的最后一行是 `return nodeList`。
 *      返回副本不会改变渲染结果，但会让「是否裁剪过」这件事无法从引用上判断。
 *   2. **裁剪发生在第一个「会超出」的节点上**，且只切这一个节点（`String(node).slice`）。
 *      后续节点整段丢弃。这与「二分查找的目标是字符下标」是配套的。
 */
export function sliceNodes(nodeList: readonly TypographyNode[], len: number): TypographyNode[] {
  let currLen = 0;
  const currentNodeList: TypographyNode[] = [];

  for (const node of nodeList) {
    if (currLen === len) {
      return currentNodeList;
    }

    const canCut = isValidText(node);
    const nodeLen = canCut ? String(node).length : 1;
    const nextLen = currLen + nodeLen;

    if (nextLen > len) {
      const restLen = len - currLen;
      currentNodeList.push(String(node).slice(0, restLen));
      return currentNodeList;
    }

    currentNodeList.push(node);
    currLen = nextLen;
  }

  return nodeList as TypographyNode[];
}

/**
 * 节点数组 → 可直接放进渲染树的孩子。
 *
 * ⚠️ **VNode 必须克隆**。Vue 的 VNode 是可变对象（patch 时会写 `el` / `component`），
 * 与 React 元素（不可变描述符）不同。ellipsis 的测量路径会把**同一份内容**同时渲染到
 * 「最终内容」与最多 4 个测量容器里；不克隆的话，第二个位置会把第一个位置的 DOM
 * **搬走**（Vue 的 `mountElement` 把同一个 `el` insert 到新容器），而不是复制一份。
 * 这是 `packages/ui/src/empty/components/NodeRenderer.ts` 里记的同一个坑。
 */
export function renderNodes(nodeList: readonly TypographyNode[]): RenderableChild[] {
  return cloneNodes(nodeList);
}

/**
 * 克隆一组「已经是可渲染孩子」的节点。
 *
 * 与 `renderNodes` 的区别只在类型：`renderNodes` 的入参是归一化后的
 * `TypographyNode[]`，这里收的是任意 `RenderableChild[]`（例如插槽返回的数组）。
 * 同一个 VNode 数组要在**同一次渲染里出现多次**时必须过这一层。
 */
export function cloneNodes(nodes: readonly RenderableChild[]): RenderableChild[] {
  return nodes.map((node) => (isVNode(node) ? cloneVNode(node) : node));
}
