/**
 * 批次③b 行为测试 —— `validateRule` / `validateRules` / `Field`（renderless）。
 *
 * ⚠️⚠️ **本文件不是 oracle 差分。** 契约 §7.0.1 已定判据：
 * 「上游零框架耦合 ⇒ 可做 Oracle；绑 React 生命周期 ⇒ 不能」。
 *
 * - `utils/validateUtil.js` 第 2 行就是 `import * as React from 'react'`
 *   （`:71-76` 用 `isValidElement` / `cloneElement`）⇒ **不可对拍**；
 * - `Field.js` 是 `React.PureComponent` + `forceUpdate` ⇒ **不可对拍**。
 *
 * 所以期望值全部来自**逐行读上游源码**（每条都标了行号），不是照我们的实现反推。
 * 唯一「与 React 无关」的部分是 `Schema`（批次①），它已被 oracle 逐位对拍过。
 *
 * ── 测试里的 Field 挂载方式 ───────────────────────────────────────────────────
 *
 * `Field` 是 renderless 组件（scoped slot 形态），所以测试用一个 Host 组件
 * `provide(fieldContextKey, form)`，把 `Field` 的 slot 参数 `(control, meta, form)`
 * 捕获下来再断言。这与契约 §6.4.3 的消费方式一致。
 */

import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  type Component,
  defineComponent,
  h,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  type VNodeChild,
} from 'vue';

import { Field } from '../field';
import { defaultFieldContext, fieldContextKey, HOOK_MARK, listContextKey } from '../form-context';
import { FormStore } from '../form-store';
import type {
  ChildProps,
  FieldMessage,
  FormInstance,
  FormRule,
  InternalFormInstance,
  InternalValidateOptions,
  ListContextProps,
  Meta,
  RuleObject,
} from '../form-types';
import { defaultValidateMessages, replaceMessage } from '../validate-messages';
import { validateRule, validateRules } from '../validate-util';

// ---------------------------------------------------------------------------
// 工具
// ---------------------------------------------------------------------------

function createStore() {
  const forceRootUpdate = vi.fn();
  const store = new FormStore(forceRootUpdate);
  const form = store.getForm();
  const hooks = store.getInternalHooks(HOOK_MARK);
  if (!hooks) {
    throw new Error('getInternalHooks 返回 null —— 钥匙必须是 HOOK_MARK');
  }
  return { store, form, hooks, forceRootUpdate };
}

interface Captured {
  control: ChildProps | null;
  meta: Meta | null;
  form: FormInstance | null;
}

interface MountFieldOptions {
  /** 自定义 slot 内容（默认渲染一个空 `<i>`）。返回值按 Vue 的 Slot 约定是数组。 */
  slot?: (control: ChildProps, meta: Meta, form: FormInstance) => VNodeChild[];
  /** 传入 `null` 表示**不** provide（用于测默认 Context 兜底）。 */
  form?: InternalFormInstance | null;
  listContext?: ListContextProps | null;
  /** 默认 `true`；`false` 时不 provide `listContextKey`。 */
  provideList?: boolean;
}

interface FieldHarness {
  wrapper: VueWrapper;
  captured: Captured;
  renderCount: () => number;
}

function mountField(
  form: InternalFormInstance | null,
  props: Record<string, unknown>,
  options: MountFieldOptions = {},
): FieldHarness {
  const captured: Captured = { control: null, meta: null, form: null };
  let renderCount = 0;

  const Host = defineComponent({
    name: 'FieldHost',
    setup() {
      if (options.form !== null) {
        provide(fieldContextKey, options.form ?? form ?? defaultFieldContext);
      }
      if (options.provideList !== false) {
        provide(listContextKey, options.listContext ?? null);
      }
      return () =>
        h(Field, props, {
          default: (control: ChildProps, meta: Meta, f: FormInstance) => {
            renderCount += 1;
            captured.control = control;
            captured.meta = meta;
            captured.form = f;
            return options.slot ? options.slot(control, meta, f) : [h('i', { class: 'probe' })];
          },
        });
    },
  });

  return { wrapper: mount(Host), captured, renderCount: () => renderCount };
}

function control(h: FieldHarness): ChildProps {
  if (!h.captured.control) throw new Error('slot 还没有被调用过');
  return h.captured.control;
}

function meta(h: FieldHarness): Meta {
  if (!h.captured.meta) throw new Error('slot 还没有被调用过');
  return h.captured.meta;
}

/** 造一个「能数挂载次数」的子组件（用于观察 keyed Fragment 的重建）。 */
function createProbe(): { state: { mounted: number; unmounted: number }; Probe: Component } {
  const state = { mounted: 0, unmounted: 0 };
  const Probe = defineComponent({
    name: 'MountProbe',
    setup() {
      onMounted(() => {
        state.mounted += 1;
      });
      onUnmounted(() => {
        state.unmounted += 1;
      });
      return () => h('span', 'probe');
    },
  });
  return { state, Probe };
}

