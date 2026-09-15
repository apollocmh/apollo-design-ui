/**
 * `pickAttrs` —— 从 props 中挑出「应该透传到 DOM」的属性。
 *
 * 契约来源：`@rc-component/util/pickAttrs`（antd 侧 15 个组件直接使用）。
 * 白名单本身来自产物提取（见 `./pick-attrs-allowlist.ts` 的生成说明），
 * 不是手抄。
 *
 * ===========================================================================
 * ⚠️ 与 rc-util 的**有意行为差异**：事件键会被改写
 * ===========================================================================
 *
 * rc-util 输出的键是 **React 合成事件名**（`onKeyDown`），因为 React DOM 认识它。
 * Vue 的 runtime-dom 不认识 —— 它会把 `onKeyDown` 当成名为 `key-down` 的事件监听，
 * **永不触发**（详见 `./event-name.ts` 的说明）。
 *
 * 所以我们的输出把事件键改写成 **Vue 的规范事件键**（`onKeydown`）：
 *
 *   `onKeyDown`     → `onKeydown`
 *   `onDoubleClick` → `onDblclick`
 *   `onDragExit`    → `onDragleave`
 *   `onClick`       → `onClick`（单单词名本来就是对的，幂等）
 *
 * 注意**不是**裸的原生事件名（`onkeydown`）。那个形态虽然也能触发，但走 DOM0 属性路径，
 * 会丢监听器、在非 HTML 元素上静默退化成属性字符串。实测表格见 `toVueEventName`。
 *
 * 这是一条**对外可观测的行为差异**，已登记为 deviation。影响面远超 15 个直接使用者：
 * 任何 `v-bind="$attrs"` 到原生元素的组件都会遇到同一个问题。
 *
 * 转义方式：需要 React 原名时传 `{ rawEventNames: true }`（供迁移期对照与测试用）。
 *
 * ===========================================================================
 * 配置归一化（顺序敏感，不能改写成 `??`）
 * ===========================================================================
 *
 *   `false` / 不传  → `{ aria: true, data: true, attr: true }`
 *   `true`          → `{ aria: true }`（只要 aria，不要 data 与普通属性）
 *   `{...}`         → 原样展开（未给的键为 `undefined` → falsy）
 */

import { isReactEventName, toVueEventName } from './event-name';
import { PICK_ATTRS_ALL } from './pick-attrs-allowlist';

export interface PickConfig {
  /** 是否挑 `role` 与 `aria-*`。 */
  aria?: boolean;
  /** 是否挑 `data-*`。 */
  data?: boolean;
  /** 是否挑白名单里的普通属性与事件。 */
  attr?: boolean;
  /**
   * 事件键是否保持 React 原名（默认 `false`，即改写为 Vue 的规范事件键）。
   *
   * ⚠️ 只有「需要把结果交给 React 组件」或「做迁移对照」时才设为 `true`。
   *    在 Vue 里设为 `true` 会导致事件静默失效。
   */
  rawEventNames?: boolean;
}

const ARIA_PREFIX = 'aria-';
const DATA_PREFIX = 'data-';

function hasPrefix(key: string, prefix: string): boolean {
  return key.startsWith(prefix);
}

export default function pickAttrs(
  props: object,
  ariaOnly?: boolean | PickConfig,
): Record<string, unknown> {
  let config: PickConfig;
  if (ariaOnly === false || ariaOnly === undefined) {
    config = { aria: true, data: true, attr: true };
  } else if (ariaOnly === true) {
    config = { aria: true };
  } else {
    config = { ...ariaOnly };
  }

  const rawEventNames = config.rawEventNames === true;
  const attrs: Record<string, unknown> = {};

  for (const key of Object.keys(props)) {
    const matched =
      // Aria
      (config.aria && (key === 'role' || hasPrefix(key, ARIA_PREFIX))) ||
      // Data
      (config.data && hasPrefix(key, DATA_PREFIX)) ||
      // Attr / 事件
      (config.attr && PICK_ATTRS_ALL.has(key));

    if (!matched) continue;

    if (!rawEventNames && isReactEventName(key)) {
      const vueName = toVueEventName(key);
      if (vueName) {
        attrs[vueName] = (props as Record<string, unknown>)[key];
        continue;
      }
    }

    attrs[key] = (props as Record<string, unknown>)[key];
  }

  return attrs;
}
