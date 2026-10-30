/**
 * L3 · 类型测试（Popconfirm）
 *
 * 正例钉 API 形状，负例钉「哪些写法必须被类型系统拒绝」。
 * ⚠️ 负例一律写在**未被调用的闭包**里（`*.test-d.ts` 会被 vitest 真执行）。
 */

import { expectTypeOf, it } from 'vitest';
import { h } from 'vue';
import { Popconfirm, PopconfirmPurePanel } from '../index';
import type {
  PopconfirmButtonProps,
  PopconfirmEmits,
  PopconfirmProps,
  PopconfirmSemanticType,
} from '../interface';

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
    | 'onAfterOpenChange'
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
    onAfterOpenChange: (_open: boolean) => {},
    id: 'pc-1',
  };
  expectTypeOf(props).not.toBeNever();

  const negative = () => {
    const bad: PopconfirmProps = {
      // @ts-expect-error zIndex 不接受字符串
      zIndex: '1200',
      // @ts-expect-error afterOpenChange 的 Vue 监听器不接受字符串
      onAfterOpenChange: 'nope',
    };
    return bad;
  };
  void negative;
});

it('keeps constructor event payloads and real refs precise', () => {
  expectTypeOf<Parameters<PopconfirmEmits['openChange']>>().toEqualTypeOf<[open: boolean]>();
  expectTypeOf<Parameters<PopconfirmEmits['popupClick']>>().toEqualTypeOf<[event: MouseEvent]>();
  expectTypeOf<
    InstanceType<typeof Popconfirm>['nativeElement']
  >().toEqualTypeOf<HTMLElement | null>();
  expectTypeOf<
    InstanceType<typeof Popconfirm>['popupElement']
  >().toEqualTypeOf<HTMLDivElement | null>();
  const props: PopconfirmProps = {
    onOpenChange: (_open: boolean) => {},
    'onUpdate:open': (_open: boolean) => {},
    onPopupClick: (_event: MouseEvent) => {},
    onConfirm: async (_event?: MouseEvent) => {},
    onCancel: (_event?: MouseEvent) => {},
  };
  h(Popconfirm, props);
  h(PopconfirmPurePanel, { onPopupClick: (_event: MouseEvent) => {} });
  const negative = () => {
    // @ts-expect-error Open proposals carry a boolean.
    h(Popconfirm, { onOpenChange: (_event: MouseEvent) => {} });
    // @ts-expect-error Popup clicks carry the original MouseEvent.
    h(Popconfirm, { onPopupClick: (_open: boolean) => {} });
    // @ts-expect-error PurePanel owns the same MouseEvent popupClick event.
    h(PopconfirmPurePanel, { onPopupClick: (_open: boolean) => {} });
  };
  void negative;
});
