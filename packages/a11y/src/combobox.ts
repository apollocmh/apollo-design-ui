/**
 * combobox 的两类原语：`aria-activedescendant` 的 id 方案，与 typeahead 键盘搜索。
 *
 * 契约来源：
 *   - id 方案：`@rc-component/select@1.10.1/es/OptionList.js:237-281`
 *     并被 antd 的 DOM 快照印证
 *     （`components/config-provider/__tests__/__snapshots__/components.test.tsx.snap:23546`：
 *     `aria-controls="test-id_list"` / `aria-activedescendant="test-id_list_0"`）
 *   - typeahead：**上游没有**，见下面的 §typeahead 说明
 *
 * 本文件是纯函数：不涉及 DOM。
 */

// ===========================================================================
// aria-activedescendant 的 id 方案
// ===========================================================================

/**
 * 列表框（listbox）自身的 id —— 同时也是输入框 `aria-controls` 的取值。
 *
 * `OptionList.js:280`：`id: `${id}_list``
 */
export function getListboxId(id: string): string {
  return `${id}_list`;
}

/**
 * 第 `index` 个选项的 id —— 输入框 `aria-activedescendant` 的取值。
 *
 * `OptionList.js:251`：`id: `${id}_list_${index}``（group 项的 role 是 `presentation`，
 * 但 id 方案相同）。
 *
 * `${id}` 应来自 `useId`（已经在 `@apollo-design/utils`，本包不重复实现）。
 */
export function getOptionId(id: string, index: number): string {
  return `${id}_list_${index}`;
}

// ===========================================================================
// typeahead
// ===========================================================================

/**
 * 两次按键间隔超过这个毫秒数就重新起头。
 *
 * ⚠️ **上游没有对应实现**：antd 与 rc-* 全量搜索 `typeahead` 零命中，
 * rc-select 的「搜索」是 combobox 的过滤语义，不是「敲首字母跳到匹配项」。
 * 500ms 取自通用实践，见契约文档 §8 P1。
 */
export const DEFAULT_TYPEAHEAD_RESET_DELAY = 500;

export interface TypeaheadState {
  /** 累积的搜索串 */
  buffer: string;
  /** 上一次按键的时间戳（与 `now` 同一时基） */
  lastAt: number;
}

export const INITIAL_TYPEAHEAD_STATE: TypeaheadState = { buffer: '', lastAt: 0 };

/**
 * 按下一个字符后的新状态。
 *
 * 两条规则：
 *   1. 距上次按键超过 `resetDelay` ⇒ **重新起头**（buffer 只保留本次字符）
 *   2. 否则**累积**
 *
 * 「同字符循环」不用在这里特判：连续按同一个键会让 buffer 变成 `"a"` → `"aa"` → `"aaa"`，
 * 而前缀匹配 `"aa"` 通常比 `"a"` 命中更少 —— 真正的循环语义由调用方在
 * 「命中项没变时」自行决定是否复用同一个 buffer 继续 `findTypeaheadIndex`。
 *
 * 之所以不把它做成有状态的对象：调用方（Vue 组件）需要能把状态放进 ref 并在卸载时清掉，
 * 纯函数 + 不可变返回值最好测也最好组合。
 *
 * @param now        本次按键的时间戳
 * @param resetDelay 超时阈值（毫秒）；判定用 `>`，即「刚好等于」不算超时
 */
export function pushTypeaheadChar(
  state: TypeaheadState,
  char: string,
  now: number,
  resetDelay: number = DEFAULT_TYPEAHEAD_RESET_DELAY,
): TypeaheadState {
  const expired = now - state.lastAt > resetDelay;
  return {
    buffer: expired ? char : state.buffer + char,
    lastAt: now,
  };
}

/**
 * 这个按键是不是「要参与 typeahead」的可打印字符。
 *
 * 判据只有两条：
 *   1. 带修饰键（Ctrl / Meta / Alt）的一律不算 —— 那是快捷键，不是搜索
 *   2. `key.length === 1` —— 可打印字符的 `key` 恰好是一个字符；
 *      功能键（`'ArrowDown'` / `'Enter'` / `'Escape'`）长度都大于 1
 *
 * ⚠️ 刻意**不排除空格**：经典 typeahead 里空格是合法搜索字符。
 *    如果某个控件的空格另有语义（例如勾选），由调用方在派发前自行拦掉。
 *
 * ⚠️ 只读 `key` 不读 `keyCode`：后者已废弃，且 antd 自己在
 *    `rc-select/utils/keyUtil.js` 的注释里也记录了它在 Edge 上的 bug
 *    （见 https://github.com/ant-design/ant-design/issues/51292）。
 */
export function isTypeaheadKey(event: {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return false;
  }
  return event.key.length === 1;
}

/**
 * 从 `fromIndex` 的**下一项**开始全表找一圈，返回第一个以 `buffer` 开头的项。
 *
 * 搜索顺序：`fromIndex + 1 → … → count - 1 → 0 → … → fromIndex`（含 `fromIndex` 自身），
 * 共 `count` 次 —— 这就是「循环」：连按同一个键会依次跳到各个匹配项。
 *
 * @param labels    候选项的文本
 * @param buffer    搜索串；空串直接返回 `NO_ACTIVE_INDEX`
 * @param fromIndex 当前项下标；`-1` 表示还没有当前项（此时从 0 开始）
 * @returns 命中下标，未命中返回 `-1`
 */
export function findTypeaheadIndex(
  labels: readonly string[],
  buffer: string,
  fromIndex: number,
): number {
  const count = labels.length;
  if (!buffer || count === 0) {
    return -1;
  }

  const needle = buffer.toLowerCase();
  for (let step = 0; step < count; step += 1) {
    // 双重取模：`fromIndex` 可能小于 -1，单重取模会得到负数
    const index = (((fromIndex + 1 + step) % count) + count) % count;
    if (labels[index]?.toLowerCase().startsWith(needle)) {
      return index;
    }
  }

  return -1;
}
