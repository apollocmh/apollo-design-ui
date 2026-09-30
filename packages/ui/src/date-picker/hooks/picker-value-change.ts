/**
 * 提交时机的状态机（G4 · S2 剩余 / S4 的内核）—— 上游 `@rc-component/picker` 的
 * `PickerInput/hooks/useRangeValueChange.js`（**405 行**）的 Vue 移植。
 *
 * 契约来源：读源码 + `.d.ts` 的注释（**重新定义**，不搬运实现，H2）。
 *
 * ── 它解决什么 ──────────────────────────────────────────────────────────────
 *
 * `useRangeValue` 只管「提交四道校验」，**不管「什么时候该提交」**。
 * 后者由本模块负责：把每一种**交互来源**（`source`）解析成唯一一个 **action**，
 * 再在**一个地方**统一执行 —— 事件来源本身不直接提交或回滚值。
 *
 * ```
 * source × needConfirm × allowEmpty × index  ──resolveAction──▶  action  ──▶  执行
 * ```
 *
 * ── 三份簿记（缺一不可，且**只有本模块**知道它们）────────────────────────────
 *
 * | 簿记 | 含义 | 为什么需要 |
 * |---|---|---|
 * | `triggeredFields` | 本轮交互里**参与过**的 field + 各自是否被改过 | `submitField` 靠「都参与过」决定要不要发最终 `onChange` |
 * | `confirmedIndex` | 最后一个被**显式确认**的 field | `triggeredFields` 同时记 focus，分不清「确认过的值」与「只聚焦过的值」 |
 * | `isLastInput` | 最近一次值更新是否来自 `input` | `popupClose` 的 focus 强弱取决于它（**它消费**上一次来源，自身不覆盖） |
 *
 * ── 🚨 三条移植时必须注意的语义 ──────────────────────────────────────────────
 *
 * 1. **`currentIndex` 必须在入口取快照**。上游 `let currentIndex = getCurrentIndex()`
 *    之后可能把它改成 `index`，而 `resolveAction` 收到的是**改过之后**的局部变量。
 *    Vue 里 `currentIndex` 是 `ref`（**活读**）⇒ 照字面顺序写会读到新值，
 *    分支全错（PITFALLS 207 同族）。本文件用 `snapshotIndex` 局部变量。
 * 2. **`isLastInput` 只被「非 `popupClose`」的事件写**（上游注释：
 *    `popupClose` consumes the previous update type instead of replacing it）。
 *    写成无条件赋值会让 `popupClose` 的 focus 判定恒假。
 * 3. **`resetValue` 在单值下忽略 index**。上游 `SinglePicker` 的
 *    `resetFieldValue = () => { resetValue(); }` **丢掉**了 state machine 传进来的
 *    `actionIndex` ⇒ 单值恒为「全量回滚」。这是上游的真实行为，照抄
 *    （`fieldCount === 1` 时两者等价，但别以为传了 index 就只回滚一个 field）。
 *
 * ── 与 S4 的关系 ────────────────────────────────────────────────────────────
 *
 * `field-switch` 那一条分支（`allowEmpty` / `confirmedIndex` / `resetCurrentAndSwitchNext`）
 * 就是**键盘字段导航**的调度逻辑 —— 它属于 S4，但**与本模块不可分割**：
 * 拆成两轮做必然产生「时机半对」的静默 bug。`-input-active` 的分段**渲染**才是 S4 剩下的部分。
 *
 * ── 两个 key 的顺序（`switchNext` 的 focus 强弱）──────────────────────────────
 *
 * 上游逐字：`A || B || C || (D && E)`（`&&` 优先级更高）。写成
 * `(A || B || C || D) && E` 会让「面板操作后的关浮层」漏掉强 focus。
 */

import { type ComputedRef, computed, type Ref, ref } from 'vue';

/** 变更来源（上游 `RangeValueChangeSource`，逐字）。 */
export type RangeValueChangeSource =
  | 'input'
  | 'remove'
  | 'keyboard-submit'
  | 'keyboard-submit-weak'
  | 'esc'
  | 'panel-intermediate'
  | 'panel-final'
  | 'popupClose'
  | 'field-switch'
  | 'confirm';

/** 解析出的操作（上游 `RangeValueChangeAction`，逐字）。 */
export type RangeValueChangeAction =
  | 'modify'
  | 'submitCurrent'
  | 'switchNext'
  | 'finish'
  | 'abort'
  | 'resetCurrent'
  | 'resetCurrentAndSwitchNext'
  | 'resetAll';

/** 簿记项：某个 field 在本轮交互里**是否被改过**。 */
export interface TriggeredField {
  index: number;
  modified: boolean;
}

