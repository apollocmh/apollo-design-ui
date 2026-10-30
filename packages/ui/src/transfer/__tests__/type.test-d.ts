/**
 * L3 · 类型测试（含**负例**）
 *
 * 规则 T7：只有正例的类型测试没有价值。每个 `describe` 都同时给出
 * 「应当通过」与「应当报错」两侧。
 *
 * ⚠️ 负例必须包在**永不调用**的闭包里 —— 本文件会被 vitest 真的执行。
 *
 * Public props, Vue models/notifications, scoped slots and actual template refs.
 * Historical React render props were removed by ADR 0006; styles use CSSProperties.
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { CSSProperties, VNodeChild } from 'vue';
import { h } from 'vue';
import type {
  PaginationType,
  TransferDirection,
  TransferEmits,
  TransferItem,
  TransferItemSlotProps,
  TransferKey,
  TransferListSlotProps,
  TransferLocale,
  TransferProps,
  TransferRef,
  TransferSemanticClassNames,
  TransferSemanticStyles,
  TransferSlots,
} from '../index';
import { Transfer, TransferList } from '../index';

const neverFn = (..._args: unknown[]) => {
  throw new Error('never called');
};
void neverFn;

describe('Transfer · 基础枚举', () => {
  it('TransferDirection 是 left | right', () => {
    expectTypeOf<TransferDirection>().toEqualTypeOf<'left' | 'right'>();
  });

  it('TransferKey 是 string | number', () => {
    expectTypeOf<TransferKey>().toEqualTypeOf<string | number>();
  });

  it('PaginationType 是 boolean 或对象（四字段全可选）', () => {
    expectTypeOf<PaginationType>().toEqualTypeOf<
      | boolean
      | {
          pageSize?: number;
          simple?: boolean;
          showSizeChanger?: boolean;
          showLessItems?: boolean;
        }
    >();
  });

  it('TransferItem 必须带 key', () => {
    expectTypeOf<TransferItem>().toExtend<{ key: TransferKey }>();
  });
});

describe('Transfer · Props 正例', () => {
  it('受控 targetKeys / selectedKeys', () => {
    expectTypeOf<TransferProps>().toExtend<{
      targetKeys?: TransferKey[];
      selectedKeys?: TransferKey[];
      disabled?: boolean;
      oneWay?: boolean;
      showSearch?: boolean | { defaultValue?: string; placeholder?: string };
      pagination?: PaginationType;
      status?: 'error' | 'warning';
    }>();
  });

  it('回调签名与 antd 一致', () => {
    expectTypeOf<TransferProps>().toExtend<{
      onChange?: (
        targetKeys: TransferKey[],
        direction: TransferDirection,
        moveKeys: TransferKey[],
      ) => void;
      onSelectChange?: (
        sourceSelectedKeys: TransferKey[],
        targetSelectedKeys: TransferKey[],
      ) => void;
      onSearch?: (direction: TransferDirection, value: string) => void;
      onScroll?: (direction: TransferDirection, e: Event) => void;
    }>();
  });

  it('F06: slots expose typed item and list context', () => {
    expectTypeOf<TransferSlots['item']>().toEqualTypeOf<
      ((props: TransferItemSlotProps) => VNodeChild) | undefined
    >();
    expectTypeOf<TransferSlots['list']>().toEqualTypeOf<
      ((props: TransferListSlotProps) => VNodeChild) | undefined
    >();
    expectTypeOf<InstanceType<typeof Transfer>['$slots']['item']>().toBeCallableWith({
      item: { key: 'a' },
      direction: 'left',
      selected: false,
      disabled: false,
    });
  });

  it('selectAllLabels 是二元组', () => {
    expectTypeOf<TransferProps['selectAllLabels']>().toExtend<
      [VNodeChild?, VNodeChild?] | undefined
    >();
  });
});

describe('Transfer · Props 负例（应当报错）', () => {
  it('status 只收 error | warning', () => {
    // @ts-expect-error 非法状态
    const bad: TransferProps['status'] = 'success';
    void bad;
  });

  it('onChange 的 targetKeys 参数不能收窄类型（参数逆变）', () => {
    // @ts-expect-error 非法参数类型（'left' 不接收 TransferKey[]）
    const bad: TransferProps['onChange'] = (targetKeys: 'left') => neverFn(targetKeys);
    void bad;
  });

  it('filterOption 第三个参数必须是方向', () => {
    // @ts-expect-error 非法过滤签名（d: boolean 不收窄为 TransferDirection）
    const bad: TransferProps['filterOption'] = (v: string, item: TransferItem, d: boolean) =>
      neverFn(v, item, d);
    void bad;
  });
});

describe('Transfer · 语义结构', () => {
  it('classNames 含 source / target 方向子结构', () => {
    expectTypeOf<TransferSemanticClassNames>().toExtend<{
      root?: string;
      section?: string;
      header?: string;
      title?: string;
      body?: string;
      list?: string;
      item?: string;
      itemIcon?: string;
      itemContent?: string;
      footer?: string;
      actions?: string;
      source?: Record<string, unknown>;
      target?: Record<string, unknown>;
    }>();
  });

  it('styles 的值是声明对象', () => {
    expectTypeOf<TransferSemanticStyles['root']>().toEqualTypeOf<CSSProperties | undefined>();
    const styles: TransferSemanticStyles = {
      root: { opacity: 0.8 },
      source: { item: { fontWeight: 600 } },
    };
    void styles;
  });

  it('locale 覆盖 unit 文案', () => {
    expectTypeOf<TransferLocale>().toExtend<{
      itemUnit?: string;
      itemsUnit?: string;
      searchPlaceholder?: string;
    }>();
  });
});

describe('Transfer · 运行时形态', () => {
  it('Transfer 是可渲染组件（h 直接包）', () => {
    const node = h(Transfer, { dataSource: [] });
    expectTypeOf(node).toExtend<VNodeChild>();
  });

  it('TransferList（Transfer.List）可独立渲染', () => {
    expectTypeOf(Transfer.List).toEqualTypeOf(TransferList);
    const node = h(TransferList, {
      prefixCls: 'apollo-transfer',
      checkedKeys: [],
      direction: 'left',
    });
    expectTypeOf(node).toExtend<VNodeChild>();
  });
});

describe('Transfer · native models, events and template refs', () => {
  it('declares actual constructor model listeners with the public key type', () => {
    type Props = InstanceType<typeof Transfer>['$props'];
    expectTypeOf<Parameters<NonNullable<Props['onUpdate:targetKeys']>>>().toEqualTypeOf<
      [TransferKey[]]
    >();
    expectTypeOf<Parameters<NonNullable<Props['onUpdate:selectedKeys']>>>().toEqualTypeOf<
      [TransferKey[]]
    >();
    expectTypeOf<Parameters<NonNullable<Props['onChange']>>>().toEqualTypeOf<
      [TransferKey[], TransferDirection, TransferKey[]]
    >();
    expectTypeOf<TransferEmits['scroll']>().parameters.toEqualTypeOf<[TransferDirection, Event]>();
  });

  it('exposes the actual stable public root and focus methods', () => {
    expectTypeOf<
      Pick<InstanceType<typeof Transfer>, 'nativeElement' | 'focus' | 'blur'>
    >().toEqualTypeOf<TransferRef>();
  });

  it('rejects incorrect model payloads and CSS declarations', () => {
    // @ts-expect-error Model updates carry key arrays, not a data direction.
    const update: TransferProps['onUpdate:targetKeys'] = (_value: TransferDirection) => {};
    // @ts-expect-error A CSS declaration cannot be a rendering function.
    const styles: TransferSemanticStyles = { root: { padding: () => '8px' } };
    const labels: InstanceType<typeof Transfer>['$props'] = {
      // @ts-expect-error The actual constructor rejects the third label beyond its two-label bound.
      selectAllLabels: ['one', 'two', 'three'],
    };
    void [update, styles, labels];
  });
});

// D03: removed renderer props have no compatibility path.
// @ts-expect-error F06: render was replaced by #item.
const removedRender: TransferProps = { render: () => 'old' };
// @ts-expect-error F06: footer is now a scoped slot.
const removedFooter: TransferProps = { footer: () => 'old' };
// @ts-expect-error F06: custom lists use #list.
const removedList: TransferProps = { renderList: () => 'old' };
// @ts-expect-error F06: selection count rendering uses #selectAllLabel.
const removedCount: TransferProps = { selectAllLabels: [() => 'old'] };
void [removedRender, removedFooter, removedList, removedCount];
