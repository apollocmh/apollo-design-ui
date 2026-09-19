/**
 * 批次③a 行为测试 —— `FormStore` / `useForm` / `useWatch` / `WatcherCenter`。
 *
 * ⚠️⚠️ **本文件不是 oracle 差分。** 契约 §7.0.1 已定判据：
 * 「上游零框架耦合 ⇒ 可做 Oracle；绑 React 生命周期 ⇒ 不能」。
 * 上游 `hooks/useForm.js` / `hooks/useWatch.js` / `Field.js` 全部绑在 React 上
 * （`forceUpdate` / `useState` / `useEffect` / `import * as React`）
 * ⇒ **期望值来自逐行读上游源码**（每条都标了行号），不是照我们的实现反推。
 *
 * 唯一真做过逐位对拍的是 `allPromiseFinish` 与 `isFormInstance`，
 * 在 `batch3a.oracle.test.ts` 里。
 *
 * ── 测试里的 `Field` 替身 ────────────────────────────────────────────────────
 *
 * `FormStore` 只通过 `FieldEntity` 接口与字段交互（契约 §4.7.7），
 * 所以这里手写一个替身而不是挂真组件 —— `Field` 是 ③b 的交付物，
 * 且 renderless 组件的行为不是本子批次的范围。
 * 替身的每个方法都照 `Field.js:383-421` 的语义写：
 * `isFieldTouched` ⇒ `this.touched`；`isFieldDirty` ⇒ `dirty || initialValue !== undefined`；
 * `isFieldValidating` ⇒ `!!validatePromise`。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, effectScope, h, nextTick, watchEffect } from 'vue';
import { default as delayFrame } from '../delay-frame';
import { defaultFieldContext, defaultFormContext, HOOK_MARK } from '../form-context';
import { FormStore } from '../form-store';
import type {
  FieldEntity,
  FieldEntityProps,
  FieldMessage,
  FormInstance,
  FormRule,
  InternalFormInstance,
  InternalNamePath,
  InternalValidateOptions,
  NamePath,
  RuleError,
  StoreValue,
  ValuedNotifyInfo,
} from '../form-types';
import { isFormInstance } from '../form-util';
import { useForm } from '../use-form';
import { stringify, useWatch } from '../use-watch';
import WatcherCenter, { macroTask } from '../watcher-center';

// ---------------------------------------------------------------------------
// 替身与工具
// ---------------------------------------------------------------------------

interface FakeFieldOptions {
  rules?: FormRule[];
  initialValue?: StoreValue;
  isListField?: boolean;
  isList?: boolean;
  preserve?: boolean;
  dependencies?: NamePath[];
  /** 覆写 `validateRules` 的返回（默认 resolve `[]`）。 */
  validateRules?: (options?: InternalValidateOptions) => Promise<RuleError[]>;
}

interface StoreChange {
  namePathList: InternalNamePath[] | null;
  info: ValuedNotifyInfo;
}

function createField(namePath: InternalNamePath, options: FakeFieldOptions = {}) {
  let touched = false;
  let dirty = false;
  let validating = false;
  let errors: FieldMessage[] = [];
  let warnings: FieldMessage[] = [];

  const storeChanges: StoreChange[] = [];
  const validateCalls: (InternalValidateOptions | undefined)[] = [];

  const props: FieldEntityProps = {
    name: namePath,
    rules: options.rules,
    dependencies: options.dependencies,
    initialValue: options.initialValue,
    preserve: options.preserve,
    isListField: options.isListField,
    isList: options.isList,
  };

  const entity: FieldEntity = {
    props,
    getNamePath: () => namePath,
    isFieldTouched: () => touched,
    isFieldDirty: () => dirty || options.initialValue !== undefined,
    isFieldValidating: () => validating,
    isListField: () => Boolean(options.isListField),
    isList: () => Boolean(options.isList),
    isPreserve: () => Boolean(options.preserve),
    getMeta: () => ({
      touched,
      validating,
      errors,
      warnings,
      name: namePath,
      validated: !validating,
    }),
    getErrors: () => errors,
    getWarnings: () => warnings,
    validateRules: (opts) => {
      validateCalls.push(opts);
      return options.validateRules ? options.validateRules(opts) : Promise.resolve([]);
    },
    onStoreChange: (_store, namePathList, info) => {
      storeChanges.push({ namePathList, info });
    },
  };

  return {
    entity,
    props,
    storeChanges,
    validateCalls,
    setTouched: (value: boolean) => {
      touched = value;
    },
    setDirty: (value: boolean) => {
      dirty = value;
    },
    setValidating: (value: boolean) => {
      validating = value;
    },
    setErrors: (value: FieldMessage[]) => {
      errors = value;
    },
    setWarnings: (value: FieldMessage[]) => {
      warnings = value;
    },
  };
}

function createStore() {
  const forceRootUpdate = vi.fn();
  const store = new FormStore(forceRootUpdate);
  const form = store.getForm();
  // ⭐ 先挂钩：`getInternalHooks(HOOK_MARK)` 会把 `formHooked` 置 true，
  //    避免 `warningUnhooked` 的定时器在测试里打「没接到 Form 上」的告警。
  const hooks = store.getInternalHooks(HOOK_MARK);
  if (!hooks) {
    throw new Error('getInternalHooks 返回 null —— 钥匙必须是 HOOK_MARK');
  }
  return { store, form, hooks, forceRootUpdate };
}

/**
 * 等一个宏任务 —— `WatcherCenter` 用 `MessageChannel` 投递。
 *
 * ⚠️⚠️ **必须等两个 `setTimeout` 回合**（2026-09-19 实测，见 `PITFALLS.md` 第 82 条）：
 * 原实现只等一个 `setTimeout(0)`，并假设「`MessageChannel` 一定在它之前投递」。
 * 在 CPU 繁忙时（同批多文件 + `--coverage`）这个顺序会**翻转** ⇒
 * `notifyWatch 拿到的是本次变更的路径` 偶发拿到 `[]`。
 *
 * 两个回合的依据：`MessageChannel` / `MessagePort` 的回调在事件循环的 **poll 或
 * check 阶段**投递，而 `setTimeout` 在 **timers 阶段** ⇒ 两个 timer 之间必然经过
 * 一整轮 poll + check，`MessageChannel` 的回调不可能还没跑。
 *
 * ⭐ 这不是放宽断言 —— 断言一个字没改，只是把「等一等」做得可靠。
 */
async function flushMacroTask(): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

// ---------------------------------------------------------------------------
// getForm / getInternalHooks
// ---------------------------------------------------------------------------

describe('FormStore · 实例与挂钩', () => {
  it('getForm() 带 _init: true，两次调用是不同对象但方法引用相同', () => {
    const { store, form } = createStore();
    const second = store.getForm();

    expect(isFormInstance(form)).toBe(true);
    expect(form).not.toBe(second);
    expect(form.getFieldValue).toBe(second.getFieldValue);
    expect(form.validateFields).toBe(second.validateFields);
  });

  it('getInternalHooks(非 HOOK_MARK) ⇒ null 且 dev 告警（不抛错）', () => {
    const { store } = createStore();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(store.getInternalHooks('WRONG_KEY')).toBeNull();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(String(spy.mock.calls[0]?.[0])).toContain('getInternalHooks');

    spy.mockRestore();
  });

  it('getInternalHooks(HOOK_MARK) 返回全部 12 个内部挂钩', () => {
    const { hooks } = createStore();
    expect(Object.keys(hooks).sort()).toEqual(
      [
        'destroyForm',
        'dispatch',
        'getFields',
        'getInitialValue',
        'initEntityValue',
        'registerField',
        'registerWatch',
        'setCallbacks',
        'setInitialValues',
        'setPreserve',
        'setValidateMessages',
        'useSubscribe',
      ].sort(),
    );
  });
});

