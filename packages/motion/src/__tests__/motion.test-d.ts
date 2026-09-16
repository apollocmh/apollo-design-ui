/**
 * L3 类型测试 —— `motion` 包。
 *
 * TESTING.md T7 要求：**必须包含负例**。负例用 `@ts-expect-error` 表达，
 * 语义是「此处**应当**报错」；若哪天类型放宽导致这里不再报错，
 * `@ts-expect-error` 自身会变成错误，测试即失败。这是它唯一被允许的使用场景。
 *
 * ⚠️⚠️ `*.test-d.ts` **会被 vitest 实际执行**（不只是类型检查），
 *      所以负例必须放进**永不执行**的闭包里，只留给 TS 看。
 */

import { describe, expectTypeOf, it } from 'vitest';

import type {
  CollapseMotionPreset,
  KeyEntity,
  KeyObject,
  MotionEndEventLike,
  MotionHooks,
  MotionStatus,
  MotionStyle,
  RenderMode,
  StepStatus,
} from '../index';
import {
  CSSMotion,
  diffKeys,
  getCollapsedHeight,
  getCurrentHeight,
  getMotionClassName,
  getRealHeight,
  getStatusSuffix,
  initCollapseMotion,
  MotionList,
  nextStepInQueue,
  parseKeys,
  pickStatus,
  type STATUS_ADD,
  type STATUS_KEEP,
  type STATUS_REMOVE,
  type STATUS_REMOVED,
  shouldEndMotion,
  skipOpacityTransition,
  useMotionStatus,
} from '../index';

/** 永不执行 —— 只为了让 TS 检查里面的调用。 */
function neverCalled(fn: () => void): void {
  void fn;
}

// ---------------------------------------------------------------------------

describe('常量', () => {
  it('STATUS / STEP 是字面量类型，不是 string', () => {
    expectTypeOf(
      pickStatus({
        mounted: false,
        visible: true,
        motionAppear: true,
        motionEnter: true,
        motionLeave: true,
        motionLeaveImmediately: false,
      }),
    ).toEqualTypeOf<MotionStatus | undefined>();
    expectTypeOf(nextStepInQueue('prepare', false)).toEqualTypeOf<StepStatus | undefined>();
  });

  it('⭐ STEP_ACTIVATED 的字面量是 "end" 而不是 "activated"', () => {
    // 这是最容易被"好心修正"的一个常量 —— 上游就叫 'end'。
    // 改了会与 antd 的 class 名对不上，且不会有任何类型错误。
    expectTypeOf<'end'>().toMatchTypeOf<StepStatus>();
  });

  it('key 状态是四态联合', () => {
    // 用 `typeof X` 而不是 `X`：后者在 vitest 的 typecheck 里会被推断成 `string`，
    // 于是这条断言永远失败 —— 那测的就不是我们想测的东西了。
    expectTypeOf<typeof STATUS_ADD>().toEqualTypeOf<'add'>();
    expectTypeOf<typeof STATUS_KEEP>().toEqualTypeOf<'keep'>();
    expectTypeOf<typeof STATUS_REMOVE>().toEqualTypeOf<'remove'>();
    expectTypeOf<typeof STATUS_REMOVED>().toEqualTypeOf<'removed'>();
  });
});

describe('纯函数', () => {
  it('getStatusSuffix 只返回三种后缀', () => {
    expectTypeOf(getStatusSuffix('prepare')).toEqualTypeOf<
      'prepare' | 'start' | 'active' | undefined
    >();
  });

  it('getMotionClassName 返回 string', () => {
    expectTypeOf(getMotionClassName('ant-zoom', 'enter', 'start')).toEqualTypeOf<string>();
  });

  it('shouldEndMotion 返回 boolean', () => {
    expectTypeOf(
      shouldEndMotion({
        status: 'enter',
        active: true,
        element: null,
        event: undefined,
        endVerdict: undefined,
      }),
    ).toEqualTypeOf<boolean>();
  });

  it('负例：step 不能传任意字符串', () => {
    neverCalled(() => {
      // @ts-expect-error 'nope' 不是 StepStatus
      getStatusSuffix('nope');
    });
  });

  it('负例：pickStatus 缺 mounted / visible 不行', () => {
    neverCalled(() => {
      // @ts-expect-error 缺必填字段
      pickStatus({ motionAppear: true });
    });
  });
});

describe('RenderMode', () => {
  it('五种分支都在联合里', () => {
    expectTypeOf<RenderMode>().toEqualTypeOf<
      'motion' | 'children' | 'leaved' | 'hidden' | 'null'
    >();
  });
});