/** {@link resolveAction} 的入参（把上游闭包里的三份簿记显式化，便于 L1 直接测）。 */
export interface ResolveActionInput {
  fieldCount: number;
  needConfirm: boolean;
  /** 逐 field 的「允许为空」（单值固定 `[false]`）。 */
  allowEmpty: readonly boolean[];
  /** 当前 field 的日历值（上游 `getCalendarValue()[currentIndex]`）。 */
  currentFieldValue: unknown;
  /** 当前 field；`null` = 本轮还没有交互。 */
  currentIndex: number | null;
  /** 本次事件针对的 field。 */
  index: number;
  source: RangeValueChangeSource;
  /** 事件带的值；`undefined` ⇒ 用 `currentFieldValue`（上游 `value === undefined` 那一支）。 */
  value: unknown;
  triggeredFields: readonly TriggeredField[];
  confirmedIndex: number | null;
}

/**
 * **唯一**的「事件 → 操作」解析（上游 `resolveAction`，逐字）。
 *
 * 纯函数：只读入参，**不改任何状态** —— 状态只在执行 action 时改。
 * 这样「事件来源」永远不会自作主张地提交或回滚。
 */
export function resolveAction(input: ResolveActionInput): RangeValueChangeAction {
  const { fieldCount, needConfirm, allowEmpty, currentIndex, index, source } = input;
  const { currentFieldValue, value, triggeredFields, confirmedIndex } = input;

  // `esc` 恒为「全部回滚」——不看 field、不看值
  if (source === 'esc') {
    return 'resetAll';
  }

  // 本轮还没有当前 field：`popupClose` 仍要清理受控值留下的临时值
  if (currentIndex === null) {
    return source === 'popupClose' ? 'resetAll' : 'abort';
  }

  // ⚠️ 上游判据是 `value === undefined`（不是 truthy）⇒ `null` 算「显式给了空值」
  const currentValue = value === undefined ? currentFieldValue : value;
  const currentEmpty = currentValue === null || currentValue === undefined;
  const canSwitch = !currentEmpty || allowEmpty[currentIndex] === true;
  // `remove` 例外：**即使 field 不允许为空**，也要提交删除后的值
  const canSubmit = source === 'remove' || canSwitch;

  // ---------------------------------------------------------------- field-switch
  if (source === 'field-switch') {
    // 只允许按循环顺序推进**一格**
    if (index === currentIndex) {
      return 'abort';
    }
    const nextIndex = (currentIndex + 1) % fieldCount;
    if (index !== nextIndex) {
      return 'abort';
    }
    const nextFieldTriggered = triggeredFields.some((field) => field.index === nextIndex);

    if (needConfirm) {
      // 已显式确认过当前 field ⇒ 可以直接走
      if (confirmedIndex === currentIndex) {
        return 'switchNext';
      }
      // 允许为空的 field 可以「未确认就离开」，但离开前要丢弃未确认的临时值
      return allowEmpty[currentIndex] === true ? 'resetCurrentAndSwitchNext' : 'abort';
    }
    if (canSwitch) {
      return 'switchNext';
    }
    // 再次进入已触发过的 next ⇒ 开启新一轮：先丢弃当前无效 field 并结束旧一轮
    return nextFieldTriggered ? 'resetCurrentAndSwitchNext' : 'resetCurrent';
  }

  // ------------------------------------------------- 其余来源必须指向当前 field
  if (index !== currentIndex) {
    return 'abort';
  }

  // ------------------------------------------------------------------ popupClose
  if (source === 'popupClose') {
    const interactionModified = triggeredFields.some((field) => field.modified);
    // 整轮都没改过 ⇒ 直接收工（**不动值**）
    if (!interactionModified) {
      return 'finish';
    }
    if (needConfirm) {
      const currentModified = triggeredFields.some(
        (field) => field.index === currentIndex && field.modified,
      );
      const allFieldsTriggered = triggeredFields.length >= fieldCount;
      // 还有 field 没参与过 / 当前 field 无值且不允许为空 ⇒ 全部丢弃
      if (!allFieldsTriggered || !canSwitch) {
        return 'resetAll';
      }
      if (currentModified) {
        return allowEmpty[currentIndex] === true ? 'resetCurrentAndSwitchNext' : 'resetAll';
      }
      return 'switchNext';
    }
    if (!canSubmit) {
      return 'resetAll';
    }
    return 'switchNext';
  }

  if (source === 'input' || source === 'panel-intermediate') {
    return 'modify';
  }
  // 面板「走完了」（无确认制）⇒ 直接推进；有确认制 ⇒ 只改值
  if (source === 'panel-final') {
    return needConfirm ? 'modify' : 'switchNext';
  }
  if (source === 'keyboard-submit-weak') {
    return canSubmit ? 'submitCurrent' : 'abort';
  }
  if (source === 'keyboard-submit' || source === 'confirm' || source === 'remove') {
    return canSubmit ? 'switchNext' : 'abort';
  }
  return 'abort';
}