function flushMacroTask(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

const originalError = console.error;
afterEach(() => {
  console.error = originalError;
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// validateRule（上游 utils/validateUtil.js:23-99）
// ---------------------------------------------------------------------------

describe('validateRule · 单条规则', () => {
  it('通过 ⇒ 返回空数组', async () => {
    await expect(validateRule('a', 'x', { required: true }, {})).resolves.toEqual([]);
  });

  it('required 失败 ⇒ 消息经 replaceMessage 填入 name', async () => {
    const errors = await validateRule('a', '', { required: true }, {});
    expect(errors).toEqual(["'a' is required"]);
  });

  it("namePath 用 `.` 连接（`namePath.join('.')`）", async () => {
    const errors = await validateRule('user.name', '', { required: true }, {});
    expect(errors).toEqual(["'user.name' is required"]);
  });

  it('rule.message 覆盖校验器产出的消息（Schema 的 `rule.message` 分支）', async () => {
    const errors = await validateRule('a', '', { required: true, message: 'need a' }, {});
    expect(errors).toEqual(['need a']);
  });

  it('⭐ 非字符串 message（VNode）**引用不变**地透传 —— 差异 1：不再包 key', async () => {
    const vnode = h('b', 'err');
    const errors = await validateRule(
      'a',
      '',
      { required: true, message: vnode as unknown as FieldMessage },
      {},
    );
    expect(errors[0]).toBe(vnode);
  });

  it('⭐ 数字 message 也透传（`FieldMessage = string | VNodeChild` 比上游宽）', async () => {
    const errors = await validateRule(
      'a',
      '',
      { required: true, message: 42 as unknown as FieldMessage },
      {},
    );
    expect(errors).toEqual([42]);
  });

  it('validator 同步抛错 ⇒ console.error + `messages.default`（CODE_LOGIC_ERROR 哨兵）', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const rule: RuleObject = {
      validator: () => {
        throw new Error('boom');
      },
    };
    const errors = await validateRule('a', 'v', rule, {});

    expect(spy).toHaveBeenCalledTimes(1);
    // 第 6 步：`CODE_LOGIC_ERROR` ⇒ 换成 `messages.default`，再经 replaceMessage
    expect(errors).toEqual([replaceMessage(defaultValidateMessages.default, { name: 'a' })]);
  });

  it('validator 通过 ⇒ 返回空数组（表单层类型只允许 promise / callback）', async () => {
    // ⚠️ `FieldValidator` 的返回类型是 `Promise<unknown> | void` —— 返回裸 `true`/`false`
    //    在**类型层**就不合法（那是 raw `Schema` 的能力，见批次①）。所以这里用 promise。
    const errors = await validateRule('a', 'v', { validator: () => Promise.resolve() }, {});
    expect(errors).toEqual([]);
  });

  it('options.validateMessages 覆盖默认模板', async () => {
    const errors = await validateRule('a', '', { required: true }, {
      // biome-ignore lint/suspicious/noTemplateCurlyInString: ${x} 是 replaceMessage 的消息模板占位符，必须保持字面量（转成模板串会插值）
      validateMessages: { required: 'CUSTOM ${name}' },
    } as InternalValidateOptions);
    expect(errors).toEqual(['CUSTOM a']);
  });

  it('messageVariables 覆盖 kv（同名键优先）', async () => {
    const errors = await validateRule('a', '', { required: true }, {}, { name: 'OVERRIDE' });
    expect(errors).toEqual(["'OVERRIDE' is required"]);
  });

  // biome-ignore lint/suspicious/noTemplateCurlyInString: ${x} 是 replaceMessage 的消息模板占位符，必须保持字面量（转成模板串会插值）
  it('enum 被 join 进 kv（`${enum}` 可用）', async () => {
    const errors = await validateRule(
      'a',
      'z',
      // biome-ignore lint/suspicious/noTemplateCurlyInString: ${x} 是 replaceMessage 的消息模板占位符，必须保持字面量（转成模板串会插值）
      { type: 'enum', enum: [1, 2], message: 'got ${enum}' },
      {},
    );
    expect(errors).toEqual(['got 1, 2']);
  });

  it('ruleIndex 被删除，且不改动调用方传入的规则对象（cloneRule 才是被删的那个）', async () => {
    const rule = { required: true, ruleIndex: 3 } as RuleObject & { ruleIndex: number };
    await expect(validateRule('a', '', rule, {})).resolves.toEqual(["'a' is required"]);
    expect(rule.ruleIndex).toBe(3);
  });

  it('⭐ type=array + defaultField ⇒ 对每个元素递归并展平（`name.i`）', async () => {
    const rule: RuleObject = {
      type: 'array',
      defaultField: { type: 'string', required: true },
    };
    const errors = await validateRule('list', ['', ''], rule, {});
    expect(errors).toEqual(["'list.0' is required", "'list.1' is required"]);
  });

  it('⭐ 父规则已报错 ⇒ 不递归子规则（`!result.length` 守卫）', async () => {
    // ⚠️ 值必须是**非空数组**：否则 `Array.isArray(value)` 直接为假，
    // 走不到 `!result.length` 这个守卫（早期的弱断言就是这样漏掉 M7 变异的）。
    // 这里让父规则（min:5）与子规则（required）**都会**报错 ——
    // 守卫生效时只保留父规则的 1 条；守卫失效则会多出 2 条子错误。
    const rule: RuleObject = {
      type: 'array',
      min: 5,
      defaultField: { type: 'string', required: true },
    };
    const errors = await validateRule('list', ['', ''], rule, {});
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('list');
  });

  it('空数组 ⇒ 不递归（`value.length > 0` 守卫）', async () => {
    const errors = await validateRule(
      'list',
      [],
      { type: 'array', defaultField: { required: true } },
      {},
    );
    expect(errors).toEqual([]);
  });

  it('值不是数组 ⇒ 不递归', async () => {
    const errors = await validateRule(
      'list',
      'not-array',
      { type: 'array', defaultField: { required: true } },
      {},
    );
    // `type: 'array'` 本身会报类型错，但**不会**递归子规则
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('list');
  });

  // biome-ignore lint/suspicious/noTemplateCurlyInString: ${x} 是 replaceMessage 的消息模板占位符，必须保持字面量（转成模板串会插值）
  it('`\\${name}` 转义：字面输出、不替换（replaceMessage 集成）', async () => {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: ${x} 是 replaceMessage 的消息模板占位符，必须保持字面量（转成模板串会插值）
    const errors = await validateRule('a', '', { required: true, message: '\\${name}' }, {});
    // biome-ignore lint/suspicious/noTemplateCurlyInString: ${x} 是 replaceMessage 的消息模板占位符，必须保持字面量（转成模板串会插值）
    expect(errors).toEqual(['${name}']);
  });

  it('validator 返回 rejected promise（Error）⇒ 用 Error.message 作为消息', async () => {
    const errors = await validateRule(
      'a',
      'v',
      { validator: () => Promise.reject(new Error('nope')) },
      {},
    );
    expect(errors).toEqual(['nope']);
  });
});

// ---------------------------------------------------------------------------
// validateRules（上游 utils/validateUtil.js:105-226）
// ---------------------------------------------------------------------------

describe('validateRules · 规则编排', () => {
  it('全部通过 ⇒ 仍 **reject**（并行分支总是 reject；列表里 errors 为空）', async () => {
    const result = await validateRules(['a'], 'x', [{ required: true }], {}).catch((e) => e);
    // ⚠️ `finishOnAllFailed` 返回的是「每条规则的 `{errors, rule}` 列表」，
    //    不是展平后的错误字符串列表 —— 所以通过时是 `[{errors: []}]`，**不是** `[]`。
    expect(result).toHaveLength(1);
    expect(result[0].errors).toEqual([]);
  });

  it('失败 ⇒ reject([{ errors, rule }])', async () => {
    const result = await validateRules(['a'], '', [{ required: true }], {}).catch((e) => e);
    expect(result).toHaveLength(1);
    expect(result[0].errors).toEqual(["'a' is required"]);
    expect(result[0].rule).toMatchObject({ required: true });
  });

  it('⭐ validateFirst=true 且全过 ⇒ **resolve([])**（与并行分支不对称）', async () => {
    await expect(validateRules(['a'], 'x', [{ required: true }], {}, true)).resolves.toEqual([]);
  });

  it('⭐ validateFirst=true 且空规则 ⇒ resolve([])（不会挂起）', async () => {
    await expect(validateRules(['a'], 'x', [], {}, true)).resolves.toEqual([]);
  });

  it('⭐ validateFirst=true ⇒ 串行，首个失败即停（后面的校验器不再调用）', async () => {
    const calls: string[] = [];
    const mk = (label: string, ok: boolean): RuleObject => ({
      validator: () => {
        calls.push(label);
        if (!ok) throw new Error(label);
      },
    });
    const result = await validateRules(
      ['a'],
      'v',
      [mk('r1', false), mk('r2', true)],
      {},
      true,
    ).catch((e) => e);
    expect(result).toHaveLength(1);
    expect(calls).toEqual(['r1']);
  });

  it("⭐ validateFirst='parallel' ⇒ 并行，首个**非空**结果即 resolve", async () => {
    const slowOk: RuleObject = {
      validator: () => new Promise<void>((resolve) => setTimeout(resolve, 30)),
    };
    const fastFail: RuleObject = {
      validator: () => {
        throw new Error('boom');
      },
    };
    const result = await validateRules(['a'], 'v', [slowOk, fastFail], {}, 'parallel').catch(
      (e) => e,
    );
    expect(result).toHaveLength(1);
    expect(result[0].errors).toEqual([
      replaceMessage(defaultValidateMessages.default, { name: 'a' }),
    ]);
  });

  it("⭐ validateFirst='parallel' 且全部通过 ⇒ 仍 **reject([])**（并行分支统一走 `.then(reject)`）", async () => {
    // ⚠️ 与串行分支的不对称：`validateFirst === true` 全过是 **resolve([])**，
    //    而 `'parallel'` 全过是 **reject([])** —— 因为只有并行分支被
    //    `.then(errors => Promise.reject(errors))` 包过（契约 §4.7.8 第 5 条）。
    const mk = (): RuleObject => ({ validator: () => Promise.resolve() });
    await expect(validateRules(['a'], 'v', [mk(), mk()], {}, 'parallel')).rejects.toEqual([]);
  });

  it('⭐ warningOnly 的规则排到最后，同组保持原序（串行观察调用顺序）', async () => {
    const calls: string[] = [];
    // ⚠️ 表单层（validateRules）的 validator 包装只认「promise」或「callback」——
    //    返回裸 `true` 会**永不 resolve**（上游同样如此，见 validate-util.ts 第 2 步注释）。
    const mk = (label: string, warningOnly?: boolean): RuleObject => ({
      warningOnly,
      validator: () => {
        calls.push(label);
        return Promise.resolve();
      },
    });
    await expect(
      validateRules(['a'], 'v', [mk('w1', true), mk('n1'), mk('n2'), mk('w2', true)], {}, true),
    ).resolves.toEqual([]);
    expect(calls).toEqual(['n1', 'n2', 'w1', 'w2']);
  });

  it('callback 式 validator（deprecated）仍可用，并打告警', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await validateRules(
      ['a'],
      'v',
      [
        {
          validator: (_rule, _value, callback) => {
            callback('bad value');
          },
        },
      ],
      {},
    ).catch((e) => e);

    expect(result[0].errors).toEqual(['bad value']);
    expect(spy.mock.calls.some((c) => String(c[0]).includes('deprecated'))).toBe(true);
  });

  it('promise 式 validator 通过 ⇒ 仍是 reject，但 errors 为空', async () => {
    const result = await validateRules(
      ['a'],
      'v',
      [{ validator: () => Promise.resolve() }],
      {},
    ).catch((e) => e);
    expect(result).toHaveLength(1);
    expect(result[0].errors).toEqual([]);
  });

  it('promise 式 validator reject(Error) ⇒ 消息来自 Error', async () => {
    const result = await validateRules(
      ['a'],
      'v',
      [{ validator: () => Promise.reject(new Error('async boom')) }],
      {},
    ).catch((e) => e);
    expect(result[0].errors).toEqual(['async boom']);
  });

  it('⭐ validator 同时返回 promise 又调 callback ⇒ callback 被忽略并告警', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await validateRules(
      ['a'],
      'v',
      [
        {
          validator: (_rule, _value, callback) => {
            callback('should be ignored');
            return Promise.resolve();
          },
        },
      ],
      {},
    ).catch((e) => e);

    // promise 优先 ⇒ 忽略 callback 的错误
    expect(result).toHaveLength(1);
    expect(result[0].errors).toEqual([]);
    await flushMacroTask();
    expect(spy.mock.calls.some((c) => String(c[0]).includes('already return a promise'))).toBe(
      true,
    );
  });

  it('无 validator 的声明式规则（交给 Schema）', async () => {
    const result = await validateRules(
      ['a'],
      '',
      [{ required: true }, { type: 'string', min: 3 }],
      {},
    ).catch((e) => e);
    // 两条都失败 ⇒ finishOnAllFailed 展平（[].concat(...errorsList)）
    expect(result).toHaveLength(2);
  });

  it('messageVariables 透传到 validateRule', async () => {
    const result = await validateRules(['a'], '', [{ required: true }], {}, false, {
      name: 'VAR',
    }).catch((e) => e);
    expect(result[0].errors).toEqual(["'VAR' is required"]);
  });

  it('options.validateMessages 透传到 validateRule', async () => {
    const result = await validateRules(['a'], '', [{ required: true }], {
      // biome-ignore lint/suspicious/noTemplateCurlyInString: ${x} 是 replaceMessage 的消息模板占位符，必须保持字面量（转成模板串会插值）
      validateMessages: { required: 'REQ ${name}' },
    } as InternalValidateOptions).catch((e) => e);
    expect(result[0].errors).toEqual(['REQ a']);
  });
});