// ---------------------------------------------------------------------------

describe('MotionHooks', () => {
  it('⭐ start/active handler **可以不返回**任何东西（`| void` 的意义）', () => {
    // 这条是 `noConfusingVoidType` 那条 biome-ignore 存在的理由：
    // 换成 `| undefined` 后，下面这种「部分路径无 return」的写法就编译不过了。
    const hooks: MotionHooks = {
      onAppearStart: (el) => {
        if (!el) return;
        void el;
      },
    };
    expectTypeOf(hooks).toMatchTypeOf<MotionHooks>();
  });

  it('返回 MotionStyle 也可以', () => {
    const hooks: MotionHooks = {
      onAppearStart: () => ({ height: 0, opacity: 0 }),
    };
    expectTypeOf(hooks).toMatchTypeOf<MotionHooks>();
  });

  it('负例：start 不能返回字符串', () => {
    neverCalled(() => {
      const hooks: MotionHooks = {
        // @ts-expect-error string 不是 MotionStyle
        onAppearStart: () => 'nope',
      };
      void hooks;
    });
  });

  it('end handler 返回 false 表示否决结束', () => {
    const hooks: MotionHooks = { onLeaveEnd: () => false };
    expectTypeOf(hooks).toMatchTypeOf<MotionHooks>();
  });
});

// ---------------------------------------------------------------------------

describe('presets（collapse）', () => {
  it('initCollapseMotion 的六个时机都在', () => {
    const preset = initCollapseMotion();
    expectTypeOf(preset).toMatchTypeOf<CollapseMotionPreset>();
    expectTypeOf(preset.motionDeadline).toEqualTypeOf<number>();
  });

  it('三个高度 handler 的返回类型是 MotionStyle', () => {
    // 下面几行的 `| void` 是**被测对象本身的类型**，不是可以"优化"掉的写法：
    // handler 允许不返回任何东西，这是 `MotionStepHandler` 的契约。
    // biome-ignore lint/suspicious/noConfusingVoidType: 断言的是被测签名，必须逐字一致
    expectTypeOf(getCollapsedHeight(null)).toEqualTypeOf<MotionStyle | void>();
    // biome-ignore lint/suspicious/noConfusingVoidType: 同上
    expectTypeOf(getRealHeight(null)).toEqualTypeOf<MotionStyle | void>();
    // biome-ignore lint/suspicious/noConfusingVoidType: 同上
    expectTypeOf(getCurrentHeight(null)).toEqualTypeOf<MotionStyle | void>();
  });

  it('skipOpacityTransition 返回 boolean（end handler 允许不返回 ⇒ 联合里有 void）', () => {
    // biome-ignore lint/suspicious/noConfusingVoidType: 断言的是被测签名，必须逐字一致
    expectTypeOf(skipOpacityTransition(null, { deadline: true })).toEqualTypeOf<boolean | void>();
  });

  it('负例：end handler 的事件参数类型不匹配', () => {
    neverCalled(() => {
      // @ts-expect-error 事件对象里没有 `foo` 字段会走 excess property 检查
      skipOpacityTransition(null, { foo: 1 });
    });
  });
});

// ---------------------------------------------------------------------------

describe('diffKeys', () => {
  it('返回 KeyEntity[] / KeyObject[]', () => {
    expectTypeOf(diffKeys(['a'], ['b'])).toEqualTypeOf<KeyEntity[]>();
    expectTypeOf(parseKeys(['a'])).toEqualTypeOf<KeyObject[]>();
  });

  it('key 被 String() 化 —— 数字也能传', () => {
    const result = diffKeys([1, 2], [2]);
    expectTypeOf(result[0]?.key).toEqualTypeOf<string | undefined>();
  });
});

// ---------------------------------------------------------------------------

describe('事件结构', () => {
  it('MotionEndEventLike 的三个字段都是可选的', () => {
    const event: MotionEndEventLike = {};
    expectTypeOf(event).toMatchTypeOf<MotionEndEventLike>();
    const full: MotionEndEventLike = { deadline: true, target: null, propertyName: 'height' };
    expectTypeOf(full).toMatchTypeOf<MotionEndEventLike>();
  });
});

// ---------------------------------------------------------------------------

describe('Vue 层', () => {
  it('useMotionStatus 需要 visible', () => {
    neverCalled(() => {
      // @ts-expect-error 缺 visible
      useMotionStatus({});
    });
  });

  it('CSSMotion / MotionList 是组件', () => {
    expectTypeOf(CSSMotion).not.toBeAny();
    expectTypeOf(MotionList).not.toBeAny();
  });
});
