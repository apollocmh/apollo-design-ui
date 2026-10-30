/** L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里）。 */
import type { GetContainer } from '@apollo-design/portal';
import { describe, expectTypeOf } from 'vitest';
import { h, type VNodeChild } from 'vue';
import { Drawer } from '../index';
import type {
  DrawerEmits,
  DrawerPlacement,
  DrawerProps,
  DrawerRef,
  DrawerSemanticType,
  DrawerSize,
  DrawerSlots,
  MaskType,
} from '../interface';

describe('Drawer · 类型', () => {
  it('declares real constructor events, exposed methods and elements', () => {
    expectTypeOf<Parameters<DrawerEmits['close']>>().toEqualTypeOf<[nativeEvent: Event]>();
    expectTypeOf<Parameters<DrawerEmits['afterOpenChange']>>().toEqualTypeOf<[open: boolean]>();
    expectTypeOf<Parameters<DrawerEmits['resize']>>().toEqualTypeOf<[size: number]>();
    expectTypeOf<Parameters<DrawerEmits['resizeStart']>>().toEqualTypeOf<[size: number]>();
    expectTypeOf<Parameters<DrawerEmits['resizeEnd']>>().toEqualTypeOf<[size: number]>();
    expectTypeOf<InstanceType<typeof Drawer>['nativeElement']>().toEqualTypeOf<
      DrawerRef['nativeElement']
    >();
    expectTypeOf<InstanceType<typeof Drawer>['focus']>().toEqualTypeOf<DrawerRef['focus']>();
    const props: InstanceType<typeof Drawer>['$props'] = {
      open: true,
      getContainer: false,
      maxSize: 500,
      closable: { disabled: true, 'aria-label': 'Dismiss' },
      onClose: (_event: Event) => {},
      onAfterOpenChange: (_open: boolean) => {},
      resizable: true,
      onResize: (_size: number) => {},
      onResizeStart: (_size: number) => {},
      onResizeEnd: (_size: number) => {},
    };
    h(Drawer, props);
    const negative = () => {
      const wrongEvent: InstanceType<typeof Drawer>['$props'] = {
        // @ts-expect-error close carries its native Event, not the visibility state.
        onClose: (_open: boolean) => {},
      };
      const callback: DrawerProps = {
        // @ts-expect-error Transition completion is a Vue event listener.
        afterOpenChange: (_open: boolean) => {},
      };
      const obsolete: DrawerProps = {
        // @ts-expect-error Actual DOM access uses the component template ref.
        panelRef: () => {},
      };
      const resizeCallback: DrawerProps = {
        // @ts-expect-error Resizing notifications use Vue emits, not callback configuration.
        resizable: { onResize: (_size: number) => {} },
      };
      return [wrongEvent, callback, obsolete, resizeCallback];
    };
    void negative;
  });
  it('getContainer matches the native Portal contract, including inline false', () => {
    expectTypeOf<DrawerProps['getContainer']>().toEqualTypeOf<GetContainer>();
  });

  it('content slots expose native no-argument Vue contracts', () => {
    expectTypeOf<DrawerSlots['title']>().toEqualTypeOf<(() => VNodeChild) | undefined>();
    expectTypeOf<DrawerSlots['footer']>().toEqualTypeOf<(() => VNodeChild) | undefined>();
    expectTypeOf<DrawerSlots['extra']>().toEqualTypeOf<(() => VNodeChild) | undefined>();
    expectTypeOf<DrawerSlots['closeIcon']>().toEqualTypeOf<(() => VNodeChild) | undefined>();
  });
  it('DrawerPlacement 是 4 值联合', () => {
    expectTypeOf<DrawerPlacement>().toEqualTypeOf<'top' | 'right' | 'bottom' | 'left'>();
  });

  it('DrawerSize 接受预设与数值/字符串', () => {
    expectTypeOf<'default'>().toMatchTypeOf<DrawerSize>();
    expectTypeOf<736>().toMatchTypeOf<DrawerSize>();
    expectTypeOf<'50%'>().toMatchTypeOf<DrawerSize>();
  });

  it('MaskType 接受布尔与配置对象', () => {
    expectTypeOf<boolean>().toMatchTypeOf<MaskType>();
    expectTypeOf<{
      enabled?: boolean;
      blur?: boolean;
      closable?: boolean;
    }>().toMatchTypeOf<MaskType>();
  });

  it('DrawerSemanticType 有 12 个槽（含 deprecated 的 content）', () => {
    expectTypeOf<NonNullable<DrawerSemanticType['classNames']>>().toHaveProperty('section');
    expectTypeOf<NonNullable<DrawerSemanticType['classNames']>>().toHaveProperty('dragger');
    expectTypeOf<NonNullable<DrawerSemanticType['classNames']>>().toHaveProperty('content');
  });

  it('DrawerProps 含 size / resizable / focusable / destroyOnHidden', () => {
    expectTypeOf<DrawerProps>().toHaveProperty('size');
    expectTypeOf<DrawerProps>().toHaveProperty('resizable');
    expectTypeOf<DrawerProps>().toHaveProperty('focusable');
    expectTypeOf<DrawerProps>().toHaveProperty('destroyOnHidden');
  });

  it('正例：合法配置', () => {
    const sample: DrawerProps = {
      open: true,
      placement: 'bottom',
      size: 'large',
      resizable: true,
      onResize: () => {},
      mask: { blur: true, closable: false },
      focusable: { trap: true },
      title: 't',
    };
    expectTypeOf(sample).not.toBeNever();
  });

  it('负例（永不调用的闭包）', () => {
    const negative = () => {
      // @ts-expect-error placement 不接受任意字符串
      const a: DrawerProps = { placement: 'center' };
      // @ts-expect-error size 不接受对象
      const b: DrawerProps = { size: {} };
      return [a, b];
    };
    void negative;
  });
});
