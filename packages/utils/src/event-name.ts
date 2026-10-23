/**
 * Compatibility event spelling helpers. Existing exports and mappings are retained.
 * onKeyDown becomes onKeydown for Vue binding, or keydown for addEventListener.
 * onDoubleClick maps to dblclick; onDragExit maps to dragleave.
 *
 * These helpers do not emulate synthetic events: change/input and focus/focusin
 * semantics must be handled by the consuming component. New Vue APIs should use
 * native event names directly. Historical source: @rc-component/util's event list;
 * the complete mapping and DOM0/DOM2 behavior remain covered by regression tests.
 */

/** 需要改名的例外。除此之外，`onXxx` 小写化即为 DOM 事件名。 */
const REACT_EVENT_OVERRIDES: Readonly<Record<string, string>> = {
  onDoubleClick: 'dblclick',
  onDragExit: 'dragleave',
};

/**
 * 名称能对上、但**语义**对不上的事件。值是对应的原生事件名。
 *
 * 这些**不做**自动转换 —— 转换反而会掩盖问题。组件必须显式处理。
 */
export const SEMANTIC_MISMATCH_EVENTS: Readonly<Record<string, string>> = {
  onChange: 'change',
  onFocus: 'focus',
  onBlur: 'blur',
};

/**
 * 把 React 合成事件名转成原生 DOM 事件名。
 *
 * @param reactEventName 形如 `onKeyDown` 的名字
 * @returns 原生事件名（如 `keydown`）；入参不是事件名时返回 `null`
 *
 * @example
 * toNativeEventName('onClick')       // 'click'
 * toNativeEventName('onKeyDown')     // 'keydown'
 * toNativeEventName('onDoubleClick') // 'dblclick'
 * toNativeEventName('className')     // null
 */
export function toNativeEventName(reactEventName: string): string | null {
  if (!isReactEventName(reactEventName)) {
    return null;
  }
  const override = REACT_EVENT_OVERRIDES[reactEventName];
  if (override) {
    return override;
  }
  return reactEventName.slice(2).toLowerCase();
}

/**
 * 把 React 合成事件名转成 **Vue 的规范事件键**（`on` + 首字母大写的原生事件名）。
 *
 * ---------------------------------------------------------------------------
 * 为什么必须是这个形态，而不是裸的原生事件名 —— 这是**实测**出来的，不是推理
 * ---------------------------------------------------------------------------
 *
 * 对同一个 `<input>` 分别绑定三种键，然后 `trigger('keydown')`：
 *
 *   | 绑定的键      | 是否触发 | Vue 实际走的路径                     |
 *   |--------------|---------|--------------------------------------|
 *   | `onKeyDown`  | **否**   | `addEventListener('key-down')`        |
 *   | `onkeydown`  | 是       | `el.onkeydown = fn`（DOM0 属性）      |
 *   | `onKeydown`  | 是       | `addEventListener('keydown')` ✅      |
 *
 * 第一版实现选了 `onkeydown`（裸原生名），**能跑但是错的**。四条理由：
 *
 *   1. 每个元素每个事件只有一个 DOM0 槽位 —— 后写覆盖先写，而 `addEventListener`
 *      允许并存。组件内部与用户各自绑一次是常态，DOM0 会静默丢一个。
 *   2. `shouldSetAsProp` 要求 `key in el`。不成立时（SVG / 自定义元素 / 未来新事件）
 *      会退化成 `patchAttr`，即设置一个 `onkeydown="function () { ... }"` **属性**，
 *      同样静默失效 —— 而我们当初就是为了消灭静默失效才做这个转换的。
 *   3. `pickAttrs` 的结果经常展开到**组件**而不是元素上。`onkeydown` 不会被 Vue 的
 *      `isOn` 认作监听器；`onKeydown` 会被认出来并进 `$attrs`，可以继续 `v-on` 转发。
 *   4. 它就是 Vue 自己把 `@keydown` 编译出来的形态 —— 与框架保持一致，不做第二套约定。
 *
 * ---------------------------------------------------------------------------
 * 推导
 * ---------------------------------------------------------------------------
 *
 *   `on` + `native` 的首字母大写。
 *
 * 因为白名单里全部 90 个事件的原生名都是**单个小写单词、无连字符**
 * （`keydown` / `compositionstart` / `gotpointercapture` …），所以
 * `hyphenate(name.slice(2))` 恰好还原成 native —— 这一点由测试枚举全部 90 个锁定。
 *
 * @example
 * toVueEventName('onClick')       // 'onClick'（单单词名本来就是对的，幂等）
 * toVueEventName('onKeyDown')     // 'onKeydown'
 * toVueEventName('onDoubleClick') // 'onDblclick'
 * toVueEventName('onDragExit')    // 'onDragleave'
 * toVueEventName('className')     // null
 */
export function toVueEventName(reactEventName: string): string | null {
  const native = toNativeEventName(reactEventName);
  if (!native) {
    return null;
  }
  return `on${native.charAt(0).toUpperCase()}${native.slice(1)}`;
}

/** 是不是 React 合成事件名（`on` + 大写字母开头）。 */
export function isReactEventName(name: string): boolean {
  return (
    name.length > 2 &&
    name.charCodeAt(0) === 111 /* o */ &&
    name.charCodeAt(1) === 110 /* n */ &&
    name.charCodeAt(2) >= 65 &&
    name.charCodeAt(2) <= 90
  );
}

/** 该事件名是否属于「名字能对上但语义不同」，需要组件显式处理。 */
export function needsSemanticHandling(reactEventName: string): boolean {
  return reactEventName in SEMANTIC_MISMATCH_EVENTS;
}

/** 供测试与文档使用：React 名 → 原生名的完整转换表（按需计算，不做模块级缓存）。 */
export function buildEventNameMap(reactEventNames: readonly string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const name of reactEventNames) {
    const native = toNativeEventName(name);
    if (native) map[name] = native;
  }
  return map;
}

/** 供测试与文档使用：React 名 → Vue 事件键的完整转换表。 */
export function buildVueEventNameMap(reactEventNames: readonly string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const name of reactEventNames) {
    const vueName = toVueEventName(name);
    if (vueName) map[name] = vueName;
  }
  return map;
}
