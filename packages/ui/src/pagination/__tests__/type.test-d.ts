/**
 * L3 类型测试（含负例；负例包在**永不调用的闭包**里 —— `*.test-d.ts` 会被 vitest 真执行）。
 *
 * 判据来源：`packages/ui/src/pagination/interface.ts`（G2 定稿的类型面）。
 * 这里钉的是**对外契约的形状**：
 *   - 值域（total / current / pageSize / pageSizeOptions）；
 *   - `simple` / `showQuickJumper` / `showSizeChanger` 的三个「布尔 | 对象」联合；
 *   - 语义槽 **2 个**（root + item）；
 *   - emits 的载荷（`change` 是双参 `[page, pageSize]`，`showSizeChange` 是 `[current, size]`）；
 *   - 尺寸切换注入点的**两个上游字段名**（`onSizeChange` / `onChange`）；
 *   - `PaginationConfig.position`（只导出类型、不实现布局）。
 */

import type { PaginationLocale } from '@apollo-design/locale';
import { describe, expectTypeOf, it } from 'vitest';
import type { CSSProperties, VNodeChild } from 'vue';
import type { ListSlots } from '../../list';
import type { SelectProps } from '../../select';
import type { TableSlots } from '../../table';
import type {
  PaginationAlign,
  PaginationConfig,
  PaginationEmits,
  PaginationItemSlotProps,
  PaginationItemType,
  PaginationPosition,
  PaginationProps,
  PaginationRange,
  PaginationSemanticAllType,
  PaginationSemanticClassNames,
  PaginationSemanticStyles,
  PaginationSemanticValue,
  PaginationSimple,
  PaginationSizeChangerInfo,
  PaginationSlots,
  PaginationTotalSlotProps,
} from '../interface';

describe('Pagination · L3 类型', () => {
  it('container slots preserve the native pagination payloads', () => {
    expectTypeOf<ListSlots['paginationTotal']>().toEqualTypeOf<PaginationSlots['total']>();
    expectTypeOf<ListSlots['paginationItemRender']>().toEqualTypeOf<
      PaginationSlots['itemRender']
    >();
    expectTypeOf<ListSlots['paginationSizeChanger']>().toEqualTypeOf<
      PaginationSlots['sizeChanger']
    >();
    expectTypeOf<TableSlots['paginationTotal']>().toEqualTypeOf<PaginationSlots['total']>();
    expectTypeOf<TableSlots['paginationItemRender']>().toEqualTypeOf<
      PaginationSlots['itemRender']
    >();
    expectTypeOf<TableSlots['paginationSizeChanger']>().toEqualTypeOf<
      PaginationSlots['sizeChanger']
    >();
  });

  it('值域：这些都是 number', () => {
    expectTypeOf<PaginationProps['total']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<PaginationProps['current']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<PaginationProps['pageSize']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<PaginationProps['defaultPageSize']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<PaginationProps['pageSizeOptions']>().toEqualTypeOf<number[] | undefined>();
  });

  it('三个「布尔 | 对象」联合', () => {
    expectTypeOf<PaginationSimple>().toEqualTypeOf<boolean | { readOnly?: boolean }>();
    expectTypeOf<PaginationProps['simple']>().toEqualTypeOf<PaginationSimple | undefined>();
    expectTypeOf<PaginationProps['showQuickJumper']>().toEqualTypeOf<
      boolean | { goButton?: VNodeChild } | undefined
    >();
    // ⚠️ `showSizeChanger` 的对象形态是 **Select 的 props**（对象 ⇒ 视为启用 + 透传）
    expectTypeOf<PaginationProps['showSizeChanger']>().toEqualTypeOf<
      boolean | SelectProps | undefined
    >();
  });

  it('align / position / size 是字面量联合', () => {
    expectTypeOf<PaginationAlign>().toEqualTypeOf<'start' | 'center' | 'end'>();
    expectTypeOf<PaginationPosition>().toEqualTypeOf<'top' | 'bottom' | 'both'>();
    expectTypeOf<PaginationProps['size']>().toEqualTypeOf<
      'small' | 'default' | 'large' | undefined
    >();
  });

  it('语义槽只有 2 个（root + item）', () => {
    expectTypeOf<keyof PaginationSemanticClassNames>().toEqualTypeOf<'root' | 'item'>();
    expectTypeOf<keyof PaginationSemanticStyles>().toEqualTypeOf<'root' | 'item'>();
    expectTypeOf<PaginationSemanticStyles['item']>().toEqualTypeOf<CSSProperties | undefined>();
    expectTypeOf<PaginationSemanticValue<PaginationSemanticClassNames>>().toEqualTypeOf<
      | PaginationSemanticClassNames
      | ((info: { props: PaginationProps }) => PaginationSemanticClassNames)
    >();
    expectTypeOf<PaginationSemanticAllType['classNamesAndFn']>().toEqualTypeOf<
      PaginationSemanticValue<PaginationSemanticClassNames>
    >();
  });

  it('native item/total slots use one named object', () => {
    expectTypeOf<PaginationItemType>().toEqualTypeOf<
      'page' | 'prev' | 'next' | 'jump-prev' | 'jump-next'
    >();
    expectTypeOf<PaginationRange>().toEqualTypeOf<[number, number]>();
    expectTypeOf<PaginationSlots['itemRender']>().toEqualTypeOf<
      ((props: PaginationItemSlotProps) => VNodeChild) | undefined
    >();
    expectTypeOf<PaginationSlots['total']>().toEqualTypeOf<
      ((props: PaginationTotalSlotProps) => VNodeChild) | undefined
    >();
  });

  it('尺寸切换注入点：两个上游口径的字段名都在', () => {
    expectTypeOf<PaginationSizeChangerInfo['onSizeChange']>().toEqualTypeOf<
      (value: number) => void
    >();
    expectTypeOf<PaginationSizeChangerInfo['onChange']>().toEqualTypeOf<(value: number) => void>();
    expectTypeOf<PaginationSizeChangerInfo['options']>().toEqualTypeOf<
      { label: VNodeChild; value: number }[]
    >();
    expectTypeOf<PaginationSizeChangerInfo['disabled']>().toEqualTypeOf<boolean>();
  });

  it('emits：载荷形状（change 是双参）', () => {
    expectTypeOf<PaginationEmits['update:current']>().toEqualTypeOf<[current: number]>();
    expectTypeOf<PaginationEmits['update:pageSize']>().toEqualTypeOf<[pageSize: number]>();
    expectTypeOf<PaginationEmits['change']>().toEqualTypeOf<[current: number, pageSize: number]>();
    expectTypeOf<PaginationEmits['showSizeChange']>().toEqualTypeOf<
      [current: number, size: number]
    >();
  });

  it('slots：三个通道的槽参数', () => {
    expectTypeOf<PaginationSlots['total']>().toEqualTypeOf<
      ((props: PaginationTotalSlotProps) => VNodeChild) | undefined
    >();
    expectTypeOf<PaginationSlots['sizeChanger']>().toEqualTypeOf<
      ((info: PaginationSizeChangerInfo) => VNodeChild) | undefined
    >();
    expectTypeOf<PaginationSlots['itemRender']>().toEqualTypeOf<
      ((props: PaginationItemSlotProps) => VNodeChild) | undefined
    >();
  });

  it('PaginationConfig adds placement and typed business callbacks for containers', () => {
    expectTypeOf<PaginationConfig['position']>().toEqualTypeOf<PaginationPosition | undefined>();
    expectTypeOf<PaginationConfig['onChange']>().toEqualTypeOf<
      ((current: number, pageSize: number) => void) | undefined
    >();
    expectTypeOf<PaginationConfig['onShowSizeChange']>().toEqualTypeOf<
      ((current: number, pageSize: number) => void) | undefined
    >();
    // ⚠️ `rootClassName` 被 Omit 掉
    expectTypeOf<PaginationConfig>().not.toHaveProperty('rootClassName');
  });

  it('locale 复用 locale 包的 PaginationLocale（snake_case 的 11 个键）', () => {
    expectTypeOf<PaginationProps['locale']>().toEqualTypeOf<PaginationLocale | undefined>();
    expectTypeOf<PaginationLocale['items_per_page']>().toEqualTypeOf<string>();
  });
});