// ---------------------------------------------------------------------------
// setInitialValues / getInitialValue
// ---------------------------------------------------------------------------

describe('FormStore · initialValues', () => {
  it('init = true 时把初值灌进 store', () => {
    const { store, hooks } = createStore();
    hooks.setInitialValues({ a: 1, b: { c: 2 } }, true);

    expect(store.getForm().getFieldsValue(true)).toEqual({ a: 1, b: { c: 2 } });
  });

  it('init = false 时只记初值，不动 store（上游 `:150-162`）', () => {
    const { store, hooks } = createStore();
    hooks.setInitialValues({ a: 1 }, false);

    expect(store.getForm().getFieldsValue(true)).toEqual({});
    expect(hooks.getInitialValue(['a'])).toBe(1);
  });

  it('⭐ getInitialValue 带路径时**克隆**，不带路径时返回引用', () => {
    const { hooks } = createStore();
    const nested = { c: 2 };
    hooks.setInitialValues({ a: nested }, true);

    const cloned = hooks.getInitialValue(['a']);
    expect(cloned).toEqual({ c: 2 });
    expect(cloned).not.toBe(nested);

    expect(hooks.getInitialValue([])).toEqual({ a: nested });
  });

  it('init = true 时已有 store 值优先于 initialValues（`merge(initialValues, store)`）', () => {
    const { store, hooks, form } = createStore();
    form.setFieldsValue({ a: 'from-store' });
    hooks.setInitialValues({ a: 'from-init' }, true);

    expect(store.getForm().getFieldsValue(true).a).toBe('from-store');
  });
});

// ---------------------------------------------------------------------------
// getFieldsValue 的四种入参
// ---------------------------------------------------------------------------

describe('FormStore · getFieldsValue', () => {
  it('无参 ⇒ 只含**已注册字段**的值', () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: 1, b: 2, c: 3 }, true);
    hooks.registerField(createField(['a']).entity);

    expect(form.getFieldsValue()).toEqual({ a: 1 });
  });

  it('⭐ getFieldsValue(true) ⇒ 直接返回 store 的**引用**（不拷贝）', () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: 1, unregistered: 2 }, true);

    const values = form.getFieldsValue(true);
    expect(values).toEqual({ a: 1, unregistered: 2 });
    // 改它会影响表单 —— 这正是上游的契约（§4.7.3）
    values.a = 999;
    expect(form.getFieldValue('a')).toBe(999);
  });

  it('⭐ getFieldsValue(true, filter) 走**过滤**分支（不再短路返回引用）', () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: 1, b: 2 }, true);
    hooks.registerField(createField(['a']).entity);

    const values = form.getFieldsValue(true, (meta) => meta?.name[0] === 'a');
    expect(values).toEqual({ a: 1 });
    expect(values).not.toBe(form.getFieldsValue(true));
  });

  it('传路径数组 ⇒ 只取这些路径', () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: 1, b: 2, c: 3 }, true);

    expect(form.getFieldsValue([['a'], ['c']])).toEqual({ a: 1, c: 3 });
  });

  it('传 { filter } ⇒ 按 meta 过滤；⭐ 哨兵实体拿到 null', () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: 1 }, true);
    const fieldA = createField(['a']);
    fieldA.setTouched(true);
    hooks.registerField(fieldA.entity);

    const seen: (string | null)[] = [];
    form.getFieldsValue({
      filter: (meta) => {
        seen.push(meta ? String(meta.name[0]) : null);
        return true;
      },
    });
    expect(seen).toEqual(['a']);

    // 未注册的路径 ⇒ 哨兵 ⇒ meta 为 null
    const seen2: (string | null)[] = [];
    form.getFieldsValue([['a'], ['nope']], (meta) => {
      seen2.push(meta ? String(meta.name[0]) : null);
      return true;
    });
    expect(seen2).toEqual(['a', null]);
  });

  it('⭐ isList() 的字段不进 filteredNameList，且空 List 补 []', () => {
    const { form, hooks } = createStore();
    const listField = createField(['users'], { isList: true, isListField: true });
    hooks.registerField(listField.entity);

    expect(form.getFieldsValue()).toEqual({ users: [] });
  });

  it('⭐ 只注册 List 字段时值恒为 []（List 路径不在 filteredNameList 里，clone 不出来）', () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ users: [{ name: 'x' }] }, true);
    hooks.registerField(createField(['users'], { isList: true, isListField: true }).entity);

    // ⚠️ 上游 `:337-340` 把 List 路径**单独**收进 listNamePaths，不进 filteredNameList；
    //    `mergedValues` 只由 filteredNameList 拼出 ⇒ 拿不到 List 的值 ⇒ 落到「补 []」分支。
    //    真实用法里 List 的**子字段**是注册过的，值由子字段拼出来（见下一条）。
    expect(form.getFieldsValue()).toEqual({ users: [] });
  });

  it('⭐ 注册了子字段后，List 的值由**子字段**拼出（不再被覆盖成 []）', () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ users: [{ name: 'x' }] }, true);
    hooks.registerField(createField(['users'], { isList: true, isListField: true }).entity);
    hooks.registerField(createField(['users', 0, 'name'], { isListField: true }).entity);

    expect(form.getFieldsValue()).toEqual({ users: [{ name: 'x' }] });
  });
});

// ---------------------------------------------------------------------------
// getFieldValue / getFieldsError / getFieldError / getFieldWarning
// ---------------------------------------------------------------------------

