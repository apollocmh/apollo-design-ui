/**
 * AR2 PoC · 差分层 —— motion 状态机内核与 antd 参考实现逐位一致。
 *
 * 与 `packages/position/src/__tests__/align.test.ts`（AR1）同一套做法：
 *   1. oracle 是 `@rc-component/motion@1.3.3` 的**机械移植**（见 `oracle.js`）
 *   2. 确定性 PRNG（mulberry32）生成千级用例，种子写死
 *   3. 逐位比对，不用"近似"判定
 *
 * 覆盖范围：状态机内核（`status.ts`）的全部纯函数。
 * **不覆盖**：帧驱动、rAF、DOM 事件监听 —— 那是外壳，见契约文档 §7 与 §9。
 */

import { describe, expect, it } from 'vitest';
import type { MotionEndInput, MotionStatus, StepStatus } from '../index';
import {
  FULL_STEP_QUEUE,
  getMotionClassName,
  getMotionStyle,
  getStatusSuffix,
  getStyleReady,
  getTransitionName,
  isActiveStep,
  nextStepInQueue,
  pickRenderMode,
  pickStatus,
  SIMPLE_STEP_QUEUE,
  STATUS_APPEAR,
  STATUS_ENTER,
  STATUS_LEAVE,
  STATUS_NONE,
  STEP_ACTIVATED,
  STEP_ACTIVE,
  STEP_NONE,
  STEP_PREPARE,
  STEP_PREPARED,
  STEP_START,
  shouldEndMotion,
  shouldStartMotion,
} from '../index';
import * as oracle from './oracle.js';

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

describe('常量与 antd 逐位一致', () => {
  it('status 常量', () => {
    expect([STATUS_NONE, STATUS_APPEAR, STATUS_ENTER, STATUS_LEAVE]).toEqual([
      oracle.STATUS_NONE,
      oracle.STATUS_APPEAR,
      oracle.STATUS_ENTER,
      oracle.STATUS_LEAVE,
    ]);
  });

  it('step 常量', () => {
    expect([
      STEP_NONE,
      STEP_PREPARE,
      STEP_START,
      STEP_ACTIVE,
      STEP_ACTIVATED,
      STEP_PREPARED,
    ]).toEqual([
      oracle.STEP_NONE,
      oracle.STEP_PREPARE,
      oracle.STEP_START,
      oracle.STEP_ACTIVE,
      oracle.STEP_ACTIVATED,
      oracle.STEP_PREPARED,
    ]);
  });

  it('⭐ STEP_ACTIVATED 的值是 "end" —— 常量名与值对不上是上游命名，照抄', () => {
    expect(STEP_ACTIVATED).toBe('end');
    expect(STEP_ACTIVATED).not.toBe('activated');
  });

  it('两条步进队列', () => {
    expect(FULL_STEP_QUEUE).toEqual(oracle.FULL_STEP_QUEUE);
    expect(SIMPLE_STEP_QUEUE).toEqual(oracle.SIMPLE_STEP_QUEUE);
    expect(FULL_STEP_QUEUE).toEqual(['prepare', 'start', 'active', 'end']);
    expect(SIMPLE_STEP_QUEUE).toEqual(['prepare', 'prepared']);
  });
});

// ---------------------------------------------------------------------------
// 手算用例：每条都能在 antd 源码里指出行号
// ---------------------------------------------------------------------------

describe('isActiveStep', () => {
  it('active 与 end 都算在动，prepared 不算', () => {
    expect(isActiveStep(STEP_ACTIVE)).toBe(true);
    expect(isActiveStep(STEP_ACTIVATED)).toBe(true);
    expect(isActiveStep(STEP_PREPARED)).toBe(false);
    expect(isActiveStep(STEP_START)).toBe(false);
    expect(isActiveStep(STEP_NONE)).toBe(false);
  });
});

