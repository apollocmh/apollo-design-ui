/**
 * L3 · 类型测试（Popconfirm）
 *
 * 正例钉 API 形状，负例钉「哪些写法必须被类型系统拒绝」。
 * ⚠️ 负例一律写在**未被调用的闭包**里（`*.test-d.ts` 会被 vitest 真执行）。
 */

import { expectTypeOf, it } from 'vitest';
import { h } from 'vue';
import { Popconfirm } from '../index';
import type { PopconfirmButtonProps, PopconfirmProps, PopconfirmSemanticType } from '../interface';

it('PopconfirmProps 的关键字段类型', () => {
  expectTypeOf<PopconfirmProps['title']>().not.toBeNever();
  expectTypeOf<PopconfirmProps['description']>().not.toBeNever();
  expectTypeOf<PopconfirmProps['disabled']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<PopconfirmProps['showCancel']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<PopconfirmProps['open']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<PopconfirmProps['okType']>().not.toBeNever();
  expectTypeOf<PopconfirmProps['onConfirm']>().not.toBeNever();
});

it('Popconfirm button config uses Vue-native class/style attrs', () => {
  const button: PopconfirmButtonProps = {
    class: ['ok-button', { active: true }],
    style: { color: 'red' },
  };
  expectTypeOf(button.class).not.toBeNever();

  const _never = () => {
    // @ts-expect-error nested Button config uses `class`, not className
    const oldClassName: PopconfirmButtonProps = { className: 'legacy' };
    // @ts-expect-error nested Button config uses `class`, not rootClassName
    const oldRootClassName: PopconfirmButtonProps = { rootClassName: 'legacy' };
    return [oldClassName, oldRootClassName];
  };
  void _never;
});

it('语义槽集合（root / container / arrow / icon / title / content）', () => {
  expectTypeOf<keyof NonNullable<PopconfirmSemanticType['classNames']>>().toEqualTypeOf<
    'root' | 'container' | 'arrow' | 'icon' | 'title' | 'content'
  >();
  expectTypeOf<keyof NonNullable<PopconfirmSemanticType['styles']>>().toEqualTypeOf<
    'root' | 'container' | 'arrow' | 'icon' | 'title' | 'content'
  >();
});

it('负例（仅类型层面）', () => {
  void ((): void => {
    // @ts-expect-error 非法 placement
    h(Popconfirm, { placement: 'nowhere' });
  });
  void ((): void => {
    // @ts-expect-error 非法 okType
    h(Popconfirm, { okType: 'unknown' });
  });
});

it('#26.1 来自 AbstractTooltipProps 的公共浮层配置在类型与运行时都可用', () => {
  const props: Pick<
    PopconfirmProps,
    | 'getPopupContainer'
    | 'getTooltipContainer'
    | 'align'
    | 'builtinPlacements'
    | 'zIndex'
    | 'destroyOnHidden'
    | 'fresh'
    | 'forceRender'
    | 'afterOpenChange'
    | 'id'
  > = {
    getPopupContainer: () => document.body,
    getTooltipContainer: () => document.body,
    align: { offset: [0, 4] },
    builtinPlacements: { top: { offset: [0, -4] } },
    zIndex: 1200,
    destroyOnHidden: true,
    fresh: false,
    forceRender: true,
    afterOpenChange: (_open: boolean) => {},
    id: 'pc-1',
  };
  expectTypeOf(props).not.toBeNever();

  const negative = () => {
    const bad: PopconfirmProps = {
      // @ts-expect-error zIndex 不接受字符串
      zIndex: '1200',
      // @ts-expect-error afterOpenChange 是回调，不接受字符串
      afterOpenChange: 'nope',
    };
    return bad;
  };
  void negative;
});