describe('FormStore · 取值与错误', () => {
  it('getFieldValue 走 namePath（含嵌套与数字键）', () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: { b: [{ c: 7 }] } }, true);

    expect(form.getFieldValue(['a', 'b', 0, 'c'])).toBe(7);
    expect(form.getFieldValue('a')).toEqual({ b: [{ c: 7 }] });
  });

  it('getFieldsError 从实体读 errors / warnings', () => {
    const { form, hooks } = createStore();
    const field = createField(['a']);
    field.setErrors(['必填']);
    field.setWarnings(['建议填']);
    hooks.registerField(field.entity);

    expect(form.getFieldsError()).toEqual([
      { name: ['a'], errors: ['必填'], warnings: ['建议填'] },
    ]);
    expect(form.getFieldError('a')).toEqual(['必填']);
    expect(form.getFieldWarning('a')).toEqual(['建议填']);
  });

  it('⭐ 未注册的路径 ⇒ errors/warnings 都是空数组（不是 undefined）', () => {
    const { form } = createStore();

    expect(form.getFieldsError([['nope']])).toEqual([{ name: ['nope'], errors: [], warnings: [] }]);
    expect(form.getFieldError('nope')).toEqual([]);
    expect(form.getFieldWarning('nope')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// isFieldsTouched 的变参矩阵
// ---------------------------------------------------------------------------

describe('FormStore · isFieldsTouched 变参矩阵（上游 `:289-358`）', () => {
  function setup() {
    const ctx = createStore();
    const a = createField(['a']);
    const b = createField(['b']);
    const list = createField(['users'], { isList: true, isListField: true });
    ctx.hooks.registerField(a.entity);
    ctx.hooks.registerField(b.entity);
    ctx.hooks.registerField(list.entity);
    return { ...ctx, a, b, list };
  }

  it('0 个参数 ⇒ 「有任一 touched」', () => {
    const { form, a } = setup();
    expect(form.isFieldsTouched()).toBe(false);
    a.setTouched(true);
    expect(form.isFieldsTouched()).toBe(true);
  });

  it('1 个数组 ⇒ 这些路径里「有任一 touched」', () => {
    const { form, b } = setup();
    expect(form.isFieldsTouched([['a']])).toBe(false);
    b.setTouched(true);
    expect(form.isFieldsTouched([['a']])).toBe(false);
    expect(form.isFieldsTouched([['a'], ['b']])).toBe(true);
  });

  it('1 个布尔 ⇒ 全部字段「全部 touched」', () => {
    const { form, a, b } = setup();
    // ⚠️ `isFieldsTouched(false)` **等价于**「有任一 touched」——
    //    变参表里 `isAll = arg0`，`false` 就走 `some`（上游 `:300-317`）。
    //    第一版把这里写成 `false`，被红灯纠正。
    expect(form.isFieldsTouched(false)).toBe(false);
    a.setTouched(true);
    expect(form.isFieldsTouched(false)).toBe(true);
    expect(form.isFieldsTouched(true)).toBe(false); // b 还没 touched
    b.setTouched(true);
    expect(form.isFieldsTouched(true)).toBe(true);
  });

  it('2 个参数 ⇒ (nameList, allFieldsTouched)', () => {
    const { form, a, b } = setup();
    a.setTouched(true);
    b.setTouched(true);
    expect(form.isFieldsTouched([['a']], true)).toBe(true);
    expect(form.isFieldsTouched([['a'], ['b']], true)).toBe(true);
    b.setTouched(false);
    expect(form.isFieldsTouched([['a']], true)).toBe(true);
    expect(form.isFieldsTouched([['a'], ['b']], true)).toBe(false);
  });

  it('⭐ isList() 的字段在「全部 touched」模式下**视为已 touched**', () => {
    const { form, a, b } = setup();
    a.setTouched(true);
    b.setTouched(true);
    // list 从没 touched 过，但因为 isList() 而被豁免
    expect(form.isFieldsTouched(true)).toBe(true);
  });

  it('isFieldTouched 走前缀匹配（路径 a 命中 a.b）', () => {
    const { form, hooks } = createStore();
    const nested = createField(['a', 'b']);
    nested.setTouched(true);
    hooks.registerField(nested.entity);

    expect(form.isFieldTouched('a')).toBe(true);
    expect(form.isFieldTouched(['a', 'b'])).toBe(true);
    expect(form.isFieldTouched('nope')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isFieldsValidating 的不对称
// ---------------------------------------------------------------------------

describe('FormStore · isFieldsValidating', () => {
  it('⭐ 用**全部**字段（含 name 为 [] 的匿名字段），与 isFieldsTouched 不对称', () => {
    const { form, hooks } = createStore();
    const anonymous = createField([]);
    anonymous.setValidating(true);
    hooks.registerField(anonymous.entity);

    expect(form.isFieldsValidating()).toBe(true);
    // isFieldsTouched 用的是 getFieldEntities(true)（只含有 name 的）⇒ 看不到它
    expect(form.isFieldsTouched()).toBe(false);
  });

  it('有 nameList 时按包含关系判定', () => {
    const { form, hooks } = createStore();
    const a = createField(['a']);
    hooks.registerField(a.entity);

    expect(form.isFieldValidating('a')).toBe(false);
    a.setValidating(true);
    expect(form.isFieldsValidating([['a']])).toBe(true);
    expect(form.isFieldsValidating([['other']])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// registerField / 注销 / initEntityValue
// ---------------------------------------------------------------------------

describe('FormStore · registerField', () => {
  it('initEntityValue 在 store 里没有该路径时写入 initialValue', () => {
    const { store, hooks } = createStore();
    const field = createField(['a'], { initialValue: 42 });
    hooks.initEntityValue(field.entity);

    expect(store.getForm().getFieldValue('a')).toBe(42);
  });

  it('initEntityValue 不覆盖已有的 store 值', () => {
    const { store, hooks } = createStore();
    hooks.setInitialValues({ a: 'kept' }, true);
    hooks.initEntityValue(createField(['a'], { initialValue: 'ignored' }).entity);

    expect(store.getForm().getFieldValue('a')).toBe('kept');
  });

  it('⭐ 注册带 initialValue 的字段会立即写值并通知（`registerField:629-641`）', () => {
    const { form, hooks } = createStore();
    const field = createField(['a'], { initialValue: 7 });
    hooks.registerField(field.entity);

    expect(form.getFieldValue('a')).toBe(7);
    expect(field.storeChanges).toHaveLength(1);
    expect(field.storeChanges[0]?.info.type).toBe('valueUpdate');
  });

  it('注销后 getFieldsValue 不再包含该字段', () => {
    const { form, hooks } = createStore();
    const field = createField(['a'], { initialValue: 1 });
    const cancel = hooks.registerField(field.entity);
    expect(form.getFieldsValue()).toEqual({ a: 1 });

    cancel();
    expect(form.getFieldsValue()).toEqual({});
  });

  it('⭐ 注销时 preserve === false ⇒ 清掉 store 里的值', () => {
    const { form, hooks } = createStore();
    const field = createField(['a'], { initialValue: 1, preserve: false });
    const cancel = hooks.registerField(field.entity);
    expect(form.getFieldValue('a')).toBe(1);

    cancel(undefined, false);
    expect(form.getFieldValue('a')).toBeUndefined();
  });

  it('⭐ 注销时 preserve === false 但有同路径字段仍在 ⇒ **不清值**（`:652`）', () => {
    const { form, hooks } = createStore();
    const first = createField(['a'], { initialValue: 1, preserve: false });
    const second = createField(['a']);
    const cancelFirst = hooks.registerField(first.entity);
    hooks.registerField(second.entity);

    cancelFirst(undefined, false);
    expect(form.getFieldValue('a')).toBe(1);
  });

  it('isMergedPreserve：字段未指定时回落到表单级 preserve（默认 true）', () => {
    const { form, hooks } = createStore();
    const field = createField(['a'], { initialValue: 1 });
    const cancel = hooks.registerField(field.entity);

    cancel(); // preserve 未传 ⇒ 用表单级（null ⇒ true）⇒ 不清值
    expect(form.getFieldValue('a')).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// setFields / prevStore 批前语义
// ---------------------------------------------------------------------------

describe('FormStore · setFields', () => {
  it('写值 + 逐个字段通知 setField', () => {
    const { form, hooks } = createStore();
    const a = createField(['a']);
    hooks.registerField(a.entity);

    form.setFields([{ name: 'a', value: 1 }]);
    expect(form.getFieldValue('a')).toBe(1);
    expect(a.storeChanges.at(-1)?.info.type).toBe('setField');
  });

  it('⭐ prevStore 在循环外只取一次 ⇒ 同一批里每个通知拿到的都是**批前** store', () => {
    const { form, hooks } = createStore();
    const a = createField(['a']);
    const b = createField(['b']);
    hooks.registerField(a.entity);
    hooks.registerField(b.entity);

    const prevStores: unknown[] = [];
    // ⚠️ 记的是**第一个形参**（`prevStore`），不是 `info.store`。
    //    `notifyObservers` 里 `info.store = getFieldsValue(true)` 是**当前** store
    //    （每次通知都不同），而 `prevStore` 才是「批前」的那个（`setFields:582` 循环外只取一次）。
    a.entity.onStoreChange = (store) => {
      prevStores.push(store);
    };
    b.entity.onStoreChange = (store) => {
      prevStores.push(store);
    };

    form.setFields([
      { name: 'a', value: 1 },
      { name: 'b', value: 2 },
    ]);

    // `notifyObservers` 会遍历**全部**实体 ⇒ 2 个字段 × 2 个实体 = 4 次通知
    expect(prevStores).toHaveLength(4);
    // ⭐ 4 次拿到的都是**同一个**批前 store 引用（此时还不含 a、b）
    expect(new Set(prevStores).size).toBe(1);
    expect(prevStores[0]).toEqual({});
    // 而最终 store 里两个值都在
    expect(form.getFieldsValue(true)).toEqual({ a: 1, b: 2 });
  });

  it('setFields 只写 data 里**有** value 的字段', () => {
    const { form, hooks } = createStore();
    hooks.registerField(createField(['a']).entity);

    form.setFields([{ name: 'a', value: 1 }]);
    form.setFields([{ name: 'a', errors: ['e'] }]);
    expect(form.getFieldValue('a')).toBe(1);
    expect(form.getFieldError('a')).toEqual([]); // 替身不从 data 读 errors
  });
});

// ---------------------------------------------------------------------------
// updateValue 的六步联动链
// ---------------------------------------------------------------------------

describe('FormStore · updateValue 联动链（上游 `:622-646`）', () => {
  // ⚠️⚠️ 触发方式必须是 `dispatch({type:'updateValue'})`，**不是** `setFieldsValue`。
  //     `setFieldsValue` 直接走 `notifyObservers(external)`，**不经过** `updateValue`
  //     ⇒ 不会调 `onValuesChange`、也不会 `triggerDependenciesUpdate`。
  //     真实链路里 `updateValue` 由 `Field` 的受控事件处理函数 `dispatch` 触发。
  //     这一条是写测试时被**红灯**纠正的（第一版全用了 `setFieldsValue`）。

  it('dispatch(updateValue) 触发 onValuesChange，changedValues 只含变更的键', () => {
    const { hooks } = createStore();
    hooks.registerField(createField(['a']).entity);

    const calls: unknown[] = [];
    hooks.setCallbacks({
      onValuesChange: (changed, all) => {
        calls.push([changed, all]);
      },
    });

    hooks.dispatch({ type: 'updateValue', namePath: ['a'], value: 1 });
    expect(calls).toEqual([[{ a: 1 }, { a: 1 }]]);
  });

  it('⭐ allValues 的补偿：刚变更的字段**未注册**时也会补进去', () => {
    const { hooks } = createStore();
    hooks.registerField(createField(['a']).entity);

    const calls: { changed: unknown; all: unknown }[] = [];
    hooks.setCallbacks({
      onValuesChange: (changed, all) => {
        calls.push({ changed, all });
      },
    });

    hooks.dispatch({ type: 'updateValue', namePath: ['b'], value: 2 });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.changed).toEqual({ b: 2 });
    // getFieldsValue() 只有已注册的 a ⇒ 不补偿的话 b 会缺
    expect(calls[0]?.all).toEqual({ a: undefined, b: 2 });
  });

  it('⭐ notifyWatch 拿到的是本次变更的路径', async () => {
    const { hooks } = createStore();
    hooks.registerField(createField(['a']).entity);

    const seen: InternalNamePath[][] = [];
    hooks.registerWatch((_values, _allValues, namePathList) => {
      seen.push(namePathList);
    });

    hooks.dispatch({ type: 'updateValue', namePath: ['a'], value: 1 });
    await flushMacroTask();
    expect(seen).toEqual([[['a']]]);
  });

  it('⭐ triggerDependenciesUpdate：依赖已变更且子字段 dirty ⇒ 触发子字段校验', () => {
    const { hooks } = createStore();
    hooks.registerField(createField(['a']).entity);

    // ⚠️ 子字段**必须有 rules**：收集阶段会跳过「没有 rules」的字段（上游 `:781-784`）
    const child = createField(['b'], { dependencies: ['a'], rules: [{ required: true }] });
    child.setDirty(true);
    hooks.registerField(child.entity);

    hooks.dispatch({ type: 'updateValue', namePath: ['a'], value: 1 });

    expect(child.validateCalls.length).toBeGreaterThan(0);
  });

  it('⭐ 子字段**不脏**时不触发校验（`isFieldDirty()` 是门）', () => {
    const { hooks } = createStore();
    hooks.registerField(createField(['a']).entity);

    const child = createField(['b'], { dependencies: ['a'], rules: [{ required: true }] });
    hooks.registerField(child.entity); // 没 setDirty

    hooks.dispatch({ type: 'updateValue', namePath: ['a'], value: 1 });

    expect(child.validateCalls).toHaveLength(0);
  });

  it('⭐ 依赖链 a ← b ← c：改 a 会一路传下去', () => {
    const { hooks } = createStore();
    hooks.registerField(createField(['a']).entity);

    const b = createField(['b'], { dependencies: ['a'], rules: [{ required: true }] });
    b.setDirty(true);
    const c = createField(['c'], { dependencies: ['b'], rules: [{ required: true }] });
    c.setDirty(true);
    hooks.registerField(b.entity);
    hooks.registerField(c.entity);

    hooks.dispatch({ type: 'updateValue', namePath: ['a'], value: 1 });

    expect(b.validateCalls.length).toBeGreaterThan(0);
    expect(c.validateCalls.length).toBeGreaterThan(0);
  });

  it('setFieldsValue 触发 external 的 valueUpdate 通知', () => {
    const { form, hooks } = createStore();
    const a = createField(['a']);
    hooks.registerField(a.entity);

    form.setFieldsValue({ a: 1 });
    const info = a.storeChanges.at(-1)?.info;
    expect(info?.type).toBe('valueUpdate');
    expect((info as { source?: string }).source).toBe('external');
  });
});

// ---------------------------------------------------------------------------
// resetFields
// ---------------------------------------------------------------------------

describe('FormStore · resetFields', () => {
  it('无参 ⇒ 回到 initialValues 并发 reset 通知', () => {
    const { form, hooks } = createStore();
    const a = createField(['a']);
    hooks.registerField(a.entity);
    hooks.setInitialValues({ a: 'init' }, true);
    form.setFieldsValue({ a: 'changed' });

    form.resetFields();
    expect(form.getFieldValue('a')).toBe('init');
    expect(a.storeChanges.at(-1)?.info.type).toBe('reset');
  });

  it('传路径 ⇒ 只重置这些路径', () => {
    const { form, hooks } = createStore();
    hooks.registerField(createField(['a']).entity);
    hooks.registerField(createField(['b']).entity);
    hooks.setInitialValues({ a: 'init-a', b: 'init-b' }, true);
    form.setFieldsValue({ a: 'x', b: 'y' });

    form.resetFields([['a']]);
    expect(form.getFieldValue('a')).toBe('init-a');
    expect(form.getFieldValue('b')).toBe('y');
  });

  it('⭐ 无参 reset 时 initialValues 里没有的路径被清掉', () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: 1 }, true);
    form.setFieldsValue({ extra: 'gone' });

    form.resetFields();
    expect(form.getFieldValue('extra')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// validateFields
// ---------------------------------------------------------------------------

describe('FormStore · validateFields', () => {
  it('无 rules 的字段不产生 promise（不调 validateRules）', async () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: 1 }, true);
    const field = createField(['a']); // 没有 rules
    hooks.registerField(field.entity);

    await form.validateFields();
    expect(field.validateCalls).toHaveLength(0);
  });

  it('全部通过 ⇒ resolve 出被校验路径的值', async () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: 1, other: 'x' }, true);
    const field = createField(['a'], { rules: [{ required: true }] });
    hooks.registerField(field.entity);

    await expect(form.validateFields()).resolves.toEqual({ a: 1 });
  });

  it('⭐ 失败 ⇒ reject { message, values, errorFields, outOfDate }', async () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: '' }, true);
    const field = createField(['a'], {
      rules: [{ required: true }],
      validateRules: () => Promise.reject([{ errors: ['必填'], rule: { required: true } }]),
    });
    hooks.registerField(field.entity);

    await expect(form.validateFields()).rejects.toEqual({
      message: '必填',
      values: { a: '' },
      errorFields: [{ name: ['a'], errors: ['必填'], warnings: [] }],
      outOfDate: false,
    });
  });

  it('⭐ warningOnly 的规则错误进 warnings，整体仍算通过', async () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: '' }, true);
    const field = createField(['a'], {
      rules: [{ required: true }],
      validateRules: () =>
        Promise.reject([{ errors: ['建议填'], rule: { required: true, warningOnly: true } }]),
    });
    hooks.registerField(field.entity);

    await expect(form.validateFields()).resolves.toEqual({ a: '' });

    // ⭐ 走 validateFinish 通知把 warnings 交回给 Field（这里是替身，直接看 info）
    const last = field.storeChanges.at(-1);
    expect(last?.info.type).toBe('validateFinish');
  });

  it('⭐ dirty: true 跳过未脏字段（`isFieldDirty()` 为门）', async () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: 1 }, true);
    const clean = createField(['a'], { rules: [{ required: true }] });
    const dirty = createField(['b'], { rules: [{ required: true }] });
    dirty.setDirty(true);
    hooks.registerField(clean.entity);
    hooks.registerField(dirty.entity);

    await form.validateFields({ dirty: true });
    expect(clean.validateCalls).toHaveLength(0);
    expect(dirty.validateCalls).toHaveLength(1);
  });

  it('⭐⭐ 并发作废：旧的一次被 reject，且 rejection 值是**被后续 catch 改写过的**对象', async () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: 1 }, true);

    const deferreds: ((value: RuleError[]) => void)[] = [];
    const field = createField(['a'], {
      rules: [{ required: true }],
      validateRules: () =>
        new Promise<RuleError[]>((resolve) => {
          deferreds.push(resolve);
        }),
    });
    hooks.registerField(field.entity);

    const first = form.validateFields();
    const second = form.validateFields();
    expect(deferreds).toHaveLength(2);

    deferreds[1]?.([]);
    await expect(second).resolves.toEqual({ a: 1 });

    deferreds[0]?.([]);
    // ⭐⭐ 契约 §4.7.5 曾把这里写成「reject([])」—— **读源码读漏了一层**。
    //    上游 `:869-879` 是：
    //      `summaryPromise.then(() => { …; return Promise.reject([]); })
    //                     .catch(results => { …; return Promise.reject({…}); })`
    //    那句 `Promise.reject([])` 会**立刻被紧随其后的 `.catch` 接住**，
    //    于是最终 rejection 值是 `{ message: undefined, errorFields: [], outOfDate: true }`。
    //    这不是我们改的，是上游的真实行为（可以说是上游的 bug），**照抄**。
    //    这条断言是**红灯纠正契约**的产物。
    await expect(first).rejects.toEqual({
      message: undefined,
      values: { a: 1 },
      errorFields: [],
      outOfDate: true,
    });
  });

  it('⭐⭐ 上游 wart：`validateFields("a")` 会**同步抛 TypeError**（判据允许字符串，实现却调 `.map`）', () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: 1 }, true);
    hooks.registerField(createField(['a'], { rules: [{ required: true }] }).entity);

    // 上游 `:743-748` 的判据里有 `typeof arg1 === 'string'`，但 `:749` 直接
    // `nameList.map(getNamePath)` —— 字符串没有 `.map`。这是**上游的真实缺陷**。
    // 我们的实现逐字对应，故同样抛错；测试把它钉住，避免后人"顺手修好"。
    //
    // ⚠️ `@ts-expect-error` 在这里是**负例**用法（`TESTING.md` T7 允许的唯一场景）：
    //    上游的 `InternalValidateFields` 根本没有字符串重载 ⇒ 这句在类型层面就该报错。
    //    它同时钉住「类型不接受、运行时也炸」这个双重事实。
    // @ts-expect-error 字符串不是合法的 nameList
    expect(() => form.validateFields('a')).toThrow(TypeError);
  });

  it('⭐ 失败时的 outOfDate：被更新的校验取代后为 true', async () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: '' }, true);

    const deferreds: {
      resolve: (value: RuleError[]) => void;
      reject: (reason: RuleError[]) => void;
    }[] = [];
    const field = createField(['a'], {
      rules: [{ required: true }],
      validateRules: () =>
        new Promise<RuleError[]>((resolve, reject) => {
          deferreds.push({ resolve, reject });
        }),
    });
    hooks.registerField(field.entity);

    const first = form.validateFields();
    const second = form.validateFields();

    // 第二次先失败 ⇒ 第二次的 outOfDate 为 false
    deferreds[1]?.reject([{ errors: ['必填'], rule: { required: true } }]);
    await expect(second).rejects.toMatchObject({ outOfDate: false });

    // 第一次随后失败 ⇒ 它已被取代 ⇒ outOfDate 为 true
    deferreds[0]?.reject([{ errors: ['必填'], rule: { required: true } }]);
    await expect(first).rejects.toMatchObject({ outOfDate: true });
  });

  it('validateFields 从不抛同步异常（失败只以 rejected promise 表达）', () => {
    const { form, hooks } = createStore();
    const field = createField(['a'], {
      rules: [{ required: true }],
      validateRules: () => Promise.reject([{ errors: ['x'], rule: {} }]),
    });
    hooks.registerField(field.entity);

    let promise: Promise<unknown> | undefined;
    expect(() => {
      promise = form.validateFields();
    }).not.toThrow();
    void promise?.catch(() => {});
  });

  it('⭐ 传路径数组时只校验这些路径', async () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: 1, b: 2 }, true);
    const a = createField(['a'], { rules: [{ required: true }] });
    const b = createField(['b'], { rules: [{ required: true }] });
    hooks.registerField(a.entity);
    hooks.registerField(b.entity);

    await form.validateFields([['a']]);
    expect(a.validateCalls).toHaveLength(1);
    expect(b.validateCalls).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// submit