export interface UseRangeValueChangeOptions {
  /** field 数：单值 `1`，范围 `2`。 */
  fieldCount: number;
  /**
   * 是否需要「确定」才提交。
   *
   * ⚠️ 传 **getter** 而不是值：上游每次渲染都重新读它（hook 被重新调用），
   * 传值会让响应式变更失效（PITFALLS 207 同族）。
   */
  needConfirm: () => boolean;
  /** 逐 field 的「允许为空」（单值固定 `[false]`）。同上，传 getter。 */
  allowEmpty: () => readonly boolean[];
  /**
   * 读**字段化**的临时日历值。
   *
   * ⚠️ 单值上游传的是 `[values.length ? values : null]` —— 元素 0 是**整组值**
   * （数组）或 `null`，不是单个日期。`currentEmpty` 的判定依赖这一点。
   */
  getCalendarValue: () => readonly unknown[];
  /** 写某个 field 的临时值（单值：整组覆盖，上游 `_index` 被丢弃）。 */
  triggerCalendarChange: (index: number, value: unknown) => void;
  /** 提交一个 field；`needTriggerChange` 为真时发最终 `onChange`。 */
  flushSubmit: (index: number, needTriggerChange: boolean) => void;
  /**
   * 回滚（`index` 未给 ⇒ 全部）。
   *
   * ⚠️ 单值上游**丢弃 index**（恒为全量回滚），见文件头第 3 条。
   */
  resetValue: (index?: number) => void;
}

export interface RangeValueChangeResult {
  /** 当前 field（`null` = 本轮没有交互）。上游返回值第 1 项。 */
  currentIndex: Ref<number | null>;
  /** 「最后一个被接受的 field」（面板 / 选择器渲染用）。上游返回值第 2 项。 */
  activeIndex: ComputedRef<number>;
  /** 最近一次 index 切换是否需要**主动移动 DOM 焦点**。上游返回值第 3 项。 */
  forceFocus: Ref<boolean>;
  /** 本轮参与过的 field（首次触发序，去重）。上游返回值第 4 项。 */
  triggeredFields: ComputedRef<number[]>;
  /** 唯一的入口。上游返回值第 5 项。 */
  triggerChange: (index: number, source: RangeValueChangeSource, value?: unknown) => void;
  /** 结束本轮交互（**不动值**）。上游返回值第 6 项。 */
  reset: () => void;
}

