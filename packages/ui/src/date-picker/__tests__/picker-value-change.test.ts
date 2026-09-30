// @vitest-environment node

/**
 * L1 单元 —— 提交时机的状态机（G4 · S2 剩余 / S4 内核）。
 *
 * 契约来源：`@rc-component/picker` 的
 * `PickerInput/hooks/useRangeValueChange.js`（405 行）+ 同名 `.d.ts` 的注释。
 * **每一条判据都注明出处**，不是推测。
 *
 * ── 两组 ────────────────────────────────────────────────────────────────────
 *
 * | 组 | 对象 | 为什么能直接测 |
 * |---|---|---|
 * | A | `resolveAction`（**纯函数**） | 「事件 → 操作」是纯映射 ⇒ 可以穷举 `source × needConfirm × allowEmpty × 有值/无值` |
 * | B | `useRangeValueChange`（**簿记**） | 只用 `ref` / `computed`，**不碰 DOM、不用生命周期** ⇒ node 环境即可 |
 *
 * ⚠️ **必须 node 环境**（`@vitest-environment node`）：本文件零 DOM 依赖；
 * 用 jsdom 只会白白付出环境启动成本（本仓的 jsdom 冷加载实测 8s 量级，
 * 而 worker 启动上限是 60s —— 见 PITFALLS 199/231）。
 *
 * ── 这个文件**没有**证明什么 ──────────────────────────────────────────────────
 *
 * 「接线」（谁在什么时候调 `triggerChange`）不在本文件 —— 那是
 * `s2-commit.test.ts`（jsdom，真实键入 + 焦点 + 关浮层的异步卸载）的事。
 */

import { describe, expect, it } from 'vitest';
import {
  type RangeValueChangeAction,
  type RangeValueChangeSource,
  type ResolveActionInput,
  resolveAction,
  type TriggeredField,
  useRangeValueChange,
} from '../hooks/picker-value-change';

// ---------------------------------------------------------------------------
// A. resolveAction（纯函数）
// ---------------------------------------------------------------------------

/** 默认入参：单值、无确认制、不允许为空、当前 field 有值。 */
const base: ResolveActionInput = {
  fieldCount: 1,
  needConfirm: false,
  allowEmpty: [false],
  currentFieldValue: ['SOME_DATE'],
  currentIndex: 0,
  index: 0,
  source: 'input',
  value: undefined,
  triggeredFields: [{ index: 0, modified: false }],
  confirmedIndex: null,
};

const with_ = (over: Partial<ResolveActionInput>): ResolveActionInput => ({ ...base, ...over });

/** 断言某个 source 映射到某个 action。 */
const expectAction = (over: Partial<ResolveActionInput>, action: RangeValueChangeAction): void => {
  expect(resolveAction(with_(over))).toBe(action);
};

describe('resolveAction · 短路与来源白名单（上游 resolveAction 逐字）', () => {
  it('`esc` 恒为 `resetAll` —— 不看 field、不看值、不看 needConfirm', () => {
    // 三种极端：无当前 field / index 对不上 / needConfirm
    expectAction({ source: 'esc', currentIndex: null }, 'resetAll');
    expectAction({ source: 'esc', index: 9 }, 'resetAll');
    expectAction({ source: 'esc', needConfirm: true, currentFieldValue: undefined }, 'resetAll');
  });

  it('`currentIndex === null`：只有 `popupClose` 是 `resetAll`，其余一律 `abort`', () => {
    const sources: RangeValueChangeSource[] = [
      'input',
      'remove',
      'keyboard-submit',
      'keyboard-submit-weak',
      'panel-intermediate',
      'panel-final',
      'field-switch',
      'confirm',
    ];
    for (const source of sources) {
      expectAction({ source, currentIndex: null }, 'abort');
    }
    // ⚠️ 一轮交互结束后关浮层，仍需清理受控值留下的临时 CalendarValue
    expectAction({ source: 'popupClose', currentIndex: null }, 'resetAll');
  });

  it('`input` / `panel-intermediate` ⇒ `modify`（只改值，不提交）', () => {
    expectAction({ source: 'input' }, 'modify');
    expectAction({ source: 'panel-intermediate' }, 'modify');
  });

  it('`panel-final`：无确认制 ⇒ `switchNext`；有确认制 ⇒ `modify`', () => {
    // ⚠️ 这正是「点一下日期就提交」与「点一下只改日历值，要点确定」的分界
    expectAction({ source: 'panel-final', needConfirm: false }, 'switchNext');
    expectAction({ source: 'panel-final', needConfirm: true }, 'modify');
  });

  it('`keyboard-submit-weak`（Tab）⇒ `submitCurrent`（**局部提交，不推进**）', () => {
    expectAction({ source: 'keyboard-submit-weak' }, 'submitCurrent');
  });

  it('`keyboard-submit` / `confirm` / `remove` ⇒ `switchNext`', () => {
    expectAction({ source: 'keyboard-submit' }, 'switchNext');
    expectAction({ source: 'confirm' }, 'switchNext');
    expectAction({ source: 'remove' }, 'switchNext');
  });

  it('`index !== currentIndex` ⇒ `abort`（其余来源必须指向当前 field）', () => {
    expectAction({ source: 'input', index: 1, fieldCount: 2 }, 'abort');
    expectAction({ source: 'confirm', index: 1, fieldCount: 2 }, 'abort');
    expectAction({ source: 'popupClose', index: 1, fieldCount: 2 }, 'abort');
  });
});