// ---------------------------------------------------------------------------

describe('FormStore · submit', () => {
  it('成功 ⇒ 调 onFinish(values)', async () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: 1 }, true);
    hooks.registerField(createField(['a'], { rules: [{ required: true }] }).entity);

    const onFinish = vi.fn();
    hooks.setCallbacks({ onFinish });

    form.submit();
    await flushMacroTask();
    await flushMacroTask();

    expect(onFinish).toHaveBeenCalledWith({ a: 1 });
  });

  it('失败 ⇒ 调 onFinishFailed(errorInfo)', async () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: '' }, true);
    hooks.registerField(
      createField(['a'], {
        rules: [{ required: true }],
        validateRules: () => Promise.reject([{ errors: ['必填'], rule: { required: true } }]),
      }).entity,
    );

    const onFinishFailed = vi.fn();
    hooks.setCallbacks({ onFinishFailed });

    form.submit();
    await flushMacroTask();
    await flushMacroTask();

    expect(onFinishFailed).toHaveBeenCalledTimes(1);
    expect(onFinishFailed.mock.calls[0]?.[0]).toMatchObject({ message: '必填' });
  });
});

// ---------------------------------------------------------------------------
// destroyForm / setPreserve / useSubscribe
// ---------------------------------------------------------------------------

