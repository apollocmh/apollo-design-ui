/**
 * Anchor 的组件内上下文（上游 `es/anchor/context.ts` 的 `AnchorContext`）。
 *
 * React 侧是 `React.createContext<AntAnchor | undefined>(undefined)`；
 * Vue 的对应物是 `InjectionKey` + `provide` / `inject`。
 *
 * ── 🚨 为什么提供的是 `reactive` 对象（而不是每帧新建一个）────────────────────
 *
 * 上游用 `useMemo(..., [activeLink, onClick, handleScrollTo, anchorDirection,
 * mergedStyles, mergedClassNames])` **每帧重建** context 值 —— React 的消费者
 * 靠 context 身份变化重渲染。
 *
 * Vue 里没有这回事：`inject` 只在 `setup` 期解析**一次**，之后拿到的是同一个对象。
 * ⇒ 子组件要在 `activeLink` 变化时重渲染，就必须**读到被追踪的响应式值**。
 * ⇒ 本仓提供一个**身份稳定**的 `reactive` 对象，用一个 `watchEffect` 把最新的值
 *    `Object.assign` 进去（`Spin.vue` / `Result.vue` 的 `semanticProps` 是同一手法，
 *    区别是那里不需要被追踪，所以用普通对象；这里必须用 `reactive`）。
 *
 * ⚠️ 这也是「Vue 的 provide 是快照」这一族差异的又一例（PITFALLS 20 / D27）。
 */

import type { InjectionKey } from 'vue';
import type {
  AnchorDirection,
  AnchorLinkInfo,
  AnchorSemanticClassNames,
  AnchorSemanticStyles,
} from './interface';

/** 上游 `AntAnchor` 的 Vue 对应物。 */
export interface AnchorContextValue {
  /** 链接挂载时登记（顺序 = 注册顺序 = DOM 顺序，`getInternalCurrentAnchor` 依赖它）。 */
  registerLink: (link: string, targetOffset?: number) => void;
  /** 链接卸载时注销。 */
  unregisterLink: (link: string) => void;
  /** 当前高亮（`getCurrentAnchor` **改写后**的值）。 */
  activeLink: string | null;
  /** 滚动到某个锚点（`targetOffset` 为该链接的覆盖值）。 */
  scrollTo: (link: string, targetOffset?: number) => void;
  /**
   * 点击回调（**自定义签名**，不是 DOM 事件 —— 见 `interface.ts` 的说明）。
   * 直接透传 `Anchor` 的 `onClick` prop。
   */
  onClick?: ((e: MouseEvent, link: AnchorLinkInfo) => void) | undefined;
  direction: AnchorDirection;
  classNames?: AnchorSemanticClassNames | undefined;
  styles?: AnchorSemanticStyles | undefined;
}

/** 注入键。用 Symbol 避免与用户自己的 provide 键冲突。 */
export const anchorContextKey: InjectionKey<AnchorContextValue> = Symbol('apolloAnchor');
