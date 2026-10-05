/**
 * L3 · 类型测试（含负例）
 *
 * ⚠️ `*.test-d.ts` 会被 vitest **真的执行**：负例必须包在**永不调用的闭包**里，
 *    否则运行时崩溃（TESTING.md / PITFALLS 74）。
 *
 * ── 本文件钉的六类判据 ───────────────────────────────────────────────────────
 *
 * 1. **本组件「没有」的东西**：`children` prop（Vue 侧是默认插槽，规则 C19）、
 *    **任何 `emits`**（`onClick` / `onError` 都是**上游的 prop**）。
 * 2. **`ref` 的形状**：`{ nativeElement }` 且**可空** —— `Avatar` 是 `<span>`、
 *    `Avatar.Group` 是 `<div>`（上游 `Avatar` 是 `forwardRef<HTMLSpanElement>`，
 *    本仓统一成对象）。
 * 3. **`AvatarSize` 的四个成员**：`SizeType`（含 `'middle'` / `'medium'`）/ `'default'`（废弃）/
 *    `number` / `ScreenSizeMap`。
 * 4. **`ScreenSizeMap` 的键是 `Breakpoint`**（7 个断点，**从大到小**）。
 * 5. **`AvatarConfig` 只有 `className` / `style`** —— ⚠️ **没有** `classNames` / `styles`
 *    （与 card / empty / skeleton 不同）。
 * 6. **复合组件**：`Avatar.Group` 在**类型层**可见（`Object.assign` 的交叉类型），
 *    两个组件都带 `install`。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { CSSProperties, VNodeChild } from 'vue';
import type { Breakpoint } from '../../_internal/responsive-observer';
import type { SizeType } from '../../config-provider/size-context';
import type { Avatar, AvatarGroup } from '../index';
import type {
  AvatarConfig,
  AvatarContextType,
  AvatarGroupMax,
  AvatarGroupProps,
  AvatarGroupRef,
  AvatarGroupSlot,
  AvatarProps,
  AvatarRef,
  AvatarShape,
  AvatarSize,
  AvatarSlot,
  ScreenSizeMap,
} from '../interface';

describe('Avatar · Props 类型', () => {
  it('核心 props 的形态', () => {
    expectTypeOf<AvatarProps['prefixCls']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<AvatarProps['shape']>().toEqualTypeOf<AvatarShape | undefined>();
    expectTypeOf<AvatarProps['size']>().toEqualTypeOf<AvatarSize | undefined>();
    expectTypeOf<AvatarProps['gap']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<AvatarProps['src']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<AvatarProps['srcSet']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<AvatarProps['draggable']>().toEqualTypeOf<
      boolean | 'true' | 'false' | undefined
    >();
    expectTypeOf<AvatarProps['icon']>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<AvatarProps['alt']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<AvatarProps['crossOrigin']>().toEqualTypeOf<
      '' | 'anonymous' | 'use-credentials' | undefined
    >();
  });

  it('根 `class` / `style` 是 Vue 原生 attrs，不重复声明为 AvatarProps', () => {
    type PublicProps = InstanceType<typeof Avatar>['$props'];
    const nativeAttrs: PublicProps = {
      class: ['native-avatar', { active: true }],
      style: { color: 'red' },
    };
    expectTypeOf(nativeAttrs).toMatchTypeOf<PublicProps>();

    const _never = () => {
      // @ts-expect-error `className` 由 Vue 原生 `class` 取代
      const badClassName: AvatarProps = { className: 'legacy' };
      // @ts-expect-error `rootClassName` 不是 Avatar 的 prop
      const badRootClassName: AvatarProps = { rootClassName: 'legacy' };
      // @ts-expect-error 原生 `style` 不是 AvatarProps
      const badStyle: AvatarProps = { style: { color: 'red' } };
      return [badClassName, badRootClassName, badStyle];
    };
    void _never;
  });

  it('🚨 `AvatarSize` 是四个成员的联合（含 `number` 与响应式表）', () => {
    expectTypeOf<AvatarSize>().toEqualTypeOf<SizeType | 'default' | number | ScreenSizeMap>();
    expectTypeOf<AvatarShape>().toEqualTypeOf<'circle' | 'square'>();
  });

  it('🚨 `ScreenSizeMap` 的键是 `Breakpoint`（7 个断点，值可缺省）', () => {
    expectTypeOf<ScreenSizeMap>().toEqualTypeOf<Partial<Record<Breakpoint, number>>>();
    expectTypeOf<Breakpoint>().toEqualTypeOf<'xxxl' | 'xxl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs'>();
  });

  it('🚨 `onClick` / `onError` 都是 **prop**（不是 emits）；`onError` 有返回值语义', () => {
    expectTypeOf<NonNullable<AvatarProps['onClick']>>().parameters.toEqualTypeOf<
      [e?: MouseEvent]
    >();
    expectTypeOf<NonNullable<AvatarProps['onClick']>>().returns.toEqualTypeOf<void>();
    // ⚠️ 返回 `boolean` —— `false` 表示「阻止内置回退」
    expectTypeOf<NonNullable<AvatarProps['onError']>>().returns.toEqualTypeOf<boolean>();
  });

  it('`AvatarContextType` 只有两个字段', () => {
    expectTypeOf<keyof AvatarContextType>().toEqualTypeOf<'size' | 'shape'>();
  });
});

describe('Avatar · Avatar.Group 类型', () => {
  it('`max` 是三字段对象；四条 deprecated 键保留', () => {
    expectTypeOf<keyof AvatarGroupMax>().toEqualTypeOf<'count' | 'style' | 'popover'>();
    expectTypeOf<AvatarGroupMax['count']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<AvatarGroupMax['style']>().toEqualTypeOf<CSSProperties | undefined>();

    expectTypeOf<AvatarGroupProps['maxCount']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<AvatarGroupProps['maxStyle']>().toEqualTypeOf<CSSProperties | undefined>();
    expectTypeOf<AvatarGroupProps['maxPopoverPlacement']>().toEqualTypeOf<
      'top' | 'bottom' | undefined
    >();
    expectTypeOf<AvatarGroupProps['maxPopoverTrigger']>().toEqualTypeOf<
      'hover' | 'focus' | 'click' | undefined
    >();
  });

  it('`size` / `shape` 透传给子头像（类型与 `Avatar` 同源）', () => {
    expectTypeOf<AvatarGroupProps['size']>().toEqualTypeOf<AvatarSize | undefined>();
    expectTypeOf<AvatarGroupProps['shape']>().toEqualTypeOf<AvatarShape | undefined>();
  });
});

describe('Avatar · ref / 子组件 / 可安装', () => {
  it('🚨 `AvatarRef` 是 `HTMLSpanElement`、`AvatarGroupRef` 是 `HTMLDivElement`，都**可空**', () => {
    expectTypeOf<AvatarRef>().toEqualTypeOf<{ nativeElement: HTMLSpanElement | null }>();
    expectTypeOf<AvatarGroupRef>().toEqualTypeOf<{ nativeElement: HTMLDivElement | null }>();
  });

  it('🚨 `Avatar.Group` 在**类型层**可见（`Object.assign` 的交叉类型）', () => {
    expectTypeOf<typeof Avatar>().toHaveProperty('Group');
    expectTypeOf<typeof Avatar.Group>().toHaveProperty('install');
  });

  it('两个组件都带 `install`（`withInstall` 的产物）', () => {
    expectTypeOf<typeof AvatarGroup>().toHaveProperty('install');
    expectTypeOf<typeof Avatar>().toHaveProperty('install');
  });

  it('两个插槽类型都是「返回 `VNodeChild` 的函数」', () => {
    expectTypeOf<AvatarSlot>().returns.toEqualTypeOf<VNodeChild>();
    expectTypeOf<AvatarGroupSlot>().returns.toEqualTypeOf<VNodeChild>();
  });

  it('🚨 `AvatarConfig` **只有** `className` / `style`（没有语义化槽）', () => {
    expectTypeOf<keyof AvatarConfig>().toEqualTypeOf<'className' | 'style'>();
  });
});

describe('Avatar · 负例（永不调用的闭包内）', () => {
  it('非法的 `size` / `shape` / `crossOrigin` 必须被拒绝', () => {
    const _never = () => {
      // @ts-expect-error `children` 不是 prop（Vue 侧是默认插槽，规则 C19）
      const badChildren: AvatarProps = { children: 'x' };
      // @ts-expect-error `shape` 只有 `'circle' | 'square'`
      const badShape: AvatarProps = { shape: 'round' };
      // @ts-expect-error `size` 不接受任意字符串
      const badSize: AvatarProps = { size: 'huge' };
      // @ts-expect-error `crossOrigin` 是三个字面量之一
      const badCross: AvatarProps = { crossOrigin: 'yes' };
      return [badChildren, badShape, badSize, badCross];
    };
    void _never;
  });

  it('`ScreenSizeMap` 的键必须是断点、值必须是数字', () => {
    const _never = () => {
      // @ts-expect-error `'huge'` 不是断点
      const badKey: ScreenSizeMap = { huge: 40 };
      // @ts-expect-error 值必须是数字
      const badValue: ScreenSizeMap = { xs: '24px' };
      return [badKey, badValue];
    };
    void _never;
  });

  it('`Avatar.Group` 的 `maxPopoverPlacement` / `maxPopoverTrigger` 取值受限', () => {
    const _never = () => {
      // @ts-expect-error 只有 `'top' | 'bottom'`
      const badPlacement: AvatarGroupProps = { maxPopoverPlacement: 'left' };
      // @ts-expect-error 只有 `'hover' | 'focus' | 'click'`
      const badTrigger: AvatarGroupProps = { maxPopoverTrigger: 'contextMenu' };
      return [badPlacement, badTrigger];
    };
    void _never;
  });

  it('`onError` 的返回值必须是 `boolean`（不能是任意值）', () => {
    const _never = () => {
      // @ts-expect-error 返回 `string` 不是 `boolean`
      const bad: AvatarProps = { onError: () => 'no' };
      return bad;
    };
    void _never;
  });
});