describe('FormStore · 生命周期与开关', () => {
  it('clearOnDestroy ⇒ 清空 store', () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: 1 }, true);

    hooks.destroyForm(true);
    expect(form.getFieldsValue(true)).toEqual({});
  });

  it('⭐ 不 clear 时记录 preserve === false 的字段，下次 init 用 initialValues 回填', () => {
    const { form, hooks } = createStore();
    const field = createField(['a'], { preserve: false });
    hooks.registerField(field.entity);
    hooks.setInitialValues({ a: 'init' }, true);
    form.setFieldsValue({ a: 'changed' });

    hooks.destroyForm(false);
    // 模拟「下一个 Form 挂载」：store 里还留着旧值，但 prevWithoutPreserves 要求用初值回填
    hooks.setInitialValues({ a: 'init' }, true);

    expect(form.getFieldValue('a')).toBe('init');
  });

  it('subscribable = false ⇒ 只调 forceRootUpdate，不逐个通知字段', () => {
    const { form, hooks, forceRootUpdate } = createStore();
    const a = createField(['a']);
    hooks.registerField(a.entity);
    hooks.useSubscribe(false);

    form.setFieldsValue({ a: 1 });
    expect(forceRootUpdate).toHaveBeenCalled();
    expect(a.storeChanges).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// WatcherCenter
// ---------------------------------------------------------------------------

describe('WatcherCenter', () => {
  it('macroTask 在宏任务里执行（不是同步）', async () => {
    const order: string[] = [];
    macroTask(() => {
      order.push('macro');
    });
    order.push('sync');
    await flushMacroTask();
    expect(order).toEqual(['sync', 'macro']);
  });

  it('⭐ 同一批内多次 notify 只触发**一次**回调', async () => {
    const center = new WatcherCenter({ getForm: () => ({ getFieldsValue: () => ({}) }) as never });
    const watcher = vi.fn();
    center.register(watcher);

    center.notify([['a']]);
    center.notify([['b']]);
    center.notify([['c']]);
    await flushMacroTask();

    expect(watcher).toHaveBeenCalledTimes(1);
  });

  it('⭐ 去重：同一批里重复的 namePath 只保留一份（顺序保留）', async () => {
    const center = new WatcherCenter({ getForm: () => ({ getFieldsValue: () => ({}) }) as never });
    const seen: InternalNamePath[][] = [];
    center.register((_v, _a, namePathList) => {
      seen.push([...namePathList]);
    });

    center.notify([['a'], ['b']]);
    center.notify([['a'], ['c']]);
    await flushMacroTask();

    expect(seen).toEqual([[['a'], ['b'], ['c']]]);
  });

  it('⭐ 执行后清空 namePathList', async () => {
    const center = new WatcherCenter({ getForm: () => ({ getFieldsValue: () => ({}) }) as never });
    center.register(() => {});
    center.notify([['a']]);
    expect(center.namePathList).toEqual([['a']]);
    await flushMacroTask();
    expect(center.namePathList).toEqual([]);
  });

  it('⭐ 没有 watcher 时不执行，且 namePathList **不清空**（留给下一个有效批次）', async () => {
    const center = new WatcherCenter({ getForm: () => ({ getFieldsValue: () => ({}) }) as never });
    center.notify([['a']]);
    await flushMacroTask();

    expect(center.namePathList).toEqual([['a']]);

    const seen: InternalNamePath[][] = [];
    center.register((_v, _a, namePathList) => {
      seen.push([...namePathList]);
    });
    center.notify([['b']]);
    await flushMacroTask();

    expect(seen).toEqual([[['a'], ['b']]]);
  });

  it('register 返回的取消函数能摘掉 watcher', async () => {
    const center = new WatcherCenter({ getForm: () => ({ getFieldsValue: () => ({}) }) as never });
    const watcher = vi.fn();
    const cancel = center.register(watcher);

    cancel();
    center.notify([['a']]);
    await flushMacroTask();
    expect(watcher).not.toHaveBeenCalled();
  });

  it('回调拿到 (values, allValues, namePathList) 三元组', async () => {
    const center = new WatcherCenter({
      getForm: () =>
        ({ getFieldsValue: (all?: boolean) => (all ? { all: 1 } : { some: 1 }) }) as never,
    });
    const seen: unknown[][] = [];
    center.register((...args) => {
      seen.push(args);
    });

    center.notify([['a']]);
    await flushMacroTask();

    expect(seen).toEqual([[{ some: 1 }, { all: 1 }, [['a']]]]);
  });
});

// ---------------------------------------------------------------------------
// useForm
// ---------------------------------------------------------------------------

describe('useForm', () => {
  it('返回**元组**（`const [form] = useForm()` 可直接迁移）', () => {
    const result = useForm();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(isFormInstance(result[0])).toBe(true);
  });

  it('传入 form 时原样返回（不新建 store）', () => {
    const { form } = createStore();
    const [returned] = useForm(form);
    expect(returned).toBe(form);
  });

  it('⭐ 两次调用得到**不同**的 store（Vue 的 setup 只跑一次 ⇒ 无需 useRef 守卫）', () => {
    const [a] = useForm();
    const [b] = useForm();
    // ⚠️ 挂钩：`getInternalHooks(HOOK_MARK)` 把 `formHooked` 置 true，
    //    否则 `warningUnhooked` 的定时器会在**后续用例**里才触发，
    //    打出一条与当前用例无关的 stderr（测试噪声，不是失败）。
    //    ⚠️ `getInternalHooks` **不在**公开的 `FormInstance` 上（用户不该调），
    //    所以要先窄到 `InternalFormInstance`。
    (a as InternalFormInstance).getInternalHooks(HOOK_MARK);
    (b as InternalFormInstance).getInternalHooks(HOOK_MARK);

    expect(a).not.toBe(b);
    a.setFieldsValue({ x: 1 });
    expect(b.getFieldValue('x')).toBeUndefined();
  });

  it('⭐ 在组件 setup 里调用：`forceRootUpdate` 触发**该组件**重渲染', async () => {
    let renderCount = 0;
    const Comp = defineComponent({
      setup() {
        const [form] = useForm();
        // render-props 形态 ⇒ 通知只 bump 根组件
        (form as InternalFormInstance).getInternalHooks(HOOK_MARK)?.useSubscribe(false);
        return { form };
      },
      render() {
        renderCount += 1;
        return h('div');
      },
    });

    const wrapper = mount(Comp);
    expect(renderCount).toBe(1);

    (wrapper.vm as unknown as { form: FormInstance }).form.setFieldsValue({ a: 1 });
    await nextTick();
    // ⭐ 只有 `instance.proxy.$forceUpdate()` 这一支能走到这里（组件内 ⇒ instance 非空）
    expect(renderCount).toBe(2);

    wrapper.unmount();
  });

  it('⭐ 脱离组件实例时 `forceRootUpdate` 打 dev 告警（不是静默失败）', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const [form] = useForm();
    // `subscribable = false`（render-props 形态）才会走到 `forceRootUpdate`
    (form as InternalFormInstance).getInternalHooks(HOOK_MARK)?.useSubscribe(false);
    form.setFieldsValue({ a: 1 });

    expect(
      spy.mock.calls.some((call) => String(call[0]).includes('outside a component instance')),
    ).toBe(true);
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// useWatch
// ---------------------------------------------------------------------------

describe('useWatch', () => {
  it('路径型：初值 undefined，store 变化后同步', async () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: 1 }, true);
    hooks.registerField(createField(['a']).entity);

    const watched = useWatch('a', form);
    expect(watched.value).toBe(1);

    form.setFieldsValue({ a: 2 });
    await flushMacroTask();
    expect(watched.value).toBe(2);
  });

  it('选择器型：初值取 `dependencies({})`', () => {
    const { form } = createStore();
    const watched = useWatch((values: Record<string, unknown>) => `x-${values.a ?? 'none'}`, form);
    expect(watched.value).toBe('x-none');
  });

  it('⭐ 选择器型随 store 变化重算', async () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: 1, b: 2 }, true);
    hooks.registerField(createField(['a']).entity);
    hooks.registerField(createField(['b']).entity);

    const watched = useWatch(
      (values: Record<string, unknown>) => Number(values.a) + Number(values.b),
      form,
    );
    expect(watched.value).toBe(3);

    form.setFieldsValue({ a: 10 });
    await flushMacroTask();
    expect(watched.value).toBe(12);
  });

  it('⭐ 未监听的字段变化**不改** ref 的值（精确订阅）', async () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: 1, b: 2 }, true);
    hooks.registerField(createField(['a']).entity);
    hooks.registerField(createField(['b']).entity);

    const watched = useWatch('a', form);
    expect(watched.value).toBe(1);

    form.setFieldsValue({ b: 99 });
    await flushMacroTask();
    expect(watched.value).toBe(1);

    form.setFieldsValue({ a: 3 });
    await flushMacroTask();
    expect(watched.value).toBe(3);
  });

  it('⭐ preserve: true ⇒ 用 allValues（含未注册字段）', async () => {
    const { form, hooks } = createStore();
    hooks.registerField(createField(['a']).entity);

    const watched = useWatch('unregistered', { form, preserve: true });
    form.setFieldsValue({ unregistered: 'yes' });
    await flushMacroTask();

    expect(watched.value).toBe('yes');
  });

  it('⭐ 非 preserve 时读的是 `getFieldsValue()`（只有已注册字段）', async () => {
    const { form, hooks } = createStore();
    hooks.registerField(createField(['a']).entity);

    const watched = useWatch('unregistered', form);
    form.setFieldsValue({ unregistered: 'yes' });
    await flushMacroTask();

    expect(watched.value).toBeUndefined();
  });

  it('⭐ 嵌套路径', async () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ user: { name: 'a' } }, true);
    hooks.registerField(createField(['user', 'name']).entity);

    const watched = useWatch(['user', 'name'], form);
    expect(watched.value).toBe('a');

    form.setFieldsValue({ user: { name: 'b' } });
    await flushMacroTask();
    expect(watched.value).toBe('b');
  });

  it('⭐ 值未变时不写 ref（`stringify` 比较）', async () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: { x: 1 } }, true);
    hooks.registerField(createField(['a']).entity);

    const watched = useWatch('a', form);
    const before = watched.value;

    // 换一个**结构相同但引用不同**的对象 ⇒ stringify 相等 ⇒ 不写
    form.setFieldsValue({ a: { x: 1 } });
    await flushMacroTask();
    expect(watched.value).toBe(before);
  });

  it('⭐ 传 form 实例与传 { form } 等价（isFormInstance 判别）', async () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: 1 }, true);
    hooks.registerField(createField(['a']).entity);

    const viaInstance = useWatch('a', form);
    const viaOptions = useWatch('a', { form });
    expect(viaInstance.value).toBe(1);
    expect(viaOptions.value).toBe(1);

    form.setFieldsValue({ a: 5 });
    await flushMacroTask();
    expect(viaInstance.value).toBe(5);
    expect(viaOptions.value).toBe(5);
  });

  it('⚠️ 没有可用 form 实例时打 dev 告警（上游 `useWatch.js:38-40`）', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    useWatch('a');
    expect(
      spy.mock.calls.some((call) => String(call[0]).includes('useWatch requires a form instance')),
    ).toBe(true);
    spy.mockRestore();
  });

  it('⚠️ 显式传第二个实参（哪怕是 undefined）时**不**告警 —— 上游 `args.length === 2` 语义', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    useWatch('a', undefined);
    expect(spy.mock.calls.some((call) => String(call[0]).includes('useWatch requires'))).toBe(
      false,
    );
    spy.mockRestore();
  });

  it('onScopeDispose 摘掉 watcher：scope 停止后不再更新', async () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: 1 }, true);
    hooks.registerField(createField(['a']).entity);

    const scope = effectScope();
    const watched = scope.run(() => useWatch('a', form));
    expect(watched?.value).toBe(1);

    scope.stop();
    form.setFieldsValue({ a: 2 });
    await flushMacroTask();
    expect(watched?.value).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// stringify