describe('nextStepInQueue（useStepQueue.js:24-26）', () => {
  it('完整队列：prepare → start → active → end → undefined', () => {
    expect(nextStepInQueue(STEP_PREPARE, false)).toBe(STEP_START);
    expect(nextStepInQueue(STEP_START, false)).toBe(STEP_ACTIVE);
    expect(nextStepInQueue(STEP_ACTIVE, false)).toBe(STEP_ACTIVATED);
    // ⚠️ end 之后没有下一步 —— 这一步靠 DOM 事件或 deadline 收尾，不是靠队列
    expect(nextStepInQueue(STEP_ACTIVATED, false)).toBeUndefined();
  });

  it('简队列（不支持动画）：prepare → prepared → undefined，跳过 start/active', () => {
    expect(nextStepInQueue(STEP_PREPARE, true)).toBe(STEP_PREPARED);
    expect(nextStepInQueue(STEP_PREPARED, true)).toBeUndefined();
  });

  it('队列中不存在的 step 会得到首项 —— 与 indexOf === -1 的行为一致', () => {
    expect(nextStepInQueue(STEP_NONE, false)).toBe(STEP_PREPARE);
    expect(nextStepInQueue(STEP_PREPARED, false)).toBe(STEP_PREPARE);
  });
});

describe('pickStatus（useStatus.js:161-176）', () => {
  const base = {
    motionAppear: true,
    motionEnter: true,
    motionLeave: true,
    motionLeaveImmediately: false,
  };

  it('首次挂载 + visible → appear', () => {
    expect(pickStatus({ ...base, mounted: false, visible: true })).toBe(STATUS_APPEAR);
  });

  it('已挂载 + visible → enter', () => {
    expect(pickStatus({ ...base, mounted: true, visible: true })).toBe(STATUS_ENTER);
  });

  it('已挂载 + 不可见 → leave', () => {
    expect(pickStatus({ ...base, mounted: true, visible: false })).toBe(STATUS_LEAVE);
  });

  it('⭐ 未挂载 + 不可见：默认**不**走 leave（避免挂载即离场）', () => {
    expect(pickStatus({ ...base, mounted: false, visible: false })).toBeUndefined();
  });

  it('⭐ 未挂载 + 不可见 + motionLeaveImmediately → leave', () => {
    expect(
      pickStatus({ ...base, mounted: false, visible: false, motionLeaveImmediately: true }),
    ).toBe(STATUS_LEAVE);
  });

  it('关掉对应开关就不产生该状态', () => {
    expect(
      pickStatus({ ...base, mounted: false, visible: true, motionAppear: false }),
    ).toBeUndefined();
    expect(
      pickStatus({ ...base, mounted: true, visible: true, motionEnter: false }),
    ).toBeUndefined();
    expect(
      pickStatus({ ...base, mounted: true, visible: false, motionLeave: false }),
    ).toBeUndefined();
  });

  it('⚠️ 三个 if 不是 else-if：后面的条件可以覆盖前面的', () => {
    // mounted=true & visible=true & motionEnter=false & motionAppear=true
    // ⇒ 第一个 if 不成立（已挂载），第二个不成立（关了 enter），第三个不成立（visible）
    expect(
      pickStatus({ ...base, mounted: true, visible: true, motionEnter: false }),
    ).toBeUndefined();
  });
});

describe('shouldStartMotion（useStatus.js:180）', () => {
  it('有 nextStatus 且支持动画 → 开始', () => {
    expect(
      shouldStartMotion({ nextStatus: STATUS_ENTER, supportMotion: true, hasPrepare: false }),
    ).toBe(true);
  });

  it('⭐ 不支持动画**但**有 prepare handler → 仍然要走队列（collapse 靠它测高度）', () => {
    expect(
      shouldStartMotion({ nextStatus: STATUS_ENTER, supportMotion: false, hasPrepare: true }),
    ).toBe(true);
  });

  it('不支持动画也没有 prepare → 直接跳过', () => {
    expect(
      shouldStartMotion({ nextStatus: STATUS_ENTER, supportMotion: false, hasPrepare: false }),
    ).toBe(false);
  });

  it('没有 nextStatus 时无论怎样都不开始', () => {
    expect(
      shouldStartMotion({ nextStatus: undefined, supportMotion: true, hasPrepare: true }),
    ).toBe(false);
  });
});

