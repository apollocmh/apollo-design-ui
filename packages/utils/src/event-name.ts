/**
 * React 合成事件名 → 原生 DOM 事件名。
 *
 * ===========================================================================
 * 为什么需要这个模块（这是 Phase 2 发现的最重要的跨组件风险，F1）
 * ===========================================================================
 *
 * antd 把 `onXxx` 通过 `pickAttrs` 透传给 React DOM，由 **React 的合成事件系统**做名称归一化：
 *
 *   React `onDoubleClick`  →  DOM `dblclick`
 *   React `onKeyDown`      →  DOM `keydown`
 *   React `onMouseEnter`   →  DOM `mouseenter`
 *
 * Vue 的 `runtime-dom` **不做这个归一化**。它对 `on*` 开头的键只做两件事：
 *   1. 用 `/^on[^a-z]/` 判断「这是不是事件监听」
 *   2. 对剩下的事件名调 `hyphenate()`（把大写字母变成 `-小写`）
 *
 * 于是：
 *
 *   `onKeyDown`    → 监听 `key-down`     → **永不触发**
 *   `onMouseEnter` → 监听 `mouse-enter`  → **永不触发**
 *   `onTouchStart` → 监听 `touch-start`  → **永不触发**
 *   `onDoubleClick`→ 监听 `double-click` → **永不触发**
 *
 * 这类 bug **不会报错、不会告警**，只会让事件静默失效 —— 是最难排查的一类。
 *
 * ⚠️ 修正后的输出形态必须是 **`onKeydown`**，不是裸的 `keydown`。
 *    第一版写成裸原生名（`onkeydown`）虽然也能触发，但走的是 DOM0 属性路径，
 *    有四条实质性缺陷 —— 实测表格与逐条理由见 `toVueEventName` 的注释。
 *    本模块因此提供两个函数：`toNativeEventName`（给 `addEventListener` 用）
 *    与 `toVueEventName`（给模板/`v-bind` 用，`pickAttrs` 用的是后者）。
 *
 * ===========================================================================
 * 规则（只需要两条，其余全靠小写化）
 * ===========================================================================
 *
 * 对 `@rc-component/util` 白名单里的全部 90 个事件名做过枚举验证（测试会锁定）：
 *
 *   1. 默认规则：`onXxxYyy` → `xxx yyy` 全部小写（`onKeyDown` → `keydown`）。
 *      这条规则覆盖 88/90。
 *   2. 例外只有 **2 个**，列在 `REACT_EVENT_OVERRIDES`：
 *      - `onDoubleClick` → `dblclick`（不是 `doubleclick`）
 *      - `onDragExit`    → `dragleave`（DOM **没有** `dragexit` 事件，React 是从 dragleave 合成的）
 *
 * 除这 2 个之外，全部 React 事件名小写化后恰好等于真实 DOM 事件名。
 * 这一点不显然（`onCompositionStart` → `compositionstart`、`onBeforeToggle` → `beforetoggle`、
 * `onGotPointerCapture` → `gotpointercapture`），所以用测试枚举锁定，而不是靠人记。
 *
 * ===========================================================================
 * ⚠️ 名字对得上 ≠ 语义对得上（无法在本模块修正，必须由组件显式处理）
 * ===========================================================================
 *
 *   | React 事件 | DOM 事件 | 语义差异 |
 *   |---|---|---|
 *   | `onChange` | `change` | React 在文本输入上等价于 **`input`**（每次击键）；原生 `change` 只在**失焦/提交**时触发 |
 *   | `onFocus`  | `focus`  | React 的 `onFocus` **冒泡**（等价 `focusin`）；原生 `focus` **不冒泡** |
 *   | `onBlur`   | `blur`   | 同上（等价 `focusout`） |
 *
 * 这三项列在 `SEMANTIC_MISMATCH_EVENTS`，供 `COMPONENT-RULES.md` 与 lint 检查引用。
 * **组件不得依赖透传来实现 onChange / onFocus / onBlur 的行为**，必须显式监听。
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