/** 上游 `useRangeValueChange`。 */
export function useRangeValueChange(options: UseRangeValueChangeOptions): RangeValueChangeResult {
  // ============================= State =============================
  /** 本轮参与过的 field + 是否被改过（上游 `triggeredFieldsRef`）。 */
  const triggered = ref<TriggeredField[]>([]);
  /** 最后一个被显式确认的 field（上游 `confirmedIndexRef`，**不参与渲染**）。 */
  let confirmedIndex: number | null = null;
  /** 最近一次值更新是否来自 `input`（上游 `isLastInputRef`，**不参与渲染**）。 */
  let isLastInput = false;

  /** 上游 `useSyncState(null)` —— 事件处理里要**同步**读到最新值，`ref` 满足。 */
  const currentIndex = ref<number | null>(null);
  const forceFocus = ref(false);

  /** 「最后一个被接受的 field」（上游 `lastValidIndexRef`）。 */
  const lastValid = ref<number | undefined>(undefined);

  const setCurrentIndex = (next: number | null): void => {
    currentIndex.value = next;
    // ⚠️ 上游只在渲染期做 `currentIndex ?? lastValid ?? 0`，且**置空时保留** lastValid
    if (next !== null) {
      lastValid.value = next;
    }
  };

  const activeIndex = computed(() => currentIndex.value ?? lastValid.value ?? 0);
  const triggeredFields = computed(() => triggered.value.map((field) => field.index));

  // ============================= Reset =============================
  const reset = (): void => {
    triggered.value = [];
    confirmedIndex = null;
    isLastInput = false;
    setCurrentIndex(null);
    forceFocus.value = false;
  };

  // ============================= Record ============================
  /**
   * 记录一个 field 参与过本轮交互。
   *
   * ⚠️ `modified` 省略 ⇒ **保留原状态**（不是重置为 false）——上游逐字。
   * 本仓用不可变更新（上游是就地改 `field.modified`，Vue 里那样不会触发渲染）。
   */
  const recordTriggeredField = (index: number, modified?: boolean): void => {
    const list = triggered.value;
    if (list.some((field) => field.index === index)) {
      if (modified !== undefined) {
        triggered.value = list.map((field) =>
          field.index === index ? { index, modified } : field,
        );
      }
      return;
    }
    triggered.value = [...list, { index, modified: modified ?? false }];
  };

  // ============================= Submit ============================
  /** 提交一个 field，返回「本轮是否已完成」（= 所有 field 都参与过）。 */
  const submitField = (index: number): boolean => {
    recordTriggeredField(index);
    const allFieldsTriggered = triggered.value.length >= options.fieldCount;
    options.flushSubmit(index, allFieldsTriggered);
    if (allFieldsTriggered) {
      reset();
    }
    return allFieldsTriggered;
  };

  // ============================= Trigger ===========================
  const triggerChange = (index: number, source: RangeValueChangeSource, value?: unknown): void => {
    // 🚨 入口快照（见文件头第 1 条）
    let snapshotIndex = currentIndex.value;

    // ⚠️ `popupClose` **消费**上一次来源而不覆盖它（见文件头第 2 条）
    if (source !== 'popupClose') {
      isLastInput = source === 'input';
    }

    // 第一条「非关闭、非取消」的事件建立新一轮交互
    if (snapshotIndex === null && source !== 'popupClose' && source !== 'esc') {
      snapshotIndex = index;
      setCurrentIndex(index);
      forceFocus.value = false;
      recordTriggeredField(index, false);
    }

    const action = resolveAction({
      fieldCount: options.fieldCount,
      needConfirm: options.needConfirm(),
      allowEmpty: options.allowEmpty(),
      // `snapshotIndex === null` 时 `resolveAction` 会在用到它之前就返回
      // （`esc` / `popupClose` / `abort`）⇒ 这里给 `undefined` 只是让类型干净。
      currentFieldValue:
        snapshotIndex === null ? undefined : options.getCalendarValue()[snapshotIndex],
      currentIndex: snapshotIndex,
      index,
      source,
      value,
      triggeredFields: triggered.value,
      confirmedIndex,
    });
    const actionIndex = snapshotIndex ?? index;

    switch (action) {
      case 'modify':
        recordTriggeredField(actionIndex, true);
        if (confirmedIndex === actionIndex) {
          confirmedIndex = null;
        }
        if (value !== undefined) {
          options.triggerCalendarChange(actionIndex, value);
        }
        break;

      case 'submitCurrent':
        if (options.needConfirm()) {
          confirmedIndex = actionIndex;
        }
        submitField(actionIndex);
        break;

      case 'switchNext': {
        // `panel-final` 隐含「值已被改过」；显式给了值也算
        if (source === 'panel-final' || value !== undefined) {
          recordTriggeredField(actionIndex, true);
        }
        if (value !== undefined) {
          options.triggerCalendarChange(actionIndex, value);
        }
        if (options.needConfirm() && (source === 'keyboard-submit' || source === 'confirm')) {
          confirmedIndex = actionIndex;
        }

        // 🚨 优先级：`&&` 比 `||` 紧（见文件头「两个 key 的顺序」）
        const forceFocusNext =
          source === 'confirm' ||
          source === 'keyboard-submit' ||
          source === 'panel-final' ||
          (source === 'popupClose' && !isLastInput);

        const allFieldsTriggered = submitField(actionIndex);

        if (allFieldsTriggered && source === 'field-switch') {
          // 这次 focus 切换既结束上一轮，也以目标 field 开启新一轮
          setCurrentIndex(index);
          forceFocus.value = false;
        } else if (!allFieldsTriggered) {
          setCurrentIndex((actionIndex + 1) % options.fieldCount);
          forceFocus.value = forceFocusNext;
        }
        if (source === 'field-switch') {
          recordTriggeredField(index);
        }
        break;
      }

      case 'finish':
        reset();
        break;

      case 'resetCurrent':
        options.resetValue(actionIndex);
        if (confirmedIndex === actionIndex) {
          confirmedIndex = null;
        }
        triggered.value = triggered.value.filter((field) => field.index !== actionIndex);
        break;

      case 'resetCurrentAndSwitchNext': {
        options.resetValue(actionIndex);
        if (confirmedIndex === actionIndex) {
          confirmedIndex = null;
        }
        if (source === 'field-switch') {
          const nextFieldTriggered = triggered.value.some((field) => field.index === index);
          // 再次进入目标 field ⇒ 丢弃旧一轮记录，从该 field 开启新一轮
          if (nextFieldTriggered) {
            triggered.value = [];
          }
          setCurrentIndex(index);
          forceFocus.value = false;
          recordTriggeredField(index, false);
        } else {
          // 关浮层 = 结束整个交互，不再聚焦下一个 field
          reset();
        }
        break;
      }

      case 'resetAll':
        options.resetValue();
        reset();
        break;

      case 'abort':
        if (source === 'field-switch' && index === actionIndex) {
          recordTriggeredField(index);
        }
        break;
    }
  };

  return { currentIndex, activeIndex, forceFocus, triggeredFields, triggerChange, reset };
}
