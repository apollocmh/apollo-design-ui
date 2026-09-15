import { describe, expectTypeOf, it } from 'vitest';
import { type ComputedRef, computed, effectScope, type Ref, ref, type VNode } from 'vue';
import {
  type ControlledUpdater,
  capitalize,
  composeRef,
  fillRef,
  get,
  getNodeRef,
  isNonNullable,
  isReactEventName,
  isRenderable,
  KeyCode,
  merge,
  mergeProps,
  omit,
  pickAttrs,
  type RefLike,
  type SetDelayState,
  type SetState,
  toArray,
  toList,
  toNativeEventName,
  toVueEventName,
  useComposeRef,
  useControlledValue,
  useDelayState,
  useId,
  useLockFocus,
  useSafeState,
  useUpdateEffect,
} from '../index';

/**
 * L3 类型测试（`types` project，由 vue-tsc 驱动）。
 *
 * TESTING.md T7 要求：**必须包含负例**。负例用 `@ts-expect-error` 表达 ——
 * 它的语义是「此处**应当**报错」。如果哪天类型放宽了导致这里不再报错，
 * `@ts-expect-error` 本身会变成错误，测试就会失败。这是它唯一被允许的使用场景。
 *
 * 这一层测的不是"类型写得漂亮"，而是**契约**：
 *   - 泛型推断结果是否与契约文档一致（`omit` 的 `Omit<T, K>`、`mergeProps` 的 `B & A`）
 *   - 是否比上游**更严**（`merge` 的同一个 `T`、`mergeProps` 无 1 参重载）
 *   - 负例是否真的被拒绝（传错类型必须报错，而不是被 `any` 吞掉）
 *
 * ⚠️ 这里不重复测运行期行为 —— 那是 L1/L2 的职责。本文件只做类型层断言。
 *
 * ⚠️⚠️ 另一条容易踩的坑：`*.test-d.ts` **会被 vitest 实际执行**（不是只做类型检查）。
 *      所以每个负例在运行期也必须是安全的。若某个非法调用会真的崩掉
 *      （例如把字符串当 DOM 元素传进去），就把它放进一个**永不执行**的闭包里，
 *      只留给 TS 看 —— 见本文件里 `neverCalled` 的用法。
 */

describe('类型判断的类型谓词（narrowing）', () => {
  it('isNonNullable 去掉 null | undefined', () => {
    const value = 'x' as string | null | undefined;
    if (isNonNullable(value)) {
      expectTypeOf(value).toEqualTypeOf<string>();
    }
  });

  it('isRenderable 去掉 falsy 的"空值"形态', () => {
    const value = 'x' as string | false | null | undefined;
    if (isRenderable(value)) {
      // 收窄后不应再含 null / undefined / false
      expectTypeOf(value).not.toEqualTypeOf<string | false | null | undefined>();
      expectTypeOf(value).toEqualTypeOf<string>();
    }
  });

  it('isNonNullable 是类型谓词而不是 boolean（否则 if 里拿不到收窄）', () => {
    expectTypeOf(isNonNullable<string | null>).returns.toEqualTypeOf<boolean>();
  });
});

describe('omit —— 返回 Omit<T, K>', () => {
  it('键被真正移除（不是 Partial，也不是索引签名）', () => {
    const src = { a: 1, b: 'x' };
    const out = omit(src, ['b']);
    expectTypeOf(out).toEqualTypeOf<{ a: number }>();
  });

  it('删多个键', () => {
    const src = { a: 1, b: 2, c: 3 };
    expectTypeOf(omit(src, ['a', 'c'])).toEqualTypeOf<{ b: number }>();
  });

  it('★ 负例：传入不存在的键必须报错', () => {
    const src = { a: 1 };
    // @ts-expect-error 'nope' 不是 keyof typeof src
    omit(src, ['nope']);
  });

  it('★ 负例：传入非对象必须报错', () => {
    // @ts-expect-error number 不满足 T extends object
    omit(42, []);
  });

  it('readonly 数组也被接受', () => {
    const src = { a: 1, b: 2 };
    const keys = ['b'] as const;
    expectTypeOf(omit(src, keys)).toEqualTypeOf<{ a: number }>();
  });
});