describe('resolveAction · canSwitch / canSubmit（含 `remove` 例外）', () => {
  it('当前 field 为空且不允许为空 ⇒ 不能 switch / 不能 submit ⇒ `abort`', () => {
    expectAction(
      { source: 'keyboard-submit', currentFieldValue: null, allowEmpty: [false] },
      'abort',
    );
    expectAction({ source: 'confirm', currentFieldValue: null, allowEmpty: [false] }, 'abort');
  });

  it('🚨 `remove` **例外**：即使不允许为空也要提交删除后的值', () => {
    // 上游 `canSubmit = source === 'remove' || canSwitch`
    expectAction({ source: 'remove', currentFieldValue: null, allowEmpty: [false] }, 'switchNext');
    // 反向哨兵：同样的「空 + 不允许为空」，`confirm` 就不行
    expectAction({ source: 'confirm', currentFieldValue: null, allowEmpty: [false] }, 'abort');
  });

  it('`allowEmpty[currentIndex]` 为 `undefined` 时按 **false** 处理（`=== true` 判据）', () => {
    // 上游是 `!currentEmpty || allowEmpty[currentIndex]` —— undefined 走 falsy 分支
    expectAction({ source: 'keyboard-submit', currentFieldValue: null, allowEmpty: [] }, 'abort');
    expectAction(
      { source: 'keyboard-submit', currentFieldValue: null, allowEmpty: [true] },
      'switchNext',
    );
  });

  it('🚨 空值判据是 `=== undefined` 的**反向**：显式传 `null` 算「有值」', () => {
    // 上游 `const currentValue = value === undefined ? getCalendarValue()[currentIndex] : value;`
    // ⇒ 显式 `null` 会被当作 currentValue ⇒ currentEmpty = true ⇒ 不允许为空时 abort
    expectAction({ source: 'confirm', value: null, allowEmpty: [false] }, 'abort');
    // 而 `value === undefined`（不给值）时用的是 `currentFieldValue`（有值）⇒ 可以走
    expectAction({ source: 'confirm', value: undefined, allowEmpty: [false] }, 'switchNext');
  });
});

describe('resolveAction · field-switch（S4 字段导航的调度）', () => {
  it('`index === currentIndex` ⇒ `abort`（原地 focus 不算切换）', () => {
    expectAction({ source: 'field-switch', index: 0 }, 'abort');
  });

  it('只允许按循环顺序推进**一格** —— 跳到更远的 field 一律 `abort`', () => {
    expectAction({ source: 'field-switch', index: 2, fieldCount: 3 }, 'abort');
    expectAction({ source: 'field-switch', index: 1, fieldCount: 3 }, 'switchNext');
  });

  it('`needConfirm` + 当前 field 已确认 ⇒ `switchNext`', () => {
    expectAction(
      { source: 'field-switch', index: 1, fieldCount: 2, needConfirm: true, confirmedIndex: 0 },
      'switchNext',
    );
  });

  it('`needConfirm` + 未确认 + 允许为空 ⇒ `resetCurrentAndSwitchNext`（先丢弃未确认值）', () => {
    expectAction(
      {
        source: 'field-switch',
        index: 1,
        fieldCount: 2,
        needConfirm: true,
        confirmedIndex: null,
        allowEmpty: [true, false],
      },
      'resetCurrentAndSwitchNext',
    );
  });

  it('`needConfirm` + 未确认 + **不**允许为空 ⇒ `abort`（锁定）', () => {
    expectAction(
      {
        source: 'field-switch',
        index: 1,
        fieldCount: 2,
        needConfirm: true,
        confirmedIndex: null,
        allowEmpty: [false, false],
      },
      'abort',
    );
  });

  it('无确认制 + 当前 field 可切换 ⇒ `switchNext`', () => {
    expectAction(
      { source: 'field-switch', index: 1, fieldCount: 2, needConfirm: false },
      'switchNext',
    );
  });

  it('无确认制 + 当前 field **不可**切换：目标已触发过 ⇒ `resetCurrentAndSwitchNext`，否则 `resetCurrent`', () => {
    const common = {
      source: 'field-switch' as const,
      index: 1,
      fieldCount: 2,
      needConfirm: false,
      currentFieldValue: null,
      allowEmpty: [false, false],
    };
    // 再次进入已触发过的 next ⇒ 开启新一轮
    expectAction(
      {
        ...common,
        triggeredFields: [
          { index: 0, modified: true },
          { index: 1, modified: false },
        ],
      },
      'resetCurrentAndSwitchNext',
    );
    expectAction({ ...common, triggeredFields: [{ index: 0, modified: true }] }, 'resetCurrent');
  });
});

