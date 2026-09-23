/**
 * L3 · 类型测试（Switch）
 *
 * 正例钉 API 形状，负例钉「哪些写法必须被类型系统拒绝」。
 * ⚠️ 负例一律写在**未被调用的闭包**里：只在类型层面存在，不产生运行时行为
 *    （`*.test-d.ts` 会被 vitest 真执行）。
 */

import { expectTypeOf, it } from 'vitest';
import { h } from 'vue';
import { Switch } from '../index';
import type {
  SwitchChangeEventHandler,
  SwitchClickEventHandler,
  SwitchEvent,
  SwitchProps,
  SwitchRef,
  SwitchSize,
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

it('onChange / onClick 是 `(checked, event)` 两个参数', () => {
  const onChange: SwitchChangeEventHandler = (checked, event) => {
    expectTypeOf(checked).toBeBoolean();
    expectTypeOf(event).toEqualTypeOf<SwitchEvent>();
  };
  // antd：`SwitchClickEventHandler = SwitchChangeEventHandler`
  const onClick: SwitchClickEventHandler = onChange;
  expectTypeOf(onChange).toEqualTypeOf<SwitchClickEventHandler>();
  void onClick;
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