describe('mergeProps —— 返回 B & A，且没有 1 参重载', () => {
  it('两参返回 B & A', () => {
    const a = { x: 1 };
    const b = { y: 's' };
    expectTypeOf(mergeProps(a, b)).toEqualTypeOf<{ x: number } & { y: string }>();
  });

  it('三参返回 C & B & A', () => {
    expectTypeOf(mergeProps({ a: 1 }, { b: 2 }, { c: 3 })).toEqualTypeOf<
      { a: number } & { b: number } & { c: number }
    >();
  });

  it('四参返回 D & C & B & A', () => {
    expectTypeOf(mergeProps({ a: 1 }, { b: 2 }, { c: 3 }, { d: 4 })).toEqualTypeOf<
      { a: number } & { b: number } & { c: number } & { d: number }
    >();
  });

  it('★ 负例：1 个参数不被接受（与上游逐字一致，无 1 参重载）', () => {
    // @ts-expect-error 至少需要 2 个参数
    mergeProps({ a: 1 });
  });

  it('★ 负例：5 个参数不被接受', () => {
    // @ts-expect-error 最多 4 个参数
    mergeProps({ a: 1 }, { b: 2 }, { c: 3 }, { d: 4 }, { e: 5 });
  });
});

describe('merge —— 同一个 T 约束', () => {
  it('同构对象返回同一个 T', () => {
    expectTypeOf(merge({ a: 1 }, { a: 2 })).toEqualTypeOf<{ a: number }>();
  });

  it('无参返回 T = object', () => {
    expectTypeOf(merge()).toEqualTypeOf<object>();
  });

  it('★ 负例：异构源必须报错（上游同样报错，不是我们更严）', () => {
    // ⚠️ 必须用**变量**而不是内联字面量：内联对象字面量会让 TS 把 T 放宽到公共父类型
    //    （`object`），从而**不报错**。这不是我们的签名问题 —— 同样的写法在上游也这样。
    //    用变量固定住类型之后才会暴露冲突。
    const a = { nested: { x: 1 } };
    const b = { nested: { y: 2 } };
    // @ts-expect-error { nested: { y: number } } 不可赋给 { nested: { x: number } }
    merge(a, b);
  });
});

describe('pickAttrs / event-name', () => {
  it('返回 Record<string, unknown>', () => {
    expectTypeOf(pickAttrs({}, true)).toEqualTypeOf<Record<string, unknown>>();
  });

  it('配置对象接受三个开关', () => {
    pickAttrs({}, { aria: true, data: true, attr: true, rawEventNames: true });
    pickAttrs({}, false);
    pickAttrs({});
  });

  it('★ 负例：配置对象里写错键名必须报错', () => {
    // @ts-expect-error 'ariaOnly' 不是 PickConfig 的字段
    pickAttrs({}, { ariaOnly: true });
  });

  it('事件名映射返回 string | null（必须处理 null 分支）', () => {
    expectTypeOf(toNativeEventName('onClick')).toEqualTypeOf<string | null>();
    expectTypeOf(toVueEventName('onClick')).toEqualTypeOf<string | null>();
    expectTypeOf(isReactEventName('onClick')).toEqualTypeOf<boolean>();
  });
});

describe('useControlledValue', () => {
  it('返回 [ComputedRef<T>, setter]', () => {
    const [value, setValue] = useControlledValue<number>({
      defaultValue: 1,
      getValue: () => undefined,
    });
    expectTypeOf(value).toEqualTypeOf<ComputedRef<number>>();
    expectTypeOf(setValue).toEqualTypeOf<(next: ControlledUpdater<number>) => void>();
  });

  it('setter 接受直接值与函数式更新', () => {
    const [, setValue] = useControlledValue<number>({ defaultValue: 1, getValue: () => undefined });
    setValue(2);
    setValue((prev) => prev + 1);
  });

  it('★ 负例：setter 不接受错误类型', () => {
    const [, setValue] = useControlledValue<number>({ defaultValue: 1, getValue: () => undefined });
    // @ts-expect-error string 不是 number
    setValue('nope');
  });

  it('★ 负例：函数式更新的返回值类型必须匹配', () => {
    const [, setValue] = useControlledValue<number>({ defaultValue: 1, getValue: () => undefined });
    // @ts-expect-error 返回 string 不是 number
    setValue((prev) => `${prev}`);
  });

  it('defaultValue 支持惰性函数', () => {
    const [value] = useControlledValue<number>({
      defaultValue: () => 42,
      getValue: () => undefined,
    });
    expectTypeOf(value).toEqualTypeOf<ComputedRef<number>>();
  });
});