describe('resolveAction · popupClose（关浮层 ≠ 一定提交）', () => {
  const modified: TriggeredField[] = [{ index: 0, modified: true }];
  const untouched: TriggeredField[] = [{ index: 0, modified: false }];

  it('整轮**没改过** ⇒ `finish`（收工且**不动值**）', () => {
    expectAction({ source: 'popupClose', triggeredFields: untouched }, 'finish');
  });

  it('无确认制 + 有值 ⇒ `switchNext`（提交）', () => {
    expectAction({ source: 'popupClose', triggeredFields: modified }, 'switchNext');
  });

  it('无确认制 + 空值且不允许为空 ⇒ `resetAll`（丢弃临时值）', () => {
    expectAction(
      { source: 'popupClose', triggeredFields: modified, currentFieldValue: null },
      'resetAll',
    );
  });

  it('🚨 有确认制 + **还有 field 没参与过** ⇒ `resetAll`（不是提交！）', () => {
    expectAction(
      {
        source: 'popupClose',
        needConfirm: true,
        fieldCount: 2,
        triggeredFields: modified,
        allowEmpty: [false, false],
      },
      'resetAll',
    );
  });

  it('有确认制 + 都参与过 + 当前 field 被改过：允许为空 ⇒ `resetCurrentAndSwitchNext`，否则 `resetAll`', () => {
    const common = {
      source: 'popupClose' as const,
      needConfirm: true,
      fieldCount: 1,
      triggeredFields: modified,
    };
    expectAction({ ...common, allowEmpty: [true] }, 'resetCurrentAndSwitchNext');
    expectAction({ ...common, allowEmpty: [false] }, 'resetAll');
  });

  it('有确认制 + 都参与过 + 当前 field **未**被改过 ⇒ `switchNext`', () => {
    // ⚠️ 必须**另有**一个 field 被改过 —— 否则 `interactionModified` 为假会先走 `finish`
    expectAction(
      {
        source: 'popupClose',
        needConfirm: true,
        fieldCount: 2,
        currentIndex: 0,
        index: 0,
        triggeredFields: [
          { index: 0, modified: false },
          { index: 1, modified: true },
        ],
        allowEmpty: [false, false],
      },
      'switchNext',
    );
  });
});

// ---------------------------------------------------------------------------
// B. useRangeValueChange（簿记）
// ---------------------------------------------------------------------------

/**
 * 单值 harness。
 *
 * ⚠️ 刻意照上游 `SinglePicker` 的**字段化**形态建模：
 * `getFieldCalendarValue = () => [values.length ? values : null]`
 * —— 元素 0 是**整组值**（数组）或 `null`，不是单个日期。
 */
function makeSingleHarness(over: Partial<Parameters<typeof useRangeValueChange>[0]> = {}) {
  /** 临时日历值（`[]` = 空）。 */
  let values: unknown[] = [];
  const calls: string[] = [];

  const result = useRangeValueChange({
    fieldCount: 1,
    needConfirm: () => false,
    allowEmpty: () => [false],
    getCalendarValue: () => [values.length ? values : null],
    triggerCalendarChange: (index, value) => {
      values = value as unknown[];
      calls.push(`calendar[${index}]=${JSON.stringify(value)}`);
    },
    flushSubmit: (index, needTriggerChange) => {
      calls.push(`flush(${index},${needTriggerChange})`);
    },
    resetValue: (index) => {
      calls.push(`resetValue(${index === undefined ? 'all' : index})`);
    },
    ...over,
  });

  return {
    result,
    calls,
    setValues: (next: unknown[]) => {
      values = next;
    },
  };
}

