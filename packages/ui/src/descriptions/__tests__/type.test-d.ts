/**
 * L3 · 类型测试（Descriptions）—— 负例闭包。
 */

import { describe, expectTypeOf, it } from 'vitest';
import { Descriptions } from '../index';
import type {
  DescriptionsColumn,
  DescriptionsItemType,
  DescriptionsProps,
  DescriptionsRef,
  DescriptionsSemanticClassNames,
} from '../interface';

describe('Descriptions · Props 类型', () => {
  it('★ column 是数字或响应式映射', () => {
    expectTypeOf<DescriptionsColumn>().toEqualTypeOf<
      number | Partial<Record<'xxxl' | 'xxl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs', number>>
    >();
  });

  it('★ item 的 span 支持数字 / filled / 响应式映射', () => {
    expectTypeOf<DescriptionsItemType['span']>().toEqualTypeOf<
      | number
      | 'filled'
      | Partial<Record<'xxxl' | 'xxl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs', number>>
      | undefined
    >();
  });

  it('★ layout / size 字面量集合', () => {
    expectTypeOf<NonNullable<DescriptionsProps['layout']>>().toEqualTypeOf<
      'horizontal' | 'vertical'
    >();
    expectTypeOf<NonNullable<DescriptionsProps['size']>>().toEqualTypeOf<
      'large' | 'medium' | 'small' | 'default' | 'middle'
    >();
  });

  it('★ 语义化槽位固定六槽（root/header/title/extra/label/content）', () => {
    expectTypeOf<keyof DescriptionsSemanticClassNames>().toEqualTypeOf<
      'root' | 'header' | 'title' | 'extra' | 'label' | 'content'
    >();
  });
});

describe('Descriptions · Ref 形状', () => {
  it('只有 nativeElement（与 antd 的 DescriptionsRef 一致）', () => {
    expectTypeOf<DescriptionsRef['nativeElement']>().toEqualTypeOf<HTMLDivElement | null>();
    expectTypeOf<keyof DescriptionsRef>().toEqualTypeOf<'nativeElement'>();
  });
});

describe('Descriptions · 复合组件', () => {
  it('Descriptions 静态挂 Item（与 antd 的 CompoundedComponent 一致）', () => {
    expectTypeOf(Descriptions).toHaveProperty('Item');
  });
});