// ---------------------------------------------------------------------------
// Field · 注册 / 注销 / 生命周期
// ---------------------------------------------------------------------------

describe('Field · 注册与生命周期', () => {
  it('挂载注册、卸载注销（`getFields` 可见性）', async () => {
    const { form } = createStore();
    expect(form.getFieldsValue()).toEqual({});

    const harness = mountField(form, { name: 'a' });
    await nextTick();
    expect(form.getFieldsValue()).toEqual({ a: undefined });

    harness.wrapper.unmount();
    await nextTick();
    expect(form.getFieldsValue()).toEqual({});
  });

  it('`initialValue` 在 setup 期写入 store（`initEntityValue`）', async () => {
    const { form } = createStore();
    const harness = mountField(form, { name: 'a', initialValue: 'init' });
    await nextTick();
    expect(form.getFieldValue('a')).toBe('init');
    harness.wrapper.unmount();
  });

  it('⭐ isFieldDirty：字段级 `initialValue` 即视为 dirty（未交互也是）', async () => {
    const { form } = createStore();
    // 永远失败的规则 ⇒ 只要「被校验」就一定能观察到
    const failRule: RuleObject = { validator: () => Promise.reject(new Error('boom')) };
    const a = mountField(form, { name: 'a', rules: [failRule], initialValue: 'x' });
    // 对照组：没有 initialValue、也没交互过 ⇒ 应被 `dirty` 过滤跳过
    const b = mountField(form, { name: 'b', rules: [failRule] });
    await nextTick();

    expect(form.isFieldTouched('a')).toBe(false);

    // ⚠️ `isFieldDirty()` 不在公开 `FormInstance` 上（上游如此），
    //    但它正是 `validateFields({dirty:true})` 的过滤依据 ⇒ 从行为侧观察。
    const result = await form.validateFields({ dirty: true } as never).catch((e) => e);
    expect(result.errorFields.map((f: { name: string[] }) => f.name.join('.'))).toEqual(['a']);

    b.wrapper.unmount();
    a.wrapper.unmount();
  });

  it('⭐ isFieldDirty：表单级 `initialValues` 同样让字段通过 `dirty` 过滤', async () => {
    const { form, hooks } = createStore();
    // 第二个参数 init=false ⇒ 只登记 initialValues，不回填 store
    hooks.setInitialValues({ a: 'form-level' }, false);
    const failRule: RuleObject = { validator: () => Promise.reject(new Error('boom')) };
    const harness = mountField(form, { name: 'a', rules: [failRule] });
    await nextTick();

    const result = await form.validateFields({ dirty: true } as never).catch((e) => e);
    expect(result.errorFields).toHaveLength(1);
    harness.wrapper.unmount();
  });

  it('name 省略 ⇒ 不注册为「有 name」的字段（`getFieldsValue` 不含）', async () => {
    const { form } = createStore();
    const harness = mountField(form, {});
    await nextTick();
    expect(form.getFieldsValue()).toEqual({});
    harness.wrapper.unmount();
  });

  it('⭐ 没有 Form 上下文 ⇒ 用默认 Context 告警，但**不崩**', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const harness = mountField(null, { name: 'a' }, { form: null });
    await nextTick();

    expect(harness.renderCount()).toBeGreaterThan(0);
    expect(spy.mock.calls.some((c) => String(c[0]).includes('Can not find FormContext'))).toBe(
      true,
    );
    harness.wrapper.unmount();
  });

  it('onMetaChange 在 meta 变化时回调；重复 meta 被 isEqual 去重', async () => {
    const { form } = createStore();
    const onMetaChange = vi.fn();
    const harness = mountField(form, { name: 'a', onMetaChange });
    await nextTick();

    // 纯挂载不改变 meta ⇒ 不回调（上游只在状态变化时触发）
    expect(onMetaChange).not.toHaveBeenCalled();

    // 触发一次 onChange（touched/dirty 变化 ⇒ meta 变化）
    control(harness).onChange({ target: { value: 'v' } });
    await nextTick();
    expect(onMetaChange).toHaveBeenCalled();
    const first = onMetaChange.mock.calls.at(-1)?.[0] as Meta;
    expect(first.name).toEqual(['a']);
    expect(first.touched).toBe(true);

    // 再触发一次「值不变」的 onChange ⇒ meta 未变 ⇒ 去重后不再回调
    onMetaChange.mockClear();
    control(harness).onChange({ target: { value: 'v' } });
    await nextTick();
    expect(onMetaChange).not.toHaveBeenCalled();

    harness.wrapper.unmount();
  });

  it('卸载时触发 onMetaChange 且带 `destroy: true`', async () => {
    const { form } = createStore();
    const onMetaChange = vi.fn();
    const harness = mountField(form, { name: 'a', onMetaChange });
    await nextTick();
    onMetaChange.mockClear();

    harness.wrapper.unmount();
    const last = onMetaChange.mock.calls.at(-1)?.[0] as { destroy?: boolean };
    expect(last?.destroy).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Field · getControlled
// ---------------------------------------------------------------------------

describe('Field · getControlled 受控注入', () => {
  it('slot 收到 (control, meta, form) 三元', async () => {
    const { form } = createStore();
    const harness = mountField(form, { name: 'a' });
    await nextTick();

    expect(typeof control(harness).onChange).toBe('function');
    expect(meta(harness).name).toEqual(['a']);
    expect(harness.captured.form).toBe(form);
    harness.wrapper.unmount();
  });

  it('control.value 取自 store（默认 valuePropName = value）', async () => {
    const { form } = createStore();
    form.setFieldsValue({ a: 'from-store' });
    const harness = mountField(form, { name: 'a' });
    await nextTick();
    expect(control(harness).value).toBe('from-store');
    harness.wrapper.unmount();
  });

  it('valuePropName 可自定义', async () => {
    const { form } = createStore();
    form.setFieldsValue({ a: true });
    const harness = mountField(form, { name: 'a', valuePropName: 'checked' });
    await nextTick();
    expect(control(harness).checked).toBe(true);
    expect(control(harness).value).toBeUndefined();
    harness.wrapper.unmount();
  });

  it('control.onChange 把新值写回 store（默认从 event.target.value 取）', async () => {
    const { form } = createStore();
    const harness = mountField(form, { name: 'a' });
    await nextTick();

    control(harness).onChange({ target: { value: 'typed' } });
    await nextTick();
    expect(form.getFieldValue('a')).toBe('typed');
    harness.wrapper.unmount();
  });

  it('getValueFromEvent 自定义取值', async () => {
    const { form } = createStore();
    const harness = mountField(form, {
      name: 'a',
      getValueFromEvent: (...args: unknown[]) => `got:${String(args[0])}`,
    });
    await nextTick();

    control(harness).onChange('raw');
    await nextTick();
    expect(form.getFieldValue('a')).toBe('got:raw');
    harness.wrapper.unmount();
  });

  it('normalize 应用到新值（第三参是 allValues）', async () => {
    const { form } = createStore();
    const harness = mountField(form, {
      name: 'a',
      normalize: (value: unknown, _prev: unknown, all: Record<string, unknown>) =>
        `${String(value)}|${String(all.b)}`,
    });
    form.setFieldsValue({ b: 'B' });
    await nextTick();

    control(harness).onChange({ target: { value: 'A' } });
    await nextTick();
    expect(form.getFieldValue('a')).toBe('A|B');
    harness.wrapper.unmount();
  });

  it('getValueProps 自定义注入的受控 props', async () => {
    const { form } = createStore();
    form.setFieldsValue({ a: 'x' });
    const harness = mountField(form, {
      name: 'a',
      getValueProps: (value: unknown) => ({ special: `v-${String(value)}` }),
    });
    await nextTick();
    expect(control(harness).special).toBe('v-x');
    harness.wrapper.unmount();
  });

  it('getValueProps 返回函数值 ⇒ 打告警（不推荐动态函数 prop）', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { form } = createStore();
    const harness = mountField(form, {
      name: 'a',
      getValueProps: () => ({ onThing: () => undefined }),
    });
    await nextTick();
    expect(spy.mock.calls.some((c) => String(c[0]).includes('not recommended'))).toBe(true);
    harness.wrapper.unmount();
  });

  it('trigger 可自定义（默认 onChange）', async () => {
    const { form } = createStore();
    const harness = mountField(form, { name: 'a', trigger: 'onInput' });
    await nextTick();

    expect(control(harness).onChange).toBeUndefined();
    control(harness).onInput({ target: { value: 'via-input' } });
    await nextTick();
    expect(form.getFieldValue('a')).toBe('via-input');
    harness.wrapper.unmount();
  });

  it('name 省略 ⇒ control 里没有受控值键', async () => {
    const { form } = createStore();
    const harness = mountField(form, {});
    await nextTick();
    expect('value' in control(harness)).toBe(false);
    harness.wrapper.unmount();
  });

  it('onChange 后 touched / dirty / meta.touched 都为真', async () => {
    const { form } = createStore();
    const harness = mountField(form, { name: 'a' });
    await nextTick();
    expect(meta(harness).touched).toBe(false);

    control(harness).onChange({ target: { value: 'v' } });
    await nextTick();
    expect(meta(harness).touched).toBe(true);
    harness.wrapper.unmount();
  });

  it('值未变化时 onChange 不 dispatch（引用比较）', async () => {
    const { form } = createStore();
    form.setFieldsValue({ a: 'same' });
    const onValuesChange = vi.fn();
    (form as InternalFormInstance).getInternalHooks(HOOK_MARK)?.setCallbacks({ onValuesChange });

    const harness = mountField(form, { name: 'a' });
    await nextTick();
    control(harness).onChange({ target: { value: 'same' } });
    await nextTick();
    expect(onValuesChange).not.toHaveBeenCalled();
    harness.wrapper.unmount();
  });
});

// ---------------------------------------------------------------------------
// Field · 校验
// ---------------------------------------------------------------------------

describe('Field · 校验', () => {
  it('validateFields 通过 ⇒ meta.errors 空、validated=true', async () => {
    const { form } = createStore();
    const harness = mountField(form, { name: 'a', rules: [{ required: true }] });
    await nextTick();
    expect(meta(harness).validated).toBe(false);

    form.setFieldsValue({ a: 'ok' });
    await form.validateFields();
    await nextTick();

    expect(meta(harness).errors).toEqual([]);
    expect(meta(harness).validated).toBe(true);
    harness.wrapper.unmount();
  });

  it('validateFields 失败 ⇒ meta.errors 有消息', async () => {
    const { form } = createStore();
    const harness = mountField(form, { name: 'a', rules: [{ required: true }] });
    await nextTick();

    await form.validateFields().catch((e) => e);
    await nextTick();

    expect(meta(harness).errors).toEqual(["'a' is required"]);
    harness.wrapper.unmount();
  });

  it('warningOnly 规则 ⇒ 进 meta.warnings，不进 errors', async () => {
    const { form } = createStore();
    const harness = mountField(form, {
      name: 'a',
      rules: [{ warningOnly: true, required: true }],
    });
    await nextTick();

    await form.validateFields().catch((e) => e);
    await nextTick();

    expect(meta(harness).errors).toEqual([]);
    expect(meta(harness).warnings).toEqual(["'a' is required"]);
    harness.wrapper.unmount();
  });

  it('validateTrigger 事件触发校验（先跑原 handler，再 dispatch validateField）', async () => {
    const { form } = createStore();
    const harness = mountField(form, {
      name: 'a',
      rules: [{ required: true }],
      validateTrigger: 'onBlur',
    });
    await nextTick();

    expect(typeof control(harness).onBlur).toBe('function');
    control(harness).onBlur();
    await flushMacroTask();
    await nextTick();
    await nextTick();

    expect(meta(harness).errors).toEqual(["'a' is required"]);
    harness.wrapper.unmount();
  });

  it('rule.validateTrigger 过滤：不匹配的规则被跳过', async () => {
    const { form } = createStore();
    const harness = mountField(form, {
      name: 'a',
      rules: [{ required: true, validateTrigger: 'onFocus' }],
      validateTrigger: 'onBlur',
    });
    await nextTick();

    control(harness).onBlur();
    await flushMacroTask();
    await nextTick();
    await nextTick();

    // 规则只认 onFocus ⇒ onBlur 触发时被过滤掉 ⇒ 无错误
    expect(meta(harness).errors).toEqual([]);
    harness.wrapper.unmount();
  });

  it('⭐ 无规则 ⇒ validateTrigger 事件不产生校验（双层守卫：Field + store）', async () => {
    const { form } = createStore();
    const harness = mountField(form, { name: 'a', validateTrigger: 'onBlur' });
    await nextTick();

    // 包装函数照常挂在 control 上
    expect(typeof control(harness).onBlur).toBe('function');
    control(harness).onBlur();
    await flushMacroTask();
    await nextTick();
    await nextTick();

    // ⚠️ 即使 Field 侧的 `rules && rules.length` 守卫被去掉（变异 F6 等价变异），
    //    store 侧 `form-store.ts:851` 也会跳过无规则字段 ⇒ 此处**观察不到差异**。
    //    这条用例锁的是「无规则不校验」这个**行为契约**，不是某一行守卫。
    expect(meta(harness).validated).toBe(false);
    expect(meta(harness).validating).toBe(false);
    harness.wrapper.unmount();
  });

  it('isFieldValidating 在校验进行中为 true（pending validator）', async () => {
    const { form } = createStore();
    const harness = mountField(form, {
      name: 'a',
      rules: [{ validator: () => new Promise<void>(() => {}) }],
    });
    await nextTick();

    void form.validateFields();
    await flushMacroTask();
    expect(form.isFieldValidating('a')).toBe(true);
    harness.wrapper.unmount();
  });

  it('validateOnly ⇒ 不设 validatePromise（isFieldValidating 保持 false）', async () => {
    const { form } = createStore();
    const harness = mountField(form, {
      name: 'a',
      rules: [{ validator: () => new Promise<void>(() => {}) }],
    });
    await nextTick();

    void form.validateFields({ validateOnly: true });
    await flushMacroTask();
    expect(form.isFieldValidating('a')).toBe(false);
    harness.wrapper.unmount();
  });

  it('validateDebounce ⇒ 延迟后才校验（期间 meta 无错误）', async () => {
    vi.useFakeTimers();
    try {
      const { form } = createStore();
      const harness = mountField(form, {
        name: 'a',
        rules: [{ required: true }],
        validateTrigger: 'onBlur',
        validateDebounce: 50,
      });
      await nextTick();

      control(harness).onBlur();
      await vi.advanceTimersByTimeAsync(10);
      await nextTick();
      expect(meta(harness).errors).toEqual([]);

      await vi.advanceTimersByTimeAsync(60);
      await nextTick();
      expect(meta(harness).errors).toEqual(["'a' is required"]);
      harness.wrapper.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('⭐ validateDebounce 内重复触发 ⇒ 只有最后一次真正校验（过期跳过）', async () => {
    vi.useFakeTimers();
    try {
      let validatorCalls = 0;
      const { form } = createStore();
      const harness = mountField(form, {
        name: 'a',
        rules: [
          {
            validator: () => {
              validatorCalls += 1;
              return Promise.resolve();
            },
          },
        ],
        validateTrigger: 'onBlur',
        validateDebounce: 50,
      });
      await nextTick();

      control(harness).onBlur();
      await vi.advanceTimersByTimeAsync(10);
      control(harness).onBlur();
      await vi.advanceTimersByTimeAsync(80);
      await nextTick();

      expect(validatorCalls).toBe(1);
      harness.wrapper.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('validateFirst 透传到 validateRules（串行 ⇒ 只跑第一条失败的）', async () => {
    const calls: string[] = [];
    const { form } = createStore();
    const harness = mountField(form, {
      name: 'a',
      validateFirst: true,
      rules: [
        {
          validator: () => {
            calls.push('r1');
            throw new Error('r1');
          },
        },
        {
          validator: () => {
            calls.push('r2');
          },
        },
      ],
    });
    await nextTick();

    await form.validateFields().catch((e) => e);
    expect(calls).toEqual(['r1']);
    harness.wrapper.unmount();
  });
});

// ---------------------------------------------------------------------------
// Field · shouldUpdate / dependencies / preserve / refresh
// ---------------------------------------------------------------------------

describe('Field · shouldUpdate 与 dependencies', () => {
  it('shouldUpdate=true ⇒ 任意 store 变化都重渲染', async () => {
    const { form } = createStore();
    const harness = mountField(form, { name: 'a', shouldUpdate: true });
    await nextTick();
    const before = harness.renderCount();

    form.setFieldsValue({ other: 1 });
    await nextTick();
    expect(harness.renderCount()).toBeGreaterThan(before);
    harness.wrapper.unmount();
  });

  it('shouldUpdate 函数 ⇒ 按返回值决定', async () => {
    const { form } = createStore();
    const shouldUpdate = vi.fn(() => true);
    const harness = mountField(form, { name: 'a', shouldUpdate });
    await nextTick();
    const before = harness.renderCount();

    form.setFieldsValue({ other: 1 });
    await nextTick();
    expect(shouldUpdate).toHaveBeenCalled();
    expect(harness.renderCount()).toBeGreaterThan(before);
    harness.wrapper.unmount();
  });

  it('⭐ dependencies：依赖字段变化且本字段 dirty ⇒ 重渲染', async () => {
    const { form } = createStore();
    // A 是被依赖的字段
    const a = mountField(form, { name: 'a' });
    // B 依赖 A，且通过 initialValue 变成 dirty
    const b = mountField(form, { name: 'b', dependencies: ['a'], initialValue: 'x' });
    await nextTick();

    const before = b.renderCount();

    // ⚠️ 必须走 `updateValue`（Field 的 onChange）—— `setFieldValue` 是 `setFields`，
    //    不触发 `triggerDependenciesUpdate`（契约 §4.7.6 的六步链只在 updateValue 里）。
    control(a).onChange({ target: { value: 'changed' } });
    await nextTick();
    expect(b.renderCount()).toBeGreaterThan(before);

    b.wrapper.unmount();
    a.wrapper.unmount();
  });

  it('dependencies 未设置 ⇒ 依赖变化不影响本字段重渲染', async () => {
    const { form } = createStore();
    const a = mountField(form, { name: 'a' });
    const b = mountField(form, { name: 'b' });
    await nextTick();
    const before = b.renderCount();

    form.setFieldValue('a', 'changed');
    await nextTick();
    expect(b.renderCount()).toBe(before);

    b.wrapper.unmount();
    a.wrapper.unmount();
  });

  it('⭐ 自身值未变 ⇒ 不重渲染（`requireUpdate` 的引用比较；走 default 分支）', async () => {
    const { form } = createStore();
    // 有 dependencies 且 namePath 非空 ⇒ default 分支里 `namePath.length` 为真，
    // 于是**一定会**求值 `requireUpdate` —— 这正是 F1 变异（恒返回 true）的探测点。
    const b = mountField(form, { name: 'b', dependencies: ['a'], initialValue: 'x' });
    await nextTick();
    const before = b.renderCount();

    // `setFieldsValue` 是 `valueUpdate`（source: external），b 的自身值没变
    form.setFieldsValue({ other: 1 });
    await nextTick();
    expect(b.renderCount()).toBe(before);

    b.wrapper.unmount();
  });
});

describe('Field · preserve 与 refresh', () => {
  it('⭐ preserve=false ⇒ 卸载时清掉 store 里的值', async () => {
    const { form } = createStore();
    const harness = mountField(form, { name: 'a', preserve: false });
    await nextTick();
    control(harness).onChange({ target: { value: 'v' } });
    await nextTick();
    expect(form.getFieldValue('a')).toBe('v');

    harness.wrapper.unmount();
    await nextTick();
    expect(form.getFieldValue('a')).toBeUndefined();
  });

  it('⭐ preserve 未传（undefined）⇒ 卸载后值**保留**（Boolean 转换不能把它变成 false）', async () => {
    const { form } = createStore();
    const harness = mountField(form, { name: 'a' });
    await nextTick();
    control(harness).onChange({ target: { value: 'keep' } });
    await nextTick();

    harness.wrapper.unmount();
    await nextTick();
    expect(form.getFieldValue('a')).toBe('keep');
  });

  it('preserve=false 且 isListField ⇒ 不因卸载清值（`(!isListField || subNamePath.length > 1)`）', async () => {
    const { form } = createStore();
    const harness = mountField(form, {
      name: 'a',
      preserve: false,
      isListField: true,
    });
    await nextTick();
    control(harness).onChange({ target: { value: 'v' } });
    await nextTick();

    harness.wrapper.unmount();
    await nextTick();
    expect(form.getFieldValue('a')).toBe('v');
  });

  it('⭐ isListField 可由 listContext 推出（`isListField ?? !!listContext`）', async () => {
    const { form } = createStore();
    const listContext: ListContextProps = { getKey: () => ['keep', []] };
    const harness = mountField(
      form,
      { name: 'a', preserve: false },
      { listContext, provideList: true },
    );
    await nextTick();
    control(harness).onChange({ target: { value: 'v' } });
    await nextTick();

    harness.wrapper.unmount();
    await nextTick();
    // 由 listContext 推出 isListField ⇒ 与上一条同语义：值保留
    expect(form.getFieldValue('a')).toBe('v');
  });

  it('preserve=false + isListField + namePath.length<=1 ⇒ dev 告警', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { form } = createStore();
    const harness = mountField(
      form,
      { name: 'a', preserve: false },
      { listContext: { getKey: () => ['keep', []] }, provideList: true },
    );
    await nextTick();
    expect(spy.mock.calls.some((c) => String(c[0]).includes('should not apply on Form.List'))).toBe(
      true,
    );
    harness.wrapper.unmount();
  });

  it('⭐ reset ⇒ touched/errors 清空、onReset 被调用、子节点重建（keyed Fragment）', async () => {
    const { form } = createStore();
    const probe = createProbe();
    const onReset = vi.fn();
    const harness = mountField(
      form,
      { name: 'a', rules: [{ required: true }], onReset },
      { slot: () => [h(probe.Probe)] },
    );
    await nextTick();
    expect(probe.state.mounted).toBe(1);

    await form.validateFields().catch((e) => e);
    await nextTick();
    expect(meta(harness).errors).toEqual(["'a' is required"]);

    form.resetFields();
    await nextTick();

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(meta(harness).errors).toEqual([]);
    expect(meta(harness).touched).toBe(false);
    // keyed Fragment 的 key 变了 ⇒ 子节点 unmount + mount
    expect(probe.state.unmounted).toBe(1);
    expect(probe.state.mounted).toBe(2);

    harness.wrapper.unmount();
  });
});

// ---------------------------------------------------------------------------
// Field · 组件契约细节
// ---------------------------------------------------------------------------

describe('Field · 组件契约细节', () => {
  it('Field 是 renderless：不产自己的 DOM 包裹层', async () => {
    const { form } = createStore();
    const harness = mountField(form, { name: 'a' });
    await nextTick();
    // 只渲染 slot 内容
    expect(harness.wrapper.html()).toBe('<i class="probe"></i>');
    harness.wrapper.unmount();
  });

  it('getMeta 的 validated 判据是 `validatePromise === null`（初始 undefined ⇒ false）', async () => {
    const { form } = createStore();
    const harness = mountField(form, { name: 'a', rules: [{ required: true }] });
    await nextTick();
    expect(meta(harness).validated).toBe(false);

    await form.validateFields().catch((e) => e);
    await nextTick();
    expect(meta(harness).validated).toBe(true);
    harness.wrapper.unmount();
  });

  it('renderless 组件名是 `AField`（与 ui 层包装区分）', () => {
    expect(Field.name).toBe('AField');
  });

  it('FormRule 的 RuleRender（函数）在 getRules 里被求值', async () => {
    const { form } = createStore();
    const render = vi.fn(() => ({ required: true }) as RuleObject);
    const rules: FormRule[] = [render as unknown as FormRule];
    const harness = mountField(form, { name: 'a', rules });
    await nextTick();

    await form.validateFields().catch((e) => e);
    await nextTick();
    expect(render).toHaveBeenCalledWith(form);
    expect(meta(harness).errors).toEqual(["'a' is required"]);
    harness.wrapper.unmount();
  });
});

// ---------------------------------------------------------------------------
// validateRule / validateRules 的边角分支
// ---------------------------------------------------------------------------

describe('validateRule · 边角分支', () => {
  it('`type: array` 且 `defaultField` 为 undefined ⇒ 不递归（`?? null` 分支）', async () => {
    const rule = { type: 'array', defaultField: undefined } as unknown as RuleObject;
    await expect(validateRule('list', ['x'], rule, {})).resolves.toEqual([]);
  });

  it('未知 rule type ⇒ Schema 抛错被 catch 住（`errObj.errors` 不存在 ⇒ 返回 []）', async () => {
    const rule = { type: 'bogus' } as unknown as RuleObject;
    await expect(validateRule('a', 'v', rule, {})).resolves.toEqual([]);
  });
});

describe('validateRules · 边角分支', () => {
  it("validator reject 无原因 ⇒ 回落到 `' '`（`err || ' '`）", async () => {
    const result = await validateRules(
      ['a'],
      'v',
      [{ validator: () => Promise.reject() }],
      {},
    ).catch((e) => e);
    expect(result[0].errors).toEqual([' ']);
  });
});

// ---------------------------------------------------------------------------
// Field · store 驱动的分支（setFields / reset / remove / destroy）
// ---------------------------------------------------------------------------

describe('Field · store 驱动的分支', () => {
  it('reset 传入不匹配的 namePathList ⇒ 本字段不重置（`break` 分支）', async () => {
    const { form } = createStore();
    const harness = mountField(form, { name: 'a' });
    await nextTick();
    control(harness).onChange({ target: { value: 'v' } });
    await nextTick();
    expect(meta(harness).touched).toBe(true);

    form.resetFields(['other']);
    await nextTick();
    expect(meta(harness).touched).toBe(true);
    harness.wrapper.unmount();
  });

  it('setField 的 `validating` ⇒ isFieldValidating 变化（无 `originRCField`）', async () => {
    const { form } = createStore();
    const harness = mountField(form, { name: 'a' });
    await nextTick();

    form.setFields([{ name: 'a', validating: true }]);
    await nextTick();
    expect(form.isFieldValidating('a')).toBe(true);

    form.setFields([{ name: 'a', validating: false }]);
    await nextTick();
    expect(form.isFieldValidating('a')).toBe(false);
    harness.wrapper.unmount();
  });

  it('⭐ setField 注入 `errors` / `warnings` ⇒ 原样进 meta（`in data` 两个分支）', async () => {
    const { form } = createStore();
    const harness = mountField(form, { name: 'a' });
    await nextTick();

    // 外部注入的非空数组 —— 若被 `|| EMPTY_ERRORS` 之外的逻辑吞掉就观察不到
    form.setFields([{ name: 'a', errors: ['外部错误'], warnings: ['外部告警'] }]);
    await nextTick();
    expect(meta(harness).errors).toEqual(['外部错误']);
    expect(meta(harness).warnings).toEqual(['外部告警']);

    // 显式传空数组 ⇒ 清空（`|| EMPTY_ERRORS` 的兜底语义）
    form.setFields([{ name: 'a', errors: [], warnings: [] }]);
    await nextTick();
    expect(meta(harness).errors).toEqual([]);
    expect(meta(harness).warnings).toEqual([]);
    harness.wrapper.unmount();
  });

  it('setField 带 value 且路径是本字段的**前缀** ⇒ 重渲染（partial 匹配分支）', async () => {
    const { form } = createStore();
    const harness = mountField(form, { name: ['a', 'b'] });
    await nextTick();
    const before = harness.renderCount();

    form.setFields([{ name: ['a'], value: 1 }]);
    await nextTick();
    expect(harness.renderCount()).toBeGreaterThan(before);
    harness.wrapper.unmount();
  });

  it('无 name + shouldUpdate ⇒ setField 也触发重渲染（`!namePath.length` 分支）', async () => {
    const { form } = createStore();
    const harness = mountField(form, { shouldUpdate: () => true });
    await nextTick();
    const before = harness.renderCount();

    form.setFields([{ name: 'x', errors: [] }]);
    await nextTick();
    expect(harness.renderCount()).toBeGreaterThan(before);
    harness.wrapper.unmount();
  });

  it('⭐ 其它字段 preserve=false 卸载 ⇒ 本字段收到 remove 通知并按 shouldUpdate 重渲染', async () => {
    const { form } = createStore();
    const a = mountField(form, { name: 'a', shouldUpdate: () => true });
    const b = mountField(form, { name: 'b', preserve: false });
    await nextTick();
    control(b).onChange({ target: { value: 'v' } });
    await nextTick();
    const before = a.renderCount();

    b.wrapper.unmount();
    await nextTick();
    expect(a.renderCount()).toBeGreaterThan(before);
    a.wrapper.unmount();
  });

  it('getFieldError / getFieldWarning 走 entity.getErrors / getWarnings', async () => {
    const { form } = createStore();
    const harness = mountField(form, {
      name: 'a',
      rules: [{ required: true }, { warningOnly: true, required: true }],
    });
    await nextTick();
    await form.validateFields().catch((e) => e);
    await nextTick();

    expect(form.getFieldError('a')).toEqual(["'a' is required"]);
    expect(form.getFieldWarning('a')).toEqual(["'a' is required"]);
    harness.wrapper.unmount();
  });

  it('destroyForm ⇒ 逐字段读 isPreserve()', async () => {
    const { form, hooks } = createStore();
    const harness = mountField(form, { name: 'a', preserve: false });
    await nextTick();

    expect(() => hooks.destroyForm()).not.toThrow();
    harness.wrapper.unmount();
  });

  it('⭐ trigger === validateTrigger ⇒ 先跑原 handler 再 dispatch 校验', async () => {
    const { form } = createStore();
    const harness = mountField(form, {
      name: 'a',
      rules: [{ required: true }],
      trigger: 'onChange',
      validateTrigger: 'onChange',
    });
    await nextTick();

    control(harness).onChange({ target: { value: 'typed' } });
    await flushMacroTask();
    await nextTick();
    await nextTick();

    expect(form.getFieldValue('a')).toBe('typed');
    expect(meta(harness).errors).toEqual([]);
    harness.wrapper.unmount();
  });

  it('⭐ 卸载发生在校验微任务之前 ⇒ validateRules 早退（`!mounted` 守卫）', async () => {
    const { form } = createStore();
    const harness = mountField(form, { name: 'a', rules: [{ required: true }] });
    await nextTick();

    const pending = form.validateFields().catch((e) => e);
    // 同步卸载 —— 此时 field.validateRules 的 `Promise.resolve().then` 还没跑
    harness.wrapper.unmount();
    await expect(pending).resolves.toEqual({});
  });

  it('⭐ 校验 promise 在卸载后才落地 ⇒ reRender 的 `!mounted` 守卫生效（不再渲染）', async () => {
    const { form } = createStore();
    const resolvers: (() => void)[] = [];
    const harness = mountField(form, {
      name: 'a',
      rules: [
        {
          validator: () =>
            new Promise<void>((resolve) => {
              resolvers.push(resolve);
            }),
        },
      ],
    });
    await nextTick();

    void form.validateFields().catch((e) => e);
    await flushMacroTask();
    const renders = harness.renderCount();
    harness.wrapper.unmount();

    resolvers[0]?.();
    await flushMacroTask();
    await nextTick();
    expect(harness.renderCount()).toBe(renders);
  });

  it('delayFrame 选项 ⇒ 等一帧后再校验', async () => {
    const { form } = createStore();
    const harness = mountField(form, { name: 'a', rules: [{ required: true }] });
    await nextTick();

    await form.validateFields({ delayFrame: true }).catch((e) => e);
    await new Promise((resolve) => setTimeout(resolve, 60));
    await nextTick();

    expect(meta(harness).errors).toEqual(["'a' is required"]);
    harness.wrapper.unmount();
  });

  it('表单级 initialValue 让 isFieldDirty 为真（走 getInitialValue 分支）', async () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: '' }, true);
    const harness = mountField(form, { name: 'a', rules: [{ required: true }] });
    await nextTick();

    await form.validateFields({ dirty: true }).catch((e) => e);
    await nextTick();
    expect(meta(harness).errors).toEqual(["'a' is required"]);
    harness.wrapper.unmount();
  });
});