describe('useDelayState / useSafeState', () => {
  it('useDelayState 返回 [Ref<T>, SetDelayState<T>]', () => {
    const [value, setValue] = useDelayState(0);
    expectTypeOf(value).toEqualTypeOf<Ref<number>>();
    expectTypeOf(setValue).toEqualTypeOf<SetDelayState<number>>();
  });

  it('延迟配置是二选一的联合（frame 与 ms 互斥）', () => {
    const [, setValue] = useDelayState(0);
    setValue(1);
    setValue(1, true);
    setValue(1, { frame: 2 });
    setValue(1, { ms: 100 });
  });

  it('★ 负例：frame 与 ms 同时给必须报错', () => {
    const [, setValue] = useDelayState(0);
    // @ts-expect-error 两者互斥（另一侧被声明为 never）
    setValue(1, { frame: 1, ms: 100 });
  });

  it('★ 负例：空的延迟配置对象必须报错', () => {
    const [, setValue] = useDelayState(0);
    // @ts-expect-error 既不是 { frame } 也不是 { ms }
    setValue(1, {});
  });

  it('useSafeState 的值类型含 undefined（初始值可省略）', () => {
    const [value, setState] = useSafeState<number>();
    expectTypeOf(value).toEqualTypeOf<Ref<number | undefined>>();
    expectTypeOf(setState).toEqualTypeOf<SetState<number>>();
  });

  it('★ 负例：useSafeState 的 setter 同样不接受错误类型', () => {
    const [, setState] = useSafeState<number>();
    // @ts-expect-error string 不是 number
    setState('nope');
  });
});

describe('useUpdateEffect / useId / useLockFocus', () => {
  it('deps 必须是 WatchSource 数组', () => {
    const dep = ref(0);
    useUpdateEffect(() => {}, [dep]);
    useUpdateEffect(() => {}, [() => dep.value]);
    useUpdateEffect(() => {}, []);
  });

  it('★ 负例：deps 不是数组必须报错', () => {
    const dep = ref(0);
    // @ts-expect-error 需要数组
    useUpdateEffect(() => {}, dep);
  });

  it('★ 负例：callback 返回非函数非 void 必须报错', () => {
    // @ts-expect-error 返回 number 不合法
    useUpdateEffect(() => 1, []);
  });

  it('useId 可传可不传 id，恒返回 string', () => {
    expectTypeOf(useId()).toEqualTypeOf<string>();
    expectTypeOf(useId('my-id')).toEqualTypeOf<string>();
    // @ts-expect-error id 必须是 string
    useId(1);
  });

  it('useLockFocus 的元素来源同时接受 ref 与 getter（严格超集）', () => {
    const lock = ref(true);
    const elementRef = ref<HTMLElement | null>(null);

    // 包在 effectScope 里：useLockFocus 内部用 onScopeDispose 清理，
    // 作用域外调用会触发 Vue 的告警 —— 测试输出里不该有噪音告警。
    const scope = effectScope();
    scope.run(() => {
      expectTypeOf(useLockFocus(lock, elementRef)).toEqualTypeOf<[(ele: HTMLElement) => void]>();
      expectTypeOf(
        useLockFocus(
          () => lock.value,
          () => document.body,
        ),
      ).toEqualTypeOf<[(ele: HTMLElement) => void]>();
      // 也接受裸 boolean（MaybeRef 含裸值）
      useLockFocus(true, () => null);
    });
    scope.stop();
  });

  it('★ 负例：元素来源类型不对必须报错', () => {
    // ⚠️ `*.test-d.ts` 虽然主要做类型检查，但**仍然会被实际执行**。
    //    所以负例也必须在运行期安全 —— 这一句若直接执行，字符串会被当成元素传进
    //    `lockFocus`，随后 `querySelectorAll` 调用失败而抛错。
    //    惯用解法：把非法调用放进一个**永不执行**的闭包，只让 TS 看它。
    const neverCalled = (): void => {
      // @ts-expect-error string 不是 HTMLElement | null
      useLockFocus(true, 'not-an-element');
    };
    expectTypeOf(neverCalled).toBeFunction();
  });
});

