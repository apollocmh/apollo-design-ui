/**
 * L3 类型测试（含负例；负例包在**永不调用的闭包**里 —— *.test-d.ts 会被
 * vitest 真执行，CHECKLIST 三）。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { VNodeChild } from 'vue';
import type { Variant } from '../../config-provider/context';
import type { ConfigProviderProps } from '../../config-provider/interface';
import type { InputNumber } from '../index';
import type {
  InputNumberConfig,
  InputNumberControls,
  InputNumberProps,
  InputNumberRef,
  InputNumberSemanticClassNames,
  InputNumberSemanticStyles,
  InputNumberStepInfo,
  ValueType,
} from '../interface';

// ===========================================================================
// Issue #7.4 / #7.5 · 载荷与 `parser` 的真实形态
// ===========================================================================

describe('InputNumber · onStep / parser 的类型（Issue #7.4 / #7.5）', () => {
  it('★ `onStep` 的载荷是 `ValueType`（不是 `number`）', () => {
    // 上游 `onStep?: (value: T, info) => void`，`T extends ValueType`；
    // `stringMode: true` 时运行时给的确实是**字符串**（L1 有 typeof 断言）。
    expectTypeOf<InputNumberProps['onStep']>().toEqualTypeOf<
      ((value: ValueType, info: InputNumberStepInfo) => void) | undefined
    >();
  });

  it('★ `parser` 形参允许 `undefined`、返回值允许 `number`', () => {
    // 上游 `parser?: (displayValue: string | undefined) => T`
    expectTypeOf<InputNumberProps['parser']>().toEqualTypeOf<
      ((displayValue: string | undefined) => ValueType) | undefined
    >();
  });

  it('正例：返回 `number` 的 parser 与收 `ValueType` 的 onStep 都通过', () => {
    const ok: InputNumberProps = {
      parser: (displayValue) => Number((displayValue ?? '').replace(/,/g, '')),
      onStep: (value) => {
        // 既可能是 string 也可能是 number —— 联合类型上不能直接 `.toFixed()`
        expectTypeOf(value).toEqualTypeOf<ValueType>();
      },
    };
    expectTypeOf(ok).toEqualTypeOf<InputNumberProps>();
  });
});

describe('InputNumber · L3 类型', () => {
  it('accepts the precise InputNumberConfig in the public Provider component map', () => {
    const config: InputNumberConfig = {
      className: 'number-config',
      style: { width: '120px' },
      variant: 'filled',
      classNames: ({ props }) => ({ input: props.disabled ? 'disabled-input' : 'enabled-input' }),
    };
    const provider: ConfigProviderProps = { components: { inputNumber: config } };
    expectTypeOf(provider).toEqualTypeOf<ConfigProviderProps>();
  });

  it('Props 面关键字段', () => {
    expectTypeOf<InputNumberProps['value']>().toEqualTypeOf<ValueType | null | undefined>();
    expectTypeOf<InputNumberProps['step']>().toEqualTypeOf<ValueType | undefined>();
    expectTypeOf<InputNumberProps['precision']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<InputNumberProps['mode']>().toEqualTypeOf<'input' | 'spinner' | undefined>();
    expectTypeOf<InputNumberProps['variant']>().toEqualTypeOf<Variant | undefined>();
    expectTypeOf<InputNumberProps['stringMode']>().toEqualTypeOf<boolean | undefined>();
  });

  it('controls 双形态', () => {
    expectTypeOf<InputNumberProps['controls']>().toEqualTypeOf<
      boolean | InputNumberControls | undefined
    >();
    expectTypeOf<InputNumberControls['upIcon']>().toEqualTypeOf<VNodeChild | undefined>();
  });

  it('语义槽五键（root/prefix/suffix/input/actions）', () => {
    expectTypeOf<keyof InputNumberSemanticClassNames>().toEqualTypeOf<
      'root' | 'prefix' | 'suffix' | 'input' | 'actions'
    >();
    expectTypeOf<keyof InputNumberSemanticStyles>().toEqualTypeOf<
      'root' | 'prefix' | 'suffix' | 'input' | 'actions'
    >();
  });

  it('Ref 面（focus/blur/nativeElement）', () => {
    expectTypeOf<InputNumberRef['focus']>().toEqualTypeOf<
      (option?: { preventScroll?: boolean; cursor?: 'start' | 'end' | 'all' }) => void
    >();
    expectTypeOf<InputNumberRef['blur']>().toEqualTypeOf<() => void>();
    expectTypeOf<InputNumberRef['nativeElement']>().toEqualTypeOf<HTMLDivElement | null>();
  });

  it('onStep 的 info 形状（offset/type/emitter）', () => {
    expectTypeOf<Parameters<NonNullable<InputNumberProps['onStep']>>[1]>().toEqualTypeOf<{
      offset: number | string;
      type: 'up' | 'down';
      emitter: 'handler' | 'keyboard' | 'wheel';
    }>();
  });

  it('负例（永不调用的闭包）', () => {
    const _negatives = () => {
      // mode 只接受 input | spinner
      // @ts-expect-error mode 不接受 'wheel'
      const badMode: InputNumberProps['mode'] = 'wheel';
      void badMode;
      // variant 只接受四形态
      // @ts-expect-error variant 不接受 'dashed'
      const badVariant: InputNumberProps['variant'] = 'dashed';
      void badVariant;
      // status 只接受 error | warning
      // @ts-expect-error status 不接受 'info'
      const badStatus: InputNumberProps['status'] = 'info';
      void badStatus;
      // precision 是 number
      // @ts-expect-error precision 不接受字符串
      const badPrecision: InputNumberProps['precision'] = '2';
      void badPrecision;
      // controls 不接受字符串
      // @ts-expect-error controls 不接受 'yes'
      const badControls: InputNumberProps['controls'] = 'yes';
      void badControls;
    };
    void _negatives;
    expectTypeOf(_negatives).toBeFunction();
  });
});

// F04: named prefix/suffix slots are exposed on the public component.
expectTypeOf<InstanceType<typeof InputNumber>['$slots']['prefix']>().toBeCallableWith();
expectTypeOf<InstanceType<typeof InputNumber>['$slots']['suffix']>().toBeCallableWith();

// F09: exported props and component emits agree on number/string/null changes.
expectTypeOf<InputNumberProps['onChange']>().toEqualTypeOf<
  ((value: ValueType | null) => void) | undefined
>();
const checkSemanticNumberEmit = (vm: InstanceType<typeof InputNumber>) => {
  vm.$emit('change', 1);
  vm.$emit('change', '1');
  vm.$emit('change', null);
  // @ts-expect-error F09: semantic change carries a value, not a DOM event.
  vm.$emit('change', new Event('change'));
  vm.$emit('step', '1', { offset: 1, type: 'up', emitter: 'keyboard' });
  vm.$emit('pressEnter', new KeyboardEvent('keydown', { key: 'Enter' }));
  // @ts-expect-error step carries a numeric value, not a DOM event.
  vm.$emit('step', new Event('step'), { offset: 1, type: 'up', emitter: 'keyboard' });
  // @ts-expect-error pressEnter carries a keyboard event.
  vm.$emit('pressEnter', 1);
  expectTypeOf(vm.nativeElement).toEqualTypeOf<HTMLDivElement | null>();
  expectTypeOf(vm.focus).toEqualTypeOf<InputNumberRef['focus']>();
  expectTypeOf(vm.blur).toEqualTypeOf<InputNumberRef['blur']>();
};
void checkSemanticNumberEmit;
