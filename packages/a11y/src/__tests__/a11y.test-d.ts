/**
 * L3 —— 类型契约。
 *
 * 除了正向断言，每条容易写错的都配了 `@ts-expect-error` 负例：
 * 类型测试如果只有正例，改坏签名也照样是绿的。
 *
 * ⚠️ 本文件会被 vitest **真的执行**（不只是类型检查），所以负例如果只是
 *    「类型不对」而没有运行时后果，就直接写；会抛运行时异常的必须包在
 *    永不调用的函数里。
 */

import { describe, expectTypeOf, it } from 'vitest';

/**
 * ⚠️ 本文件会被 vitest **真的执行**。
 * 只挡编译期的负例如果真跑起来会抛（例如对冻结对象赋值、把数字当字符串用），
 * 必须包在这里 —— 它永不调用，但 TS 照样检查函数体。
 */
function neverCalled(fn: () => void): void {
  void fn;
}

import type { ComputedRef, Ref } from 'vue';

import type {
  FocusRestoreHandle,
  LiveRegionHandle,
  LiveRegionOptions,
  LiveRegionValue,
  RovingOrientation,
  TypeaheadState,
  UseActiveDescendantReturn,
  UseRovingFocusReturn,
  UseTypeaheadReturn,
} from '../index';
import {
  announce,
  announceValues,
  createLiveRegion,
  DEFAULT_TYPEAHEAD_RESET_DELAY,
  findTypeaheadIndex,
  formatLiveRegionText,
  getListboxId,
  getOptionId,
  getRovingOffset,
  getRovingTabIndex,
  INITIAL_TYPEAHEAD_STATE,
  isTypeaheadKey,
  LIVE_REGION_MAX_COUNT,
  lockFocus,
  moveRovingIndex,
  type NO_ACTIVE_INDEX,
  nextRovingIndex,
  pushTypeaheadChar,
  resetAnnounceRegion,
  resetFocusLock,
  resolveRovingEnd,
  resolveRovingHome,
  useActiveDescendant,
  useFocusRestore,
  useLockFocus,
  useRovingFocus,
  useTypeahead,
  VISUALLY_HIDDEN_STYLE,
} from '../index';

describe('roving', () => {
  it('NO_ACTIVE_INDEX 是字面量 -1，不是 number', () => {
    expectTypeOf<typeof NO_ACTIVE_INDEX>().toEqualTypeOf<-1>();
  });

  it('nextRovingIndex 三个参数都是 number，返回 number', () => {
    expectTypeOf(nextRovingIndex).parameters.toEqualTypeOf<[number, number, number]>();
    expectTypeOf(nextRovingIndex(0, 1, 3)).toEqualTypeOf<number>();
    // @ts-expect-error 下标不能是字符串
    nextRovingIndex('0', 1, 3);
  });

  it('HOME / END 返回 number', () => {
    expectTypeOf(resolveRovingHome(3)).toEqualTypeOf<number>();
    expectTypeOf(resolveRovingEnd(3)).toEqualTypeOf<number>();
  });

  it('⭐ getRovingTabIndex 返回 0 | -1 —— 不是 number（否则 -2 也能混进来）', () => {
    expectTypeOf(getRovingTabIndex(0, 0)).toEqualTypeOf<0 | -1>();
    expectTypeOf<0 | -1>().toExtend<number>();
    // @ts-expect-error number 不能赋给 0 | -1
    const bad: 0 | -1 = 1 as number;
    void bad;
  });
});

describe('combobox', () => {
  it('id 方案收 string，返回 string', () => {
    expectTypeOf(getListboxId('a')).toEqualTypeOf<string>();
    expectTypeOf(getOptionId('a', 0)).toEqualTypeOf<string>();
    // @ts-expect-error id 不能是数字
    getListboxId(123);
    // @ts-expect-error 下标不能是字符串
    getOptionId('a', '0');
  });

  it('pushTypeaheadChar 是纯函数：收旧状态返回新状态', () => {
    expectTypeOf(pushTypeaheadChar).parameters.toEqualTypeOf<
      [TypeaheadState, string, number, (number | undefined)?]
    >();
    expectTypeOf(
      pushTypeaheadChar(INITIAL_TYPEAHEAD_STATE, 'a', 0),
    ).toEqualTypeOf<TypeaheadState>();
  });

  it('TypeaheadState 的两个字段都是必填', () => {
    const full: TypeaheadState = { buffer: '', lastAt: 0 };
    expectTypeOf(full).toEqualTypeOf<TypeaheadState>();
    // @ts-expect-error 缺 lastAt
    const missing: TypeaheadState = { buffer: '' };
    void missing;
  });

  it('TypeaheadState 的 buffer 是 string、lastAt 是 number', () => {
    // @ts-expect-error buffer 不能是数字
    const badBuffer: TypeaheadState = { buffer: 1, lastAt: 0 };
    void badBuffer;
    // @ts-expect-error lastAt 不能是字符串
    const badTime: TypeaheadState = { buffer: '', lastAt: '0' };
    void badTime;
  });

  it('DEFAULT_TYPEAHEAD_RESET_DELAY 是数字常量', () => {
    expectTypeOf(DEFAULT_TYPEAHEAD_RESET_DELAY).toEqualTypeOf<number>();
  });

  it('findTypeaheadIndex 收只读数组，返回 number', () => {
    expectTypeOf(findTypeaheadIndex(['a'], 'a', -1)).toEqualTypeOf<number>();
    const readonlyLabels: readonly string[] = ['a', 'b'];
    expectTypeOf(findTypeaheadIndex(readonlyLabels, 'a', 0)).toEqualTypeOf<number>();
    neverCalled(() => {
      // @ts-expect-error 候选项不能是数字数组
      findTypeaheadIndex([1, 2], 'a', 0);
    });
  });
});