describe('useRangeValueChange · 三份簿记', () => {
  it('第一条「非关闭、非取消」事件建立 `currentIndex` 并记录 field', () => {
    const h = makeSingleHarness();
    expect(h.result.currentIndex.value).toBeNull();

    h.result.triggerChange(0, 'input');

    expect(h.result.currentIndex.value).toBe(0);
    expect(h.result.triggeredFields.value).toEqual([0]);
    // ⚠️ `input` 不带值也**不会**写日历值（`value === undefined` 那一支），
    //    但簿记上它已被标成 `modified=true`（上游 `recordTriggeredField(actionIndex, true)`）
    expect(h.calls).toEqual([]);
    // 于是「关浮层」会走提交分支；而日历值是**空的**（本 harness 没给值）
    // ⇒ 无确认制 + 空值且不允许为空 ⇒ `resetAll`（不是提交）
    h.result.triggerChange(0, 'popupClose');
    expect(h.calls).toEqual(['resetValue(all)']);
  });

  it('🚨 `popupClose` 与 `esc` **不**建立 `currentIndex`', () => {
    const a = makeSingleHarness();
    a.result.triggerChange(0, 'popupClose');
    expect(a.result.currentIndex.value).toBeNull();

    const b = makeSingleHarness();
    b.result.triggerChange(0, 'esc');
    expect(b.result.currentIndex.value).toBeNull();
  });

  it('`modify` 把 field 标成 modified，并把值写进临时日历值', () => {
    const h = makeSingleHarness();
    h.result.triggerChange(0, 'input', ['D1']);

    expect(h.calls).toEqual(['calendar[0]=["D1"]']);
    // 之后再 `popupClose`：因为「被改过」⇒ 走提交（无确认制 + 有值 ⇒ switchNext）
    h.result.triggerChange(0, 'popupClose');
    expect(h.calls).toContain('flush(0,true)');
  });

  it('单值 `fieldCount === 1` ⇒ **第一次** submit 就 `allFieldsTriggered`', () => {
    const h = makeSingleHarness();
    h.result.triggerChange(0, 'input', ['D1']);
    h.result.triggerChange(0, 'confirm');

    expect(h.calls).toContain('flush(0,true)');
    // `allFieldsTriggered` ⇒ submitField 里调了 `reset()` ⇒ 簿记清空
    expect(h.result.currentIndex.value).toBeNull();
    expect(h.result.triggeredFields.value).toEqual([]);
  });

  it('`finish`（整轮没改过就关浮层）⇒ 只 reset，**不动值、不提交**', () => {
    const h = makeSingleHarness();
    // `field-switch` 建立 currentIndex=0 并记 `modified=false`；
    // 此时 index === currentIndex ⇒ `resolveAction` 走 `abort`（不提交）
    h.result.triggerChange(0, 'field-switch');
    expect(h.calls).toEqual([]);

    h.result.triggerChange(0, 'popupClose');

    // 整轮没改过 ⇒ `finish`：既不 `flushSubmit` 也不 `resetValue`
    expect(h.calls).toEqual([]);
    expect(h.result.currentIndex.value).toBeNull();
  });

  it('`reset()` 清空全部簿记（含 `activeIndex` 保留最后一个有效 field）', () => {
    const h = makeSingleHarness();
    h.result.triggerChange(0, 'input', ['D1']);
    expect(h.result.activeIndex.value).toBe(0);

    h.result.reset();

    expect(h.result.currentIndex.value).toBeNull();
    expect(h.result.triggeredFields.value).toEqual([]);
    expect(h.result.forceFocus.value).toBe(false);
    // ⚠️ `lastValidIndexRef` 在置空时**保留**（上游如此）
    expect(h.result.activeIndex.value).toBe(0);
  });

  it('`abort` 不改任何状态', () => {
    const h = makeSingleHarness();
    h.result.triggerChange(0, 'input', ['D1']);
    const before = [...h.calls];
    // index 对不上 ⇒ abort
    h.result.triggerChange(5, 'input', ['D2']);
    expect(h.calls).toEqual(before);
    expect(h.result.currentIndex.value).toBe(0);
  });

  it('`resetAll`（`esc`）⇒ `resetValue()` 全量 + 清簿记', () => {
    const h = makeSingleHarness();
    h.result.triggerChange(0, 'input', ['D1']);
    h.calls.length = 0;

    h.result.triggerChange(0, 'esc');

    expect(h.calls).toEqual(['resetValue(all)']);
    expect(h.result.currentIndex.value).toBeNull();
  });

  it('`resetCurrent`（field-switch 到未触发过的 next、当前无值）⇒ `resetValue(index)` + 该 field 出簿记', () => {
    const h = makeSingleHarness({
      fieldCount: 2,
      allowEmpty: () => [false, false],
    });
    // 建立 field 0（`field-switch` 到自身 ⇒ abort，但 currentIndex 已建立、日历值仍为空）
    h.result.triggerChange(0, 'field-switch');
    expect(h.result.currentIndex.value).toBe(0);
    h.calls.length = 0;

    // field-switch 到 1：无确认制 + 当前空且不允许为空 + next 未触发过 ⇒ resetCurrent
    h.result.triggerChange(1, 'field-switch');

    expect(h.calls).toEqual(['resetValue(0)']);
    // ⚠️ `resetCurrent` **不会**记录目标 field ⇒ 簿记被清空（不是 `[1]`）
    expect(h.result.triggeredFields.value).toEqual([]);
    // 且 `currentIndex` **不变**（`resetCurrent` 不推进）——这正是「锁定在当前 field」
    expect(h.result.currentIndex.value).toBe(0);
  });
});