describe('Pagination · L3 负例', () => {
  it('total 不接受字符串', () => {
    type Acceptable = PaginationProps['total'];
    // @ts-expect-error total 是数字
    const bad: Acceptable = '500';
    expectTypeOf(bad).not.toBeNever();
  });

  it('align 不接受任意字符串', () => {
    type Acceptable = PaginationAlign | undefined;
    // @ts-expect-error 'middle' 不是对齐值
    const bad: Acceptable = 'middle';
    expectTypeOf(bad).not.toBeNever();
  });

  it('pageSizeOptions 不接受字符串数组', () => {
    type Acceptable = PaginationProps['pageSizeOptions'];
    // @ts-expect-error 字符串形态已废弃（antd 标注下个大版本移除），本仓只收数字
    const bad: Acceptable = ['10', '20'];
    expectTypeOf(bad).not.toBeNever();
  });

  it('语义槽不接受未知键', () => {
    type Acceptable = PaginationSemanticClassNames;
    // @ts-expect-error 'prev' 不是语义槽（只有 root 与 item）
    const bad: Acceptable = { prev: 'x' };
    expectTypeOf(bad).not.toBeNever();
  });
});

const checkRemovedRendererProps = () => {
  // @ts-expect-error ADR0006/0007: item rendering uses the native scoped slot.
  const item: PaginationProps = { itemRender: () => null };
  // @ts-expect-error ADR0006/0007: total content uses #total.
  const total: PaginationProps = { showTotal: () => null };
  // @ts-expect-error ADR0006/0007: size selection content uses #sizeChanger.
  const size: PaginationProps = { sizeChangerRender: () => null };
  // @ts-expect-error Vue slots accept one object rather than positional arguments.
  const slot: PaginationSlots['itemRender'] = (_page: number, _type: PaginationItemType) => null;
  void item;
  void total;
  void size;
  void slot;
};
void checkRemovedRendererProps;