describe('shouldEndMotion（useStatus.js:51-79）', () => {
  it('不在任何动画状态 → 不处理（deadline 已经收过尾时会走到这）', () => {
    expect(
      shouldEndMotion({ status: STATUS_NONE, active: true, element: 'el', endVerdict: undefined }),
    ).toBe(false);
  });

  it('子元素冒泡上来的事件被忽略', () => {
    expect(
      shouldEndMotion({
        status: STATUS_ENTER,
        active: true,
        element: 'el',
        event: { target: 'child' },
        endVerdict: undefined,
      }),
    ).toBe(false);
  });

  it('⭐ deadline 事件不做 target 校验 —— 它就是兜底', () => {
    expect(
      shouldEndMotion({
        status: STATUS_ENTER,
        active: true,
        element: 'el',
        event: { deadline: true, target: 'child' },
        endVerdict: undefined,
      }),
    ).toBe(true);
  });

  it('不在 active → 不结束', () => {
    expect(
      shouldEndMotion({
        status: STATUS_ENTER,
        active: false,
        element: 'el',
        event: { target: 'el' },
        endVerdict: undefined,
      }),
    ).toBe(false);
  });

  it('⭐ handler 返回 false 可以否决结束；返回 undefined 视为同意', () => {
    // ⚠️ 必须标注：对象字面量的属性会把字面量类型**拓宽**成 string，
    //    于是 spread 出来的 status 不再是 MotionStatus（TS 的 literal widening）
    const base: MotionEndInput = {
      status: STATUS_ENTER,
      active: true,
      element: 'el',
      event: { target: 'el' },
    };
    expect(shouldEndMotion({ ...base, endVerdict: false })).toBe(false);
    expect(shouldEndMotion({ ...base, endVerdict: undefined })).toBe(true);
    expect(shouldEndMotion({ ...base, endVerdict: true })).toBe(true);
  });
});

describe('getStatusSuffix（CSSMotion.js:127-134）', () => {
  it('prepare / start / active(含 end) 各有后缀', () => {
    expect(getStatusSuffix(STEP_PREPARE)).toBe('prepare');
    expect(getStatusSuffix(STEP_START)).toBe('start');
    expect(getStatusSuffix(STEP_ACTIVE)).toBe('active');
    expect(getStatusSuffix(STEP_ACTIVATED)).toBe('active');
  });

  it('prepared 与 none 没有后缀 —— 对应不挂「名字-状态-后缀」三段式', () => {
    expect(getStatusSuffix(STEP_PREPARED)).toBeUndefined();
    expect(getStatusSuffix(STEP_NONE)).toBeUndefined();
  });
});

describe('getTransitionName（util/motion.js）', () => {
  it('拼「名字-类型」', () => {
    expect(getTransitionName('ant-zoom', 'enter')).toBe('ant-zoom-enter');
  });

  it('motionName 为空时返回 null —— 于是 class 里不会出现 "null-enter"', () => {
    expect(getTransitionName(undefined, 'enter')).toBeNull();
    expect(getTransitionName('', 'enter')).toBeNull();
  });
});

describe('getMotionClassName（CSSMotion.js:135-141）', () => {
  it('⭐ 动画期间固定三个 class，含**裸的** motionName', () => {
    expect(getMotionClassName('ant-zoom', STATUS_ENTER, STEP_START)).toBe(
      'ant-zoom-enter ant-zoom-enter-start ant-zoom',
    );
    expect(getMotionClassName('ant-zoom', STATUS_ENTER, STEP_ACTIVE)).toBe(
      'ant-zoom-enter ant-zoom-enter-active ant-zoom',
    );
  });

  it('active 与 end 的 class 完全相同', () => {
    expect(getMotionClassName('ant-fade', STATUS_LEAVE, STEP_ACTIVE)).toBe(
      getMotionClassName('ant-fade', STATUS_LEAVE, STEP_ACTIVATED),
    );
  });

  it('prepared / none 步不挂后缀 class', () => {
    expect(getMotionClassName('ant-fade', STATUS_ENTER, STEP_PREPARED)).toBe(
      'ant-fade-enter ant-fade',
    );
    expect(getMotionClassName('ant-fade', STATUS_ENTER, STEP_NONE)).toBe('ant-fade-enter ant-fade');
  });

  it('没有 motionName 时不产出任何 class', () => {
    expect(getMotionClassName(undefined, STATUS_ENTER, STEP_START)).toBe('');
  });
});

