/**
 * L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里，CHECKLIST §一）。
 */
import { describe, expectTypeOf } from 'vitest';
import type { MenuMode, MenuProps } from '../interface';

describe('Menu · 类型', () => {
  it('mode 是 3 值联合', () => {
    expectTypeOf<MenuMode>().toEqualTypeOf<'horizontal' | 'vertical' | 'inline'>();
  });

  it('正例：合法 prop 与 items 组合', () => {
    const sample: Pick<MenuProps, 'items' | 'mode' | 'theme' | 'selectable'> = {
      items: [
        { key: '1', label: 'a' },
        { key: 'sub', label: 's', children: [{ key: '2', label: 'b' }] },
        { type: 'divider' },
        { type: 'group', label: 'g', children: [{ key: '3', label: 'c' }] },
      ],
      mode: 'inline',
      theme: 'dark',
      selectable: false,
    };
    expectTypeOf(sample).not.toBeNever();
    const items: NonNullable<MenuProps['items']> = sample.items ?? [];
    void items;
  });

  it('负例（永不调用的闭包）', () => {
    const negative = () => {
      const props: MenuProps = {
        // @ts-expect-error mode 不接受任意字符串
        mode: 'diagonal',
        // @ts-expect-error theme 不接受 'blue'
        theme: 'blue',
      };
      return props;
    };
    void negative;
  });
});