// ---------------------------------------------------------------------------

describe('stringify', () => {
  it('可序列化值 ⇒ JSON 文本', () => {
    expect(stringify(1)).toBe('1');
    expect(stringify('a')).toBe('"a"');
    expect(stringify({ a: 1 })).toBe('{"a":1}');
    expect(stringify([1, 2])).toBe('[1,2]');
    expect(stringify(null)).toBe('null');
  });

  it('⭐ undefined / 函数 / Symbol ⇒ undefined（上游声明为 `string | number`，是声明没跟上实现）', () => {
    expect(stringify(undefined)).toBeUndefined();
    expect(stringify(() => {})).toBeUndefined();
    expect(stringify(Symbol('s'))).toBeUndefined();
  });

  it('⭐ 循环引用 ⇒ 抛错 ⇒ 回落到 Math.random()', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const result = stringify(circular);
    expect(typeof result).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// delayFrame
// ---------------------------------------------------------------------------

describe('delayFrame', () => {
  it('⭐ 先宏任务、再一帧，最后才 resolve（顺序不能反）', async () => {
    const order: string[] = [];
    const promise = delayFrame().then(() => {
      order.push('resolved');
    });
    order.push('sync');
    await promise;
    expect(order).toEqual(['sync', 'resolved']);
  });

  it('返回 Promise<void>', async () => {
    await expect(delayFrame()).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 默认 Context 兜底（`defaultFieldContext` / `defaultFormContext`）
// ---------------------------------------------------------------------------

describe('默认 Context 兜底', () => {
  it('⭐ 字段脱离 Form 时：每个方法都 dev 告警并返回 undefined（不抛错）', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(defaultFieldContext.getFieldValue('a')).toBeUndefined();
    expect(defaultFieldContext.getFieldsValue()).toBeUndefined();
    expect(defaultFieldContext.getFieldError('a')).toBeUndefined();
    expect(defaultFieldContext.getFieldWarning('a')).toBeUndefined();
    expect(defaultFieldContext.getFieldsError()).toBeUndefined();
    expect(defaultFieldContext.isFieldsTouched()).toBeUndefined();
    expect(defaultFieldContext.isFieldTouched('a')).toBeUndefined();
    expect(defaultFieldContext.isFieldValidating('a')).toBeUndefined();
    expect(defaultFieldContext.isFieldsValidating()).toBeUndefined();
    expect(defaultFieldContext.resetFields()).toBeUndefined();
    expect(defaultFieldContext.setFields([])).toBeUndefined();
    expect(defaultFieldContext.setFieldValue('a', 1)).toBeUndefined();
    expect(defaultFieldContext.setFieldsValue({})).toBeUndefined();
    expect(defaultFieldContext.validateFields()).toBeUndefined();
    expect(defaultFieldContext.submit()).toBeUndefined();

    expect(spy.mock.calls.length).toBeGreaterThan(0);
    expect(String(spy.mock.calls[0]?.[0])).toContain('Can not find FormContext');
    spy.mockRestore();
  });

  it('⭐ getInternalHooks 兜底也告警，并返回一整套告警桩', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const hooks = defaultFieldContext.getInternalHooks(HOOK_MARK);

    expect(hooks).not.toBeNull();
    // 每个挂钩都是同一个告警桩 ⇒ 调用只告警不抛错
    hooks?.setPreserve(false);
    hooks?.setValidateMessages({});
    hooks?.useSubscribe(true);
    hooks?.setInitialValues({}, true);
    hooks?.setCallbacks({});
    hooks?.destroyForm();
    hooks?.getFields();
    hooks?.getInitialValue(['a']);
    hooks?.initEntityValue(createField(['a']).entity);
    hooks?.dispatch({ type: 'validateField', namePath: ['a'], triggerName: 'onChange' });
    hooks?.registerField(createField(['a']).entity);
    hooks?.registerWatch(() => {});

    expect(spy.mock.calls.length).toBeGreaterThan(0);
    spy.mockRestore();
  });

  it('⭐ defaultFormContext 的四个协调方法都是 no-op（不抛错、无返回值）', () => {
    expect(defaultFormContext.triggerFormChange('f', [])).toBeUndefined();
    expect(defaultFormContext.triggerFormFinish('f', {})).toBeUndefined();
    expect(defaultFormContext.registerForm('f', {} as never)).toBeUndefined();
    expect(defaultFormContext.unregisterForm('f')).toBeUndefined();
    // `validateMessages` 是 undefined（不是 {}）—— Form 合并时靠展开语义
    expect(defaultFormContext.validateMessages).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 其余公开挂钩（覆盖率缺口补测：这些是**真实契约**，不是为覆盖率而写）
// ---------------------------------------------------------------------------

describe('FormStore · setPreserve / setValidateMessages / getFields / dispatch', () => {
  it('⭐ setPreserve(false) 成为字段级 preserve 未指定时的回落值', () => {
    const { form, hooks } = createStore();
    hooks.setPreserve(false);

    const field = createField(['a'], { initialValue: 1 }); // 字段级未指定 preserve
    const cancel = hooks.registerField(field.entity);
    expect(form.getFieldValue('a')).toBe(1);

    cancel(); // 未传 preserve ⇒ 用表单级的 false ⇒ 清值
    expect(form.getFieldValue('a')).toBeUndefined();
  });

  it('⭐ setValidateMessages 的模板会被合并进 Field 的校验选项', () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: '' }, true);
    hooks.setValidateMessages({ required: '自定义必填' });

    const field = createField(['a'], { rules: [{ required: true }] });
    hooks.registerField(field.entity);
    void form.validateFields();

    const options = field.validateCalls[0];
    expect(options?.validateMessages?.required).toBe('自定义必填');
  });

  it('⭐ getFields() 返回有 name 的字段的 FieldData（含 meta 与当前值）', () => {
    const { hooks } = createStore();
    hooks.setInitialValues({ a: 1 }, true);
    const field = createField(['a']);
    field.setTouched(true);
    field.setErrors(['e']);
    hooks.registerField(field.entity);
    hooks.registerField(createField([]).entity); // 无 name ⇒ 不进 getFields

    const fields = hooks.getFields();
    expect(fields).toHaveLength(1);
    expect(fields[0]).toMatchObject({
      name: ['a'],
      value: 1,
      touched: true,
      errors: ['e'],
      warnings: [],
    });
    // ⚠️ `originRCField` 是**不可枚举**的（`defineProperty` 没写 enumerable）
    expect(Object.keys(fields[0] ?? {})).not.toContain('originRCField');
    expect((fields[0] as { originRCField?: boolean }).originRCField).toBe(true);
  });

  it('⭐ dispatch({type:"validateField"}) 只校验那一个字段', () => {
    const { hooks } = createStore();
    hooks.setInitialValues({ a: 1, b: 2 }, true);
    const a = createField(['a'], { rules: [{ required: true }] });
    const b = createField(['b'], { rules: [{ required: true }] });
    hooks.registerField(a.entity);
    hooks.registerField(b.entity);

    hooks.dispatch({ type: 'validateField', namePath: ['a'], triggerName: 'onChange' });
    expect(a.validateCalls).toHaveLength(1);
    expect(a.validateCalls[0]?.triggerName).toBe('onChange');
    expect(b.validateCalls).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// ⭐ P3 PoC：plain store + 显式订阅（契约 §6.4.1 承诺的那两组行为断言）
// ---------------------------------------------------------------------------

describe('⭐ P3 PoC · plain store 不建立响应式依赖', () => {
  it('在 watchEffect 里读 getFieldValue **不会**建立依赖', async () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: 1 }, true);

    let runs = 0;
    const scope = effectScope();
    scope.run(() => {
      watchEffect(() => {
        runs += 1;
        form.getFieldValue('a');
      });
    });

    expect(runs).toBe(1);

    // 走公开 API 改值 —— 若 store 是 reactive，这里会触发 watchEffect 重跑
    form.setFieldsValue({ a: 2 });
    await nextTick();
    await flushMacroTask();

    expect(runs).toBe(1);
    expect(form.getFieldValue('a')).toBe(2);

    scope.stop();
  });

  it('在 watchEffect 里读 getFieldsValue(true) 同样不建立依赖', async () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: 1 }, true);

    let runs = 0;
    const scope = effectScope();
    scope.run(() => {
      watchEffect(() => {
        runs += 1;
        form.getFieldsValue(true);
      });
    });

    expect(runs).toBe(1);
    form.setFieldsValue({ a: 2 });
    await nextTick();
    await flushMacroTask();
    expect(runs).toBe(1);

    scope.stop();
  });

  it('⭐ 对照：reactive 对象会建立依赖（证明上面两条不是「碰巧」）', async () => {
    const { reactive } = await import('vue');
    const reactiveStore = reactive({ a: 1 });

    let runs = 0;
    const scope = effectScope();
    scope.run(() => {
      watchEffect(() => {
        runs += 1;
        void reactiveStore.a;
      });
    });

    expect(runs).toBe(1);
    reactiveStore.a = 2;
    await nextTick();
    expect(runs).toBe(2);

    scope.stop();
  });

  it('⭐ P3 PoC · useWatch 的订阅是「显式」的：只有 store 变更才会更新', async () => {
    const { form, hooks } = createStore();
    hooks.setInitialValues({ a: 1 }, true);
    hooks.registerField(createField(['a']).entity);

    const watched = useWatch('a', form);
    const before = watched.value;

    // 不做任何 store 变更 ⇒ 即便等很多个宏任务也不变
    await flushMacroTask();
    await flushMacroTask();
    expect(watched.value).toBe(before);

    form.setFieldsValue({ a: 2 });
    await flushMacroTask();
    expect(watched.value).toBe(2);
  });
});