describe('getMotionStyle（useStatus.js:225-231）', () => {
  it('有 prepare handler 且当前是 start 步 → 注入 transition:none', () => {
    expect(
      getMotionStyle({ hasPrepare: true, step: STEP_START, handlerStyle: { height: 0 } }),
    ).toEqual({ transition: 'none', height: 0 });
  });

  it('handler 没给样式时仍然只注入 transition:none —— 展开 null 是安全的', () => {
    expect(getMotionStyle({ hasPrepare: true, step: STEP_START, handlerStyle: null })).toEqual({
      transition: 'none',
    });
  });

  it('没有 prepare handler 时不注入', () => {
    expect(
      getMotionStyle({ hasPrepare: false, step: STEP_START, handlerStyle: { height: 0 } }),
    ).toEqual({
      height: 0,
    });
  });

  it('非 start 步不注入', () => {
    expect(
      getMotionStyle({ hasPrepare: true, step: STEP_ACTIVE, handlerStyle: { height: 1 } }),
    ).toEqual({
      height: 1,
    });
  });
});

describe('getStyleReady（useStatus.js:233-237）', () => {
  it('⭐ 支持动画 + 开了 appear + 未挂载 + 状态为 none → "NONE"，首帧不渲染', () => {
    expect(
      getStyleReady({
        mounted: false,
        status: STATUS_NONE,
        supportMotion: true,
        motionAppear: true,
        step: STEP_NONE,
        styleStep: null,
      }),
    ).toBe('NONE');
  });

  it('关掉 appear 就不拦首帧', () => {
    expect(
      getStyleReady({
        mounted: false,
        status: STATUS_NONE,
        supportMotion: true,
        motionAppear: false,
        step: STEP_NONE,
        styleStep: null,
      }),
    ).toBe(true);
  });

  it('start/active 步要求 styleStep 与 step 同步，否则为 false', () => {
    const base = {
      mounted: true,
      status: STATUS_ENTER as MotionStatus,
      supportMotion: true,
      motionAppear: true,
    };
    expect(getStyleReady({ ...base, step: STEP_START, styleStep: STEP_START })).toBe(true);
    expect(getStyleReady({ ...base, step: STEP_START, styleStep: STEP_ACTIVE })).toBe(false);
    expect(getStyleReady({ ...base, step: STEP_ACTIVE, styleStep: STEP_ACTIVE })).toBe(true);
  });
});

describe('pickRenderMode（CSSMotion.js:104-124）', () => {
  const base = {
    status: STATUS_NONE as MotionStatus,
    removeOnLeave: true,
    forceRender: false,
    rendered: true,
  };

  it('styleReady 为 NONE → 什么都不渲染', () => {
    expect(pickRenderMode({ ...base, styleReady: 'NONE', mergedVisible: true })).toBe('null');
  });

  it('动画中 → motion', () => {
    expect(
      pickRenderMode({ ...base, status: STATUS_ENTER, styleReady: true, mergedVisible: true }),
    ).toBe('motion');
  });

  it('可见 → children 原样渲染', () => {
    expect(pickRenderMode({ ...base, styleReady: true, mergedVisible: true })).toBe('children');
  });

  it('不可见 + removeOnLeave=false + leavedClassName → 留残骸', () => {
    expect(
      pickRenderMode({
        ...base,
        styleReady: true,
        mergedVisible: false,
        removeOnLeave: false,
        leavedClassName: 'leaved',
      }),
    ).toBe('leaved');
  });

  it('forceRender → display:none 留在 DOM', () => {
    expect(
      pickRenderMode({ ...base, styleReady: true, mergedVisible: false, forceRender: true }),
    ).toBe('hidden');
  });

  it('removeOnLeave=false 但没给 leavedClassName → 也是 display:none', () => {
    expect(
      pickRenderMode({ ...base, styleReady: true, mergedVisible: false, removeOnLeave: false }),
    ).toBe('hidden');
  });

  it('removeOnLeave=true 且没渲染过 → null', () => {
    expect(
      pickRenderMode({ ...base, styleReady: true, mergedVisible: false, rendered: false }),
    ).toBe('null');
  });
});