describe('ref 工具', () => {
  it('fillRef 接受三种形态 + null/undefined', () => {
    const node = document.createElement('div');
    fillRef<HTMLElement>((n) => void n, node);
    fillRef<HTMLElement>({ value: null }, node);
    fillRef<HTMLElement>({ current: null }, node);
    fillRef<HTMLElement>(null, node);
    fillRef<HTMLElement>(undefined, node);
  });

  it('★ 负例：既非函数也无 value/current 的对象必须报错', () => {
    const node = document.createElement('div');
    // @ts-expect-error { other: number } 不满足 RefLike
    fillRef<HTMLElement>({ other: 1 }, node);
  });

  it('composeRef 的返回值可能是非函数（length <= 1 时原样返回）', () => {
    const fn = (n: HTMLElement | null) => void n;
    expectTypeOf(composeRef<HTMLElement>(fn)).toEqualTypeOf<RefLike<HTMLElement>>();
  });

  it('useComposeRef 恒返回可调用的 computed（把非函数形态包起来）', () => {
    const merged = useComposeRef<HTMLElement>({ value: null });
    expectTypeOf(merged).toEqualTypeOf<ComputedRef<(node: HTMLElement | null) => void>>();
  });

  it('getNodeRef 的泛型参数决定返回类型', () => {
    const node = null as VNode | null;
    expectTypeOf(getNodeRef<HTMLDivElement>(node)).toEqualTypeOf<HTMLDivElement | null>();
    expectTypeOf(getNodeRef(node)).toEqualTypeOf<unknown>();
  });
});

describe('toArray / toList / capitalize / KeyCode / get', () => {
  it('toArray 恒返回 VNode[]', () => {
    expectTypeOf(toArray(null)).toEqualTypeOf<VNode[]>();
    expectTypeOf(toArray([1, 'a', true])).toEqualTypeOf<VNode[]>();
    expectTypeOf(toArray(() => [])).toEqualTypeOf<VNode[]>();
    toArray(null, { keepEmpty: true });
    // @ts-expect-error option 只有 keepEmpty
    toArray(null, { keepAll: true });
  });

  it('toList 把单值或数组统一成数组，保留元素类型', () => {
    expectTypeOf(toList(1)).toEqualTypeOf<number[]>();
    expectTypeOf(toList([1, 2])).toEqualTypeOf<number[]>();
    expectTypeOf(toList('a', { skipEmpty: true })).toEqualTypeOf<string[]>();
    // @ts-expect-error config 只有 skipEmpty
    toList(1, { skip: true });
  });

  it('capitalize 保持入参类型（非字符串原样返回）', () => {
    expectTypeOf(capitalize('abc')).toEqualTypeOf<string>();
    expectTypeOf(capitalize(123)).toEqualTypeOf<number>();
  });

  it('get 返回 unknown（需要调用方自己收窄）', () => {
    expectTypeOf(get({ a: 1 }, ['a'])).toEqualTypeOf<unknown>();
  });

  it('KeyCode 的常量是 number、方法是 boolean', () => {
    expectTypeOf(KeyCode.ENTER).toEqualTypeOf<number>();
    expectTypeOf(KeyCode.isCharacterKey(0)).toEqualTypeOf<boolean>();
    expectTypeOf(KeyCode.isEditableTarget(new KeyboardEvent('keydown'))).toEqualTypeOf<boolean>();
    // @ts-expect-error 不存在的键
    KeyCode.NOT_A_REAL_KEY;
  });
});

describe('类型导出的可用性（消费方需要 import type）', () => {
  it('关键类型可以从包入口 import type 出来', () => {
    expectTypeOf<SetDelayState<number>>().toBeFunction();
    expectTypeOf<SetState<number>>().toBeFunction();
    expectTypeOf<RefLike<HTMLElement>>().not.toBeNever();
    expectTypeOf<ControlledUpdater<number>>().not.toBeNever();
  });

  it('computed 与 Ref 类型仍然来自 vue（我们不做重复定义）', () => {
    const c = computed(() => 1);
    expectTypeOf(c).toEqualTypeOf<ComputedRef<number>>();
  });
});