/**
 * 多 field harness（测 `forceFocus` 用）。
 *
 * ⚠️ **必须 `fieldCount >= 2`**：单值时 `submitField` 一定 `allFieldsTriggered`
 * ⇒ 里面调 `reset()` 把 `forceFocus` 抹成 `false`
 * ⇒ 单值下 `forceFocus` **恒为 false**，测不出强弱切换。
 */
function makeFieldHarness(fieldCount: number) {
  const fields: unknown[] = Array.from({ length: fieldCount }, () => null);
  const calls: string[] = [];

  const result = useRangeValueChange({
    fieldCount,
    needConfirm: () => false,
    allowEmpty: () => Array.from({ length: fieldCount }, () => false),
    getCalendarValue: () => fields,
    triggerCalendarChange: (index, value) => {
      fields[index] = value;
      calls.push(`calendar[${index}]=${JSON.stringify(value)}`);
    },
    flushSubmit: (index, needTriggerChange) => {
      calls.push(`flush(${index},${needTriggerChange})`);
    },
    resetValue: (index) => {
      calls.push(`resetValue(${index === undefined ? 'all' : index})`);
    },
  });

  return { result, calls, fields };
}

describe('useRangeValueChange · forceFocus 的强弱切换（fieldCount = 2）', () => {
  it('🚨 `isLastInput` 只被「非 popupClose」的事件写 ⇒ 决定 popupClose 的 focus 强弱', () => {
    // ① `input` 之后关浮层 ⇒ **弱**切换
    const viaInput = makeFieldHarness(2);
    viaInput.result.triggerChange(0, 'input', ['D1']);
    viaInput.result.triggerChange(0, 'popupClose');
    expect(viaInput.result.forceFocus.value).toBe(false);

    // ② 面板操作之后关浮层 ⇒ **强**切换（`popupClose && !isLastInput`）
    const viaPanel = makeFieldHarness(2);
    viaPanel.result.triggerChange(0, 'panel-intermediate', ['D1']);
    viaPanel.result.triggerChange(0, 'popupClose');
    expect(viaPanel.result.forceFocus.value).toBe(true);
  });

  it('`confirm` / `keyboard-submit` / `panel-final` 都是**强**切换', () => {
    for (const source of ['confirm', 'keyboard-submit', 'panel-final'] as const) {
      const h = makeFieldHarness(2);
      h.result.triggerChange(0, 'panel-intermediate', ['D1']);
      h.result.triggerChange(0, source);
      expect(h.result.forceFocus.value).toBe(true);
      // 且都推进到了下一个 field
      expect(h.result.currentIndex.value).toBe(1);
    }
  });

  it('`popupClose` 的强弱是**唯一**一个依赖 `isLastInput` 的分支（反向哨兵）', () => {
    // 同一个 source、同一个 field，只差「上一次是不是 input」⇒ forceFocus 不同
    const a = makeFieldHarness(2);
    a.result.triggerChange(0, 'input', ['D1']);
    a.result.triggerChange(0, 'popupClose');

    const b = makeFieldHarness(2);
    b.result.triggerChange(0, 'input', ['D1']);
    b.result.triggerChange(0, 'panel-intermediate', ['D1']); // 覆盖 isLastInput = false
    b.result.triggerChange(0, 'popupClose');

    expect(a.result.forceFocus.value).toBe(false);
    expect(b.result.forceFocus.value).toBe(true);
  });
});