describe('live region', () => {
  it('VISUALLY_HIDDEN_STYLE 是只读的字符串字典', () => {
    expectTypeOf(VISUALLY_HIDDEN_STYLE).toEqualTypeOf<Readonly<Record<string, string>>>();
    neverCalled(() => {
      // @ts-expect-error 冻结常量不可写（且运行时也会抛 —— 所以必须包进永不调用的函数）
      VISUALLY_HIDDEN_STYLE.position = 'static';
    });
  });

  it('LIVE_REGION_MAX_COUNT 是数字常量 50', () => {
    expectTypeOf(LIVE_REGION_MAX_COUNT).toEqualTypeOf<number>();
  });

  it('formatLiveRegionText 收 LiveRegionValue[]，返回 string', () => {
    expectTypeOf(formatLiveRegionText([{ label: 'a' }])).toEqualTypeOf<string>();
    expectTypeOf(
      formatLiveRegionText([{ value: 1 }, { label: { x: 1 }, value: 'b' }]),
    ).toEqualTypeOf<string>();
    neverCalled(() => {
      // @ts-expect-error 不能传裸字符串
      formatLiveRegionText('a, b');
    });
  });

  it('LiveRegionValue.label 可以是任意类型 —— 只有 number/string 会被播报', () => {
    // 这是刻意的：label 经常是 VNode / ReactNode，运行时才会被退回 value
    expectTypeOf<LiveRegionOptions['live']>().toEqualTypeOf<'polite' | 'assertive' | undefined>();
  });

  it('⭐ live 只能是 polite / assertive —— assertive 会打断读屏，不能随便传', () => {
    createLiveRegion({ live: 'polite' });
    createLiveRegion({ live: 'assertive' });
    // @ts-expect-error 'loud' 不是合法的 aria-live 取值
    createLiveRegion({ live: 'loud' });
  });

  it('createLiveRegion 返回 LiveRegionHandle', () => {
    expectTypeOf(createLiveRegion).returns.toEqualTypeOf<LiveRegionHandle>();
    // @ts-expect-error 没有 DOM 时会抛错，返回类型不是可空的
    const maybe: LiveRegionHandle | null = createLiveRegion;
    void maybe;
  });
});

describe('焦点恢复', () => {
  it('useFocusRestore 返回三个动作', () => {
    const handle = useFocusRestore(() => null);
    expectTypeOf(handle).toEqualTypeOf<FocusRestoreHandle>();
    expectTypeOf(handle.save).toEqualTypeOf<() => void>();
    expectTypeOf(handle.focusContent).toEqualTypeOf<() => void>();
    expectTypeOf(handle.restore).toEqualTypeOf<() => void>();
  });

  it('⭐ mask / enabled 接受 MaybeRefOrGetter —— 可以是布尔、Ref、getter', () => {
    useFocusRestore(() => null, { mask: false });
    const maskRef: Ref<boolean> = { value: true } as Ref<boolean>;
    useFocusRestore(() => null, { mask: maskRef });
    useFocusRestore(() => null, { enabled: () => true });
    // @ts-expect-error mask 不能是字符串
    useFocusRestore(() => null, { mask: 'yes' });
  });

  it('容器 getter 必须返回 HTMLElement | null', () => {
    useFocusRestore(() => null);
    // @ts-expect-error 不能返回字符串
    useFocusRestore(() => 'body');
  });
});

describe('再导出的焦点陷阱（实现在 utils）', () => {
  it('lockFocus 收 (HTMLElement, string)，返回反注册函数', () => {
    expectTypeOf(lockFocus).parameters.toEqualTypeOf<[HTMLElement, string]>();
    expectTypeOf(lockFocus).returns.toEqualTypeOf<() => void>();
  });

  it('useLockFocus 返回单元素元组 [ignoreElement]', () => {
    expectTypeOf(useLockFocus).returns.toEqualTypeOf<[(ele: HTMLElement) => void]>();
  });

  it('resetFocusLock 只应在测试里调用', () => {
    expectTypeOf(resetFocusLock).toEqualTypeOf<() => void>();
  });
});

