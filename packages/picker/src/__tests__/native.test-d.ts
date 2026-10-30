import type { Dayjs } from 'dayjs';
import { describe, expectTypeOf, it } from 'vitest';
import type { PanelCellRenderScope, PickerPanel, PickerPanelRef, TimeColumn } from '../index';

type Props = InstanceType<typeof PickerPanel>['$props'];
type Slots = InstanceType<typeof PickerPanel>['$slots'];
type ColumnProps = InstanceType<typeof TimeColumn>['$props'];

describe('Picker native public types', () => {
  it('owns typed events, models, scoped slots and the actual element reference', () => {
    expectTypeOf<Parameters<NonNullable<Props['onSelect']>>>().toEqualTypeOf<[Dayjs]>();
    expectTypeOf<Parameters<NonNullable<Props['onUpdate:value']>>>().toEqualTypeOf<[Dayjs[]]>();
    expectTypeOf<Parameters<NonNullable<Props['onUpdate:pickerValue']>>>().toEqualTypeOf<[Dayjs]>();
    expectTypeOf<Parameters<NonNullable<Props['onUpdate:mode']>>>().toEqualTypeOf<
      ['time' | 'date' | 'week' | 'month' | 'quarter' | 'year' | 'decade']
    >();
    expectTypeOf<
      Parameters<NonNullable<Slots['cellRender']>>[0]
    >().toEqualTypeOf<PanelCellRenderScope>();
    expectTypeOf<PickerPanelRef['nativeElement']>().toEqualTypeOf<HTMLElement | null>();
    expectTypeOf<Parameters<NonNullable<ColumnProps['onChange']>>>().toEqualTypeOf<
      [number | 'am' | 'pm']
    >();
  });
});

function nativeTypeBoundaries(props: Props): void {
  // @ts-expect-error 单元格模板扩展只能使用 #cellRender，不保留旧函数 prop。
  const oldRenderer: Props = { ...props, cellRender: () => 'old' };
  // @ts-expect-error select 是日期业务事件，不能伪装成原生 MouseEvent。
  const wrongEvent: Props = { ...props, onSelect: (_event: MouseEvent) => {} };
  // @ts-expect-error 面板 value 模型始终使用日期数组。
  const wrongModel: Props = { ...props, 'onUpdate:value': (_value: string) => {} };
  void oldRenderer;
  void wrongEvent;
  void wrongModel;
}
void nativeTypeBoundaries;
