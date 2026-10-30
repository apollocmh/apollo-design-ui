/**
 * L3 · 类型测试（Switch）
 *
 * 正例钉 API 形状，负例钉「哪些写法必须被类型系统拒绝」。
 * ⚠️ 负例一律写在**未被调用的闭包**里：只在类型层面存在，不产生运行时行为
 *    （`*.test-d.ts` 会被 vitest 真执行）。
 */

import { expectTypeOf, it } from 'vitest';
import { h, type VNodeChild } from 'vue';
import { Switch } from '../index';
import type {
  SwitchChangeEventHandler,
  SwitchClickEventHandler,
  SwitchConfig,
  SwitchEvent,
  SwitchProps,
  SwitchRef,
  SwitchSize,
  SwitchSlots,
} from '../interface';

it('SwitchProps 的关键字段类型', () => {
  expectTypeOf<SwitchProps['checked']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<SwitchProps['defaultChecked']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<SwitchProps['value']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<SwitchProps['defaultValue']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<SwitchProps['disabled']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<SwitchProps['loading']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<SwitchProps['autoFocus']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<SwitchProps['tabIndex']>().toEqualTypeOf<number | undefined>();
  expectTypeOf<SwitchProps['size']>().toEqualTypeOf<SwitchSize | undefined>();
});

it('SwitchSize 保留废弃的 default（与 antd 的枚举一致）', () => {
  expectTypeOf<SwitchSize>().toEqualTypeOf<'small' | 'medium' | 'middle' | 'default'>();
});

it('change carries state and click carries one native MouseEvent', () => {
  expectTypeOf<SwitchChangeEventHandler>().toEqualTypeOf<
    (checked: boolean, event: SwitchEvent) => void
  >();
  expectTypeOf<SwitchClickEventHandler>().toEqualTypeOf<(event: MouseEvent) => void>();
  expectTypeOf<SwitchProps['onClick']>().toEqualTypeOf<SwitchClickEventHandler | undefined>();
});

it('语义化支持对象与函数两态', () => {
  const obj: SwitchProps = { classNames: { root: 'r', content: 'c', indicator: 'i' } };
  const fn: SwitchProps = {
    styles: ({ props }) => ({ root: { opacity: props.loading ? 0.5 : 1 } }),
  };
  expectTypeOf(obj).toEqualTypeOf<SwitchProps>();
  expectTypeOf(fn).toEqualTypeOf<SwitchProps>();
});

it('SwitchRef 的形状', () => {
  expectTypeOf<SwitchRef['nativeElement']>().toEqualTypeOf<HTMLButtonElement | null>();
  expectTypeOf<SwitchRef['focus']>().toBeFunction();
  expectTypeOf<SwitchRef['blur']>().toBeFunction();
  expectTypeOf<
    InstanceType<typeof Switch>['nativeElement']
  >().toEqualTypeOf<HTMLButtonElement | null>();
  expectTypeOf<InstanceType<typeof Switch>['focus']>().toEqualTypeOf<SwitchRef['focus']>();
  expectTypeOf<InstanceType<typeof Switch>['blur']>().toEqualTypeOf<SwitchRef['blur']>();
});

it('public named slots and Provider defaults retain their Vue contracts', () => {
  expectTypeOf<SwitchSlots>().toEqualTypeOf<import('../../index').SwitchSlots>();
  expectTypeOf<SwitchConfig>().toEqualTypeOf<import('../../index').SwitchConfig>();
  const slots: SwitchSlots = {
    checkedChildren: () => [h('strong', 'On'), 0],
    unCheckedChildren: () => false,
  };
  expectTypeOf(slots.checkedChildren).toEqualTypeOf<(() => VNodeChild) | undefined>();
  expectTypeOf<InstanceType<typeof Switch>['$slots']['checkedChildren']>().toMatchTypeOf<
    (() => VNodeChild) | undefined
  >();
  expectTypeOf<SwitchConfig>().toMatchTypeOf<
    NonNullable<import('../../config-provider/interface').ConfigProviderProps['components']>[string]
  >();
  const negatives = () => {
    // @ts-expect-error Switch only accepts checkedChildren and unCheckedChildren slots.
    const unknownSlot: SwitchSlots = { default: () => 'Off' };
    // @ts-expect-error Provider defaults do not control an individual Switch value.
    const controlledConfig: SwitchConfig = { checked: true };
    // @ts-expect-error Provider style retains its existing CSSProperties contract.
    const invalidStyle: SwitchConfig = { style: 'color: red' };
    return [unknownSlot, controlledConfig, invalidStyle];
  };
  expectTypeOf(negatives).toBeFunction();
});

it('能 h() 且静态标记存在', () => {
  expectTypeOf(h(Switch, { checked: true })).toBeObject();
  expectTypeOf(Switch.__ANT_SWITCH).toBeBoolean();
});

// ─────────────────────────────────────────────────────────────────────────────
// 负例（全部包在永不调用的闭包里）
// ─────────────────────────────────────────────────────────────────────────────

it('负例：语义槽只有 root / content / indicator 三键', () => {
  // @ts-expect-error 没有 body 槽
  const badSlot: SwitchProps = { classNames: { body: 'b' } };
  void badSlot;
});

it('负例：size 不含 large', () => {
  // @ts-expect-error SwitchSize 排除了 'large'
  const badSize: SwitchProps = { size: 'large' };
  void badSize;
});

it('负例：checked 不能是字符串', () => {
  // @ts-expect-error checked 是 boolean
  const badChecked: SwitchProps = { checked: 'yes' };
  void badChecked;
});

// F09 / D02: native click and semantic state change have independent typed emits.
const checkSemanticSwitchEmit = (vm: InstanceType<typeof Switch>, event: SwitchEvent) => {
  vm.$emit('change', true, event);
  vm.$emit('click', new MouseEvent('click'));
  // @ts-expect-error D02: native click no longer carries a checked result.
  vm.$emit('click', true, event);
  vm.$emit('update:checked', false);
  // @ts-expect-error F09: checked is boolean.
  vm.$emit('change', 'true', event);
  // @ts-expect-error F09: the triggering event is part of the change payload.
  vm.$emit('change', true);
};
void checkSemanticSwitchEmit;

const checkNativeClickProps = () => {
  // @ts-expect-error D02: legacy two-argument click callback is not accepted.
  const props: SwitchProps = { onClick: (_checked: boolean, _event: MouseEvent) => {} };
  // @ts-expect-error D02: the component's inferred onClick also requires a native event.
  h(Switch, { onClick: (_checked: boolean, _event: MouseEvent) => {} });
  void props;
};
void checkNativeClickProps;
