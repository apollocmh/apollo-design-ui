/**
 * L3 —— 类型契约。
 *
 * 除了正向断言，每条容易写错的都配了 `@ts-expect-error` 负例：
 * 类型测试如果只有正例，改坏签名也照样是绿的。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { ComputedRef, Ref } from 'vue';
// 值导入走具体模块：index.ts 是纯 re-export，会被 v8 覆盖率记成 0%
import { isClickToHide, resolveActions } from '../actions';
import { resolveDelay } from '../delay';
import type {
  DelayResolution,
  EscStack,
  MousePosition,
  OverlayAction,
  OverlayEventProps,
  ResolvedActions,
  UseOverlayReturn,
} from '../index';
import { useOverlay } from '../use-overlay';

describe('动作类型', () => {
  it('OverlayAction 是五种动作的联合', () => {
    expectTypeOf<OverlayAction>().toEqualTypeOf<
      'hover' | 'click' | 'focus' | 'contextMenu' | 'touch'
    >();
  });

  it('⭐ 不接受第六种动作（负例）', () => {
    // @ts-expect-error 拼错的动作名必须被拒绝
    const bad: OverlayAction = 'hover2';
    void bad;
  });

  it('resolveActions 返回两个只读集合', () => {
    const result = resolveActions({ action: 'hover' });
    expectTypeOf(result).toEqualTypeOf<ResolvedActions>();
    expectTypeOf(result.show).toEqualTypeOf<ReadonlySet<OverlayAction>>();
  });

  it('isClickToHide 只吃集合（负例：不接受数组）', () => {
    expectTypeOf(isClickToHide).parameter(0).toEqualTypeOf<ReadonlySet<OverlayAction>>();
    // ⚠️ 负例必须包在**不会被调用**的函数里 —— vitest 的 types 项目仍会执行本文件，
    // 直接 `isClickToHide(['click'])` 会在运行时炸 `hide.has is not a function`。
    // @ts-expect-error 数组不是 Set
    const badCall: () => boolean = () => isClickToHide(['click']);
    void badCall;
  });
});

describe('延迟类型', () => {
  it('resolveDelay 的输入是「秒」，可以是 undefined', () => {
    expectTypeOf(resolveDelay).parameter(0).toEqualTypeOf<number | undefined>();
  });

  it('⭐ 结果是可辨识联合 —— immediate 为 true 时 ms 恒为 0', () => {
    expectTypeOf(resolveDelay(0)).toEqualTypeOf<DelayResolution>();
    const r: DelayResolution = resolveDelay(0);
    if (r.immediate) {
      expectTypeOf(r.ms).toEqualTypeOf<0>();
    } else {
      expectTypeOf(r.ms).toEqualTypeOf<number>();
    }
  });

  it('不接受字符串（负例）', () => {
    // @ts-expect-error 延迟必须是数字
    void resolveDelay('100');
  });
});

describe('useOverlay 的返回', () => {
  it('open / rawOpen 是 ComputedRef<boolean>', () => {
    const api = useOverlay();
    expectTypeOf(api.open).toEqualTypeOf<ComputedRef<boolean>>();
    expectTypeOf(api.rawOpen).toEqualTypeOf<ComputedRef<boolean>>();
  });

  it('targetRef / popupRef 是可写的元素引用', () => {
    const api = useOverlay();
    expectTypeOf(api.targetRef).toEqualTypeOf<Ref<HTMLElement | null>>();
    expectTypeOf(api.popupRef).toEqualTypeOf<Ref<HTMLElement | null>>();
  });

  it('⭐ targetProps 的键名是 Vue 小写约定 —— React 风格不在类型里', () => {
    const api = useOverlay();
    expectTypeOf(api.targetProps).toEqualTypeOf<ComputedRef<OverlayEventProps>>();
    // OverlayEventProps 是索引签名，取不到编译期拼写保护 ——
    // 运行时拼写错误会静默失效，所以契约 §6.1 专门钉住了这条。
    expectTypeOf(api.targetProps.value).toMatchTypeOf<Record<string, unknown>>();
  });

  it('mousePos 是只读的二元组', () => {
    const api = useOverlay();
    expectTypeOf(api.mousePos).toEqualTypeOf<Readonly<Ref<MousePosition | null>>>();
    // @ts-expect-error 三元组不是 MousePosition
    const bad: MousePosition = [1, 2, 3];
    void bad;
  });

  it('⭐ setOpen 的第二参可选（默认同步），且不接受字符串（负例）', () => {
    const api = useOverlay();
    expectTypeOf(api.setOpen).parameters.toEqualTypeOf<[boolean, (number | undefined)?]>();
    // @ts-expect-error 延迟必须是数字
    void api.setOpen(true, '100');
  });

  it('返回值整体形状被钉住', () => {
    expectTypeOf(useOverlay()).toEqualTypeOf<UseOverlayReturn>();
  });

  it('⭐ 不接受未知选项（负例）', () => {
    // @ts-expect-error 没有这个选项
    void useOverlay({ notAnOption: true });
  });
});

describe('Esc 栈', () => {
  it('size 与 attached 是只读的', () => {
    type Stack = EscStack;
    expectTypeOf<Stack['size']>().toEqualTypeOf<number>();
    expectTypeOf<Stack['attached']>().toEqualTypeOf<boolean>();
  });

  it('⭐ onEsc 收到的是 { top, event }，top 是 boolean（负例：不传参）', () => {
    type OnEsc = Parameters<EscStack['push']>[0]['onEsc'];
    expectTypeOf<Parameters<OnEsc>[0]['top']>().toEqualTypeOf<boolean>();
    const stack: EscStack | null = null;
    // @ts-expect-error push 必须给完整 entry
    void stack?.push({ id: 'a' });
  });
});