// ---------------------------------------------------------------------------
// 差分：千级生成用例
// ---------------------------------------------------------------------------

/** 确定性 PRNG（mulberry32）—— 测试必须可复现 */
function makeRandom(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 全部用 `as const` 声明成元组而不是 `T[]`：
// `pick` 的入参是**非空元组**，这样「随机索引一定命中」由类型保证，
// 不需要在返回处写 `as T` 断言（H10）。
const STATUSES = [STATUS_NONE, STATUS_APPEAR, STATUS_ENTER, STATUS_LEAVE] as const;
const STEPS = [
  STEP_NONE,
  STEP_PREPARE,
  STEP_START,
  STEP_ACTIVE,
  STEP_ACTIVATED,
  STEP_PREPARED,
] as const;
const MOTION_NAMES = [undefined, '', 'ant-zoom', 'ant-fade', 'ant-motion-collapse'] as const;
const LEAVED = [undefined, '', 'leaved'] as const;

interface Case {
  mounted: boolean;
  visible: boolean;
  motionAppear: boolean;
  motionEnter: boolean;
  motionLeave: boolean;
  motionLeaveImmediately: boolean;
  supportMotion: boolean;
  hasPrepare: boolean;
  status: MotionStatus;
  step: StepStatus;
  styleStep: StepStatus | null;
  motionName: string | undefined;
  removeOnLeave: boolean;
  forceRender: boolean;
  rendered: boolean;
  leavedClassName: string | undefined;
  mergedVisible: boolean;
  active: boolean;
  isDeadline: boolean;
  sameTarget: boolean;
  hasEvent: boolean;
  endVerdict: boolean | undefined;
  handlerStyle: Record<string, string | number> | null;
}

function generateCase(rand: () => number): Case {
  const pick = <T>(list: readonly [T, ...T[]]): T => {
    const index = Math.floor(rand() * list.length);
    // 两个 clamp 都是必需的，且都不能用断言代替：
    // · `Math.min` 防 rand() 边界返回 1 → 索引越界
    // · `?? list[0]` 消掉 `noUncheckedIndexedAccess` 下的 `T | undefined`。
    //   它是**真的安全**而不是断言：非空元组的首位一定存在；且当 T 本身含
    //   undefined（如 MOTION_NAMES）时，选中的 undefined 与 list[0] 同为 undefined，
    //   结果不变。
    const value = list[Math.min(index, list.length - 1)] ?? list[0];
    return value;
  };
  const bool = () => rand() < 0.5;

  return {
    mounted: bool(),
    visible: bool(),
    motionAppear: bool(),
    motionEnter: bool(),
    motionLeave: bool(),
    motionLeaveImmediately: bool(),
    supportMotion: bool(),
    hasPrepare: bool(),
    status: pick(STATUSES),
    step: pick(STEPS),
    styleStep: bool() ? pick(STEPS) : null,
    motionName: pick(MOTION_NAMES),
    removeOnLeave: bool(),
    forceRender: bool(),
    rendered: bool(),
    leavedClassName: pick(LEAVED),
    mergedVisible: bool(),
    active: bool(),
    isDeadline: bool(),
    sameTarget: bool(),
    hasEvent: bool(),
    // undefined / true / false 三种都要出现（对应「无 handler / 同意 / 否决」）
    endVerdict: pick([undefined, true, false]),
    handlerStyle: bool()
      ? null
      : { height: Math.floor(rand() * 100), opacity: rand() < 0.5 ? 0 : 1 },
  };
}

describe('AR2 PoC · 差分层：与 antd 参考实现逐位一致', () => {
  it('5000 组生成用例的状态机输出全部一致', () => {
    const rand = makeRandom(20260917);
    let checked = 0;

    for (let i = 0; i < 5000; i += 1) {
      const c = generateCase(rand);

      // ---- 状态选取 ----
      const mineStatus = pickStatus({
        mounted: c.mounted,
        visible: c.visible,
        motionAppear: c.motionAppear,
        motionEnter: c.motionEnter,
        motionLeave: c.motionLeave,
        motionLeaveImmediately: c.motionLeaveImmediately,
      });
      const refStatus = oracle.pickStatus(
        c.mounted,
        c.visible,
        c.motionAppear,
        c.motionEnter,
        c.motionLeave,
        c.motionLeaveImmediately,
      );
      expect(mineStatus ?? null).toBe(refStatus ?? null);
      checked += 1;

      // ---- 是否开始 ----
      expect(
        shouldStartMotion({
          nextStatus: mineStatus,
          supportMotion: c.supportMotion,
          hasPrepare: c.hasPrepare,
        }),
      ).toBe(oracle.shouldStartMotion(refStatus, c.supportMotion, c.hasPrepare));
      checked += 1;

      // ---- 步进队列（两条都走） ----
      expect(nextStepInQueue(c.step, false)).toBe(oracle.getNextStep(c.step, false));
      expect(nextStepInQueue(c.step, true)).toBe(oracle.getNextStep(c.step, true));
      checked += 2;

      // ---- isActive ----
      expect(isActiveStep(c.step)).toBe(oracle.isActive(c.step));
      checked += 1;

      // ---- class ----
      expect(getMotionClassName(c.motionName, c.status, c.step)).toBe(
        oracle.getMotionClassName(c.motionName, c.status, c.step),
      );
      checked += 1;

      // ---- 样式 ----
      expect(
        getMotionStyle({ hasPrepare: c.hasPrepare, step: c.step, handlerStyle: c.handlerStyle }),
      ).toEqual(oracle.getMotionStyle(c.hasPrepare, c.step, c.handlerStyle));
      checked += 1;

      // ---- styleReady + 渲染分支 ----
      const mineReady = getStyleReady({
        mounted: c.mounted,
        status: c.status,
        supportMotion: c.supportMotion,
        motionAppear: c.motionAppear,
        step: c.step,
        styleStep: c.styleStep,
      });
      const refReady = oracle.getStyleReady(
        c.mounted,
        c.status,
        c.supportMotion,
        c.motionAppear,
        c.step,
        c.styleStep,
      );
      expect(mineReady).toBe(refReady);
      checked += 1;

      expect(
        pickRenderMode({
          styleReady: mineReady,
          status: c.status,
          mergedVisible: c.mergedVisible,
          removeOnLeave: c.removeOnLeave,
          forceRender: c.forceRender,
          leavedClassName: c.leavedClassName,
          rendered: c.rendered,
        }),
      ).toBe(
        oracle.pickRenderMode(
          refReady,
          c.status,
          c.mergedVisible,
          c.removeOnLeave,
          c.forceRender,
          c.leavedClassName,
          c.rendered,
        ),
      );
      checked += 1;

      // ---- 结束判定 ----
      const element = 'ELEMENT';
      const event = c.hasEvent
        ? { deadline: c.isDeadline, target: c.sameTarget ? element : 'OTHER' }
        : undefined;
      expect(
        shouldEndMotion({
          status: c.status,
          active: c.active,
          element,
          event,
          endVerdict: c.endVerdict,
        }),
      ).toBe(oracle.shouldEndMotion(c.status, c.active, element, event, c.endVerdict));
      checked += 1;
    }

    // 防止有人把循环体改空却仍然"通过"。
    // 10 = 状态选取 / 是否开始 / 两条队列的下一步 / isActive / class / style /
    //      styleReady / 渲染分支 / 结束判定
    expect(checked).toBe(5000 * 10);
  });

  it('⭐ 覆盖率自检：生成用例里必须出现 STEPS 的每一种与 STATUSES 的每一种', () => {
    // 若某个取值从不出现，上面的差分就是"看起来覆盖了其实没有"
    const rand = makeRandom(20260917);
    const seenSteps = new Set<string>();
    const seenStatus = new Set<string>();
    const seenNames = new Set<string>();

    for (let i = 0; i < 5000; i += 1) {
      const c = generateCase(rand);
      seenSteps.add(c.step);
      seenStatus.add(c.status);
      seenNames.add(String(c.motionName));
    }

    expect([...seenSteps].sort()).toEqual([...STEPS].sort());
    expect([...seenStatus].sort()).toEqual([...STATUSES].sort());
    expect(seenNames.size).toBe(MOTION_NAMES.length);
  });
});
