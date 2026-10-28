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

import { h } from 'vue';
import type {
  DescriptionsConfig,
  DescriptionsItemProps,
  DescriptionsItemSlots,
  DescriptionsSemanticInfo,
  DescriptionsSlots,
} from '../interface';

it('native slots, StyleValue data and named semantic context stay precise', () => {
  const semantic: DescriptionsProps['classNames'] = ({ props }) => ({
    label: props.size === 'small' ? 'small-label' : 'label',
  });
  const provider: DescriptionsConfig = { classNames: semantic, style: { padding: '4px' } };
  const item: DescriptionsItemType = {
    key: Symbol('field'),
    label: [h('b', 'Label'), 0],
    children: h('input'),
    style: ['padding: 4px', { width: '100%' }],
  };
  const itemProps: DescriptionsItemProps = {
    label: 'Text',
    span: 'filled',
    styles: { label: { '--label-color': 'red' } },
  };
  const slots: DescriptionsSlots = { title: () => [h('b'), 0], extra: () => [], default: () => [] };
  const itemSlots: DescriptionsItemSlots = {
    label: () => [h('b', 'Rich'), ' tail'],
    default: () => h('input'),
  };
  expectTypeOf(provider.classNames).toExtend<DescriptionsProps['classNames']>();
  expectTypeOf(item).toEqualTypeOf<DescriptionsItemType>();
  expectTypeOf(itemProps).toEqualTypeOf<DescriptionsItemProps>();
  expectTypeOf(slots).toEqualTypeOf<DescriptionsSlots>();
  expectTypeOf(itemSlots).toEqualTypeOf<DescriptionsItemSlots>();
  expectTypeOf<DescriptionsSemanticInfo['props']>().toEqualTypeOf<DescriptionsProps>();
});

it('rejects removed content props and incorrect semantic scopes', () => {
  const invalidExtra: DescriptionsProps = {
    // @ts-expect-error extra is a named slot, not a content prop.
    extra: 'Action',
  };
  const invalidChildren: DescriptionsProps = {
    // @ts-expect-error template children are the default slot, not a root prop.
    children: 'Value',
  };
  const invalidLabel: DescriptionsItemProps = {
    // @ts-expect-error rich template labels use #label rather than a function prop.
    label: () => h('b'),
  };
  const invalidSemantic: DescriptionsProps['styles'] = (info) => {
    // @ts-expect-error semantic callbacks receive the named { props } scope.
    const column = info.column;
    return { root: { width: column } };
  };
  expectTypeOf(invalidExtra).toEqualTypeOf<DescriptionsProps>();
  expectTypeOf(invalidChildren).toEqualTypeOf<DescriptionsProps>();
  expectTypeOf(invalidLabel).toEqualTypeOf<DescriptionsItemProps>();
  expectTypeOf(invalidSemantic).toExtend<DescriptionsProps['styles']>();
});
