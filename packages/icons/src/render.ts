/**
 * 图标抽象节点 → VNode 的渲染原语。
 *
 * 契约来源：`@ant-design/icons` 的 `renderUtils.ts`（`normalizeAttrs` / `generate` /
 * `isIconDefinition` / `warning` / `svgBaseProps`）。
 *
 * 与 antd 的差别只在**渲染器**：antd 用 `React.createElement` 递归，我们用 Vue 的 `h()` 递归。
 * 变量名、求值顺序、属性合并顺序都照搬 —— 因为属性合并顺序决定了最终 DOM 的属性顺序，
 * 而 DOM 契约（L4）要逐字对齐基线。
 */

import { warningOnce } from '@apollo-design/utils';
import { h, type VNode } from 'vue';
import type { AbstractNode, IconDefinition } from './types';

/** 图标节点的属性表。与 antd 的 `Attrs` 同构。 */
export type Attrs = Record<string, string>;

/** 告警前缀。与 antd 的 `[@ant-design/icons] ` 对应。 */
const WARNING_PREFIX = '[@apollo-design/icons] ';

/**
 * 条件告警。同一条消息只打印一次（去重表在 `@apollo-design/utils` 里，按 message 文本索引）。
 *
 * 复用 `utils.warningOnce` 而不是在本包再写一份：utils 的契约文档明确写着
 * 「测试会断言告警文本，前缀格式/去重范围有偏差会让告警一致性测试假通过」——
 * 复制一份等于把这条契约分叉成两份。本包只负责提供自己的前缀。
 */
export function warning(valid: boolean, message: string): void {
  warningOnce(valid, `${WARNING_PREFIX}${message}`);
}

/**
 * 判断一个值是否是合法的图标定义。
 *
 * ⚠️ 与 antd 逐字一致，包括**不检查 `icon` 是否为 null**（`typeof null === 'object'`）——
 * 这一条不是疏忽：`isIconDefinition` 是「结构够不够渲染」的判断，不是「数据对不对」的校验。
 */
export function isIconDefinition(target: unknown): target is IconDefinition {
  if (target === null || typeof target !== 'object') return false;
  const candidate = target as Partial<IconDefinition>;
  return (
    typeof candidate.name === 'string' &&
    typeof candidate.theme === 'string' &&
    (typeof candidate.icon === 'object' || typeof candidate.icon === 'function')
  );
}

/**
 * 属性名归一化。
 *
 * ⚠️ 与 antd 的 `normalizeAttrs` **行为不同**，这是本文件最容易抄错的一处。
 *
 * antd 的实现做两件事：`class` → `className`，其余 `dash-case` → `camelCase`。
 * 那是**为 React 服务的**：React 的属性名是 camelCase，由 React 自己把 `fillRule`
 * 渲染成规范的 `fill-rule`。
 *
 * 而 Vue 的 `h()` 拿到的键就是**最终写到 DOM 上的属性名**，原样 `setAttribute`。
 * 于是照抄 antd 会产出错的东西：
 *
 *   - 把 `fill-rule` 改成 `fillRule` → Vue 写出 `fillRule="evenodd"`。
 *     SVG 的规范属性名是 `fill-rule`，浏览器不认识 `fillRule`，**图标会画错**。
 *     实测 `@ant-design/icons-svg` 的节点属性里有 53 处 `fill-rule`、
 *     1 处 `fill-opacity`（`DotNetOutlined`）。这类错误能通过构建与类型检查，
 *     只有 L4 逐属性比对才会抓到 —— 本文件就是这么抓到它的。
 *   - `class` → `className` 同样错误：Vue 的类名属性就叫 `class`。
 *
 * 结论：**透传**。`@ant-design/icons-svg` 给出的属性名本来就是 SVG 的规范形式
 * （`viewBox` / `fill-rule` / `focusable` / `d` …），Vue 直接就能用。
 * 只把 React 侧的 `className` 折回 `class`，让这条平台差异在代码里显式可见。
 *
 * 这是 `AGENTS.md` H3（禁止机械翻译）在最小尺度上的一个实例：一行照抄的代价是
 * 「能构建、能过类型检查、但图标画错」。
 */
export function normalizeAttrs(attrs: Attrs = {}): Attrs {
  const normalized: Attrs = {};
  for (const [key, value] of Object.entries(attrs)) {
    normalized[key === 'className' ? 'class' : key] = value;
  }
  return normalized;
}

/**
 * 递归生成 VNode。
 *
 * 合并顺序与 antd 一致：**节点自身属性在前，`rootProps` 在后** ——
 * 后者胜出，所以 `data-icon` / `width` / `fill` 这些由组件控制的属性不会被图标数据覆盖。
 *
 * @param node 图标定义的抽象节点
 * @param key 稳定的 key 前缀。与 antd 一样带层级与下标，保证同一图标的兄弟节点顺序稳定
 * @param rootProps 根节点的附加属性（仅最外层传入）
 */
export function generate(
  node: AbstractNode,
  key: string,
  rootProps?: Record<string, unknown>,
): VNode {
  const children = (node.children ?? []).map((child, index) =>
    generate(child, `${key}-${node.tag}-${index}`),
  );
  return h(node.tag, { ...normalizeAttrs(node.attrs), ...rootProps, key }, children);
}

/**
 * 基础 Icon（`component` / `children` 形态）的 svg 属性。
 *
 * 注释里的参考链接与 antd 保留同一处，因为这条约束不直观：
 * 这几个属性决定 SVG 图标能否像普通文字一样参与基线对齐。
 *
 * @see https://blog.prototypr.io/align-svg-icons-to-text-and-say-goodbye-to-font-icons-d44b3d7b26b4
 */
export const svgBaseProps = {
  width: '1em',
  height: '1em',
  fill: 'currentColor',
  'aria-hidden': 'true',
  focusable: 'false',
} as const;

/**
 * 图标定义节点形态的 svg 根属性。
 *
 * 与 {@link svgBaseProps} 的差别是**不含 `focusable`**：走图标定义路径时，
 * `focusable="false"` 已经由 `@ant-design/icons-svg` 的节点属性提供（`normalizeAttrs` 会带上它）。
 * antd 的 `IconBase` 同样是这个写法 —— 两处属性表看起来重复，实际各自对应一条渲染路径。
 */
export const iconBaseSvgProps = {
  width: '1em',
  height: '1em',
  fill: 'currentColor',
  'aria-hidden': 'true',
} as const;
