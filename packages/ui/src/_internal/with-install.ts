/**
 * 给组件挂 `install`，使其可被 `app.use(...)` 全局注册。
 *
 * 为什么需要：72 个组件都要求「既可以按需具名导入，也可以整包注册」。
 * 每个组件各写一遍 `install` 会漂移（有的漏了 `app.component` 的名字，有的直接挂 `app`）。
 *
 * 注册名取组件自身的 `name`（`defineOptions({ name: 'AEmpty' })`），
 * 与 COMPONENT-RULES.md 规则 R2 的约定一致 —— **不**用 `Empty`：
 * 本项目所有组件都带 `A` 前缀，避免与用户自己的组件重名。
 */

import type { App, Component, Plugin } from 'vue';

/** 带 `install` 的组件。 */
export type WithInstall<T extends Component> = T & Plugin;

export function withInstall<T extends Component>(component: T): WithInstall<T> {
  const target = component as WithInstall<T>;
  const name = (component as { name?: string }).name;
  target.install = (app: App): void => {
    if (!name) {
      throw new Error(
        '[apollo: withInstall] 组件没有 name，无法全局注册。' +
          '每个组件都必须用 defineOptions({ name: "A<Xxx>" }) 显式声明（COMPONENT-RULES.md 规则 R2）。',
      );
    }
    app.component(name, component);
  };
  return target;
}