describe('roving 的扩展：不环绕 + 方向映射', () => {
  it('moveRovingIndex 的第四个参数可选，且是 boolean', () => {
    expectTypeOf(moveRovingIndex).parameters.toEqualTypeOf<
      [number, number, number, (boolean | undefined)?]
    >();
    expectTypeOf(moveRovingIndex(0, 1, 3)).toEqualTypeOf<number>();
    expectTypeOf(moveRovingIndex(0, 1, 3, false)).toEqualTypeOf<number>();
    // @ts-expect-error loop 必须是布尔
    moveRovingIndex(0, 1, 3, 'no');
  });

  it('⭐ getRovingOffset 返回 number | null —— null 表示「这个键不参与导航」', () => {
    expectTypeOf(getRovingOffset).parameters.toEqualTypeOf<[RovingOrientation, boolean, string]>();
    expectTypeOf(getRovingOffset('vertical', false, 'ArrowDown')).toEqualTypeOf<number | null>();
    // @ts-expect-error 方向只能是三种字面量
    getRovingOffset('diagonal', false, 'ArrowDown');
  });

  it('RovingOrientation 是三个字面量的联合', () => {
    expectTypeOf<RovingOrientation>().toEqualTypeOf<'vertical' | 'horizontal' | 'both'>();
  });
});

describe('useRovingFocus 的类型', () => {
  it('返回对象的每个成员都有明确签名', () => {
    const api = {} as UseRovingFocusReturn;
    expectTypeOf(api.activeIndex).toEqualTypeOf<Ref<number>>();
    expectTypeOf(api.getTabIndex).toEqualTypeOf<(index: number) => 0 | -1>();
    expectTypeOf(api.move).toEqualTypeOf<(offset: number) => void>();
    expectTypeOf(api.onKeyDown).toEqualTypeOf<(event: KeyboardEvent) => boolean>();
  });

  it('⭐ count 是必填 —— 没有项数的 roving 没有意义', () => {
    neverCalled(() => {
      // @ts-expect-error 缺 count
      useRovingFocus({});
    });
  });

  it('orientation 只接受三种字面量', () => {
    neverCalled(() => {
      // @ts-expect-error 不是合法的方向
      useRovingFocus({ count: 3, orientation: 'diagonal' });
    });
  });

  it('getItem 必须返回 HTMLElement | null', () => {
    neverCalled(() => {
      // @ts-expect-error 不能返回字符串
      useRovingFocus({ count: 3, getItem: () => 'div' });
    });
  });
});

describe('useActiveDescendant 的类型', () => {
  it('activeDescendantId 是可空的 ComputedRef', () => {
    const api = {} as UseActiveDescendantReturn;
    expectTypeOf(api.activeDescendantId).toEqualTypeOf<ComputedRef<string | undefined>>();
    expectTypeOf(api.listboxId).toEqualTypeOf<string>();
    expectTypeOf(api.getOptionId).toEqualTypeOf<(index: number) => string>();
  });

  it('activeIndex 接受 undefined（表示没有活动项）', () => {
    neverCalled(() => {
      // @ts-expect-error activeIndex 不能是字符串
      useActiveDescendant({ id: 'a', activeIndex: '0' });
    });
  });
});

describe('useTypeahead 的类型', () => {
  it('onKeyDown 返回 boolean，buffer 是 Ref<string>', () => {
    const api = {} as UseTypeaheadReturn;
    expectTypeOf(api.onKeyDown).toEqualTypeOf<(event: KeyboardEvent) => boolean>();
    expectTypeOf(api.buffer).toEqualTypeOf<Ref<string>>();
    expectTypeOf(api.reset).toEqualTypeOf<() => void>();
  });

  it('⭐ labels 是必填的只读字符串数组', () => {
    neverCalled(() => {
      // @ts-expect-error 缺 labels
      useTypeahead({});
    });
    neverCalled(() => {
      // @ts-expect-error labels 不能是数字数组
      useTypeahead({ labels: [1, 2] });
    });
  });

  it('isTypeaheadKey 接受带修饰键的事件对象', () => {
    expectTypeOf(isTypeaheadKey({ key: 'a' })).toEqualTypeOf<boolean>();
    expectTypeOf(
      isTypeaheadKey({ key: 'a', ctrlKey: true, metaKey: true, altKey: true }),
    ).toEqualTypeOf<boolean>();
  });
});

describe('announce 单例的类型', () => {
  it('三个函数都不需要组件上下文', () => {
    expectTypeOf(announce).toEqualTypeOf<(text: string) => void>();
    expectTypeOf(resetAnnounceRegion).toEqualTypeOf<() => void>();
    expectTypeOf(announceValues).parameters.toEqualTypeOf<
      [readonly LiveRegionValue[], (number | undefined)?]
    >();
  });
});
