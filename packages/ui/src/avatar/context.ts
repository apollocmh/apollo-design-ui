/**
 * Avatar 的组件内上下文（上游 `es/avatar/AvatarContext.ts` 的 `AvatarContext`）。
 *
 * React 侧是 `React.createContext<AvatarContextType>({})`；Vue 的对应物是
 * `InjectionKey` + `provide` / `inject`。
 *
 * ── 只有两个字段（`size` / `shape`）────────────────────────────────────────────
 *
 * 上游的 `AvatarContextType` 就只有这两个；`prefixCls` 走 **`ConfigContext`**，
 * 其余全部走 **prop**。别把别的东西塞进来 —— 那会与上游的层级判断错位
 * （L4 的层数 / 类名断言会红）。
 *
 * ── 🚨 为什么提供的是 `reactive` 对象 ─────────────────────────────────────────
 *
 * `inject` 只在 `setup` 期解析**一次**，之后拿到的是同一个对象。子 `Avatar` 要在
 * `Avatar.Group` 的 `size` / `shape` **变化时**跟着变，就必须读到**被追踪的**值
 * ⇒ 提供身份稳定的 `reactive` 对象，用 `watchEffect` 把最新值 `Object.assign` 进去
 * （与 `Breadcrumb` / `Anchor` 的 `context.ts` **同一手法**，PITFALLS 20 / D27 家族）。
 *
 * ⚠️ 与 PITFALLS 256 的关系：那条说的是「本仓把外层 Provider 挪进组件 ⇒ 外层 `provide`
 *    对组件内部不生效」。这里**不涉及** —— `Avatar.Group` 是**组件内**自己 `provide`，
 *    `Avatar` 是它的后代，`inject` 正常生效。
 */

import type { InjectionKey } from 'vue';
import type { AvatarContextType } from './interface';

/** 上游 `AvatarContextType` 的 Vue 对应物。 */
export type AvatarContextValue = AvatarContextType;

/** 注入键。用 Symbol 避免与用户自己的 provide 键冲突。 */
export const avatarContextKey: InjectionKey<AvatarContextValue> = Symbol('apolloAvatar');
