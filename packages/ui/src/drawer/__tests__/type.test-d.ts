/** L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里）。 */
import { describe, expectTypeOf } from 'vitest';
import type {
  DrawerPlacement,
  DrawerProps,
  DrawerSemanticType,
  DrawerSize,
  MaskType,
} from '../interface';

describe('Drawer · 类型', () => {
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
      resizable: { onResize: () => {} },
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
