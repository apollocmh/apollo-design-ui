import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Ref } from 'vue';
import { defineComponent, effectScope, h, nextTick, ref } from 'vue';
import useControlledValue from '../hooks/use-controlled-value';
import useDelayState, { type SetDelayState } from '../hooks/use-delay-state';
import useId from '../hooks/use-id';
import useSafeState, { type SetState } from '../hooks/use-safe-state';
import useUpdateEffect from '../hooks/use-update-effect';

/**
 * 五个 composable 的测试。
 *
 * 共同主题：**Vue 没有 React 的 effect 依赖数组与闭包陷阱**，所以这些 hook 的存在理由
 * 全部是「把 React 的语义精确映射到 Vue 的响应式原语上」。测试要锁的就是映射的精度：
 *   - `useUpdateEffect` 的「首次不执行」靠 `watch` 不带 `immediate`（不是靠首帧标记）
 *   - `useControlledValue` 的「非首次同步」靠 `watch` 不带 `immediate`
 *   - `useDelayState` 的「pending 被最新值替换」靠每次调用先取消
 *   - `useSafeState` 的「不做自动保护」是刻意的
 */

afterEach(() => {
  vi.useRealTimers();
});

describe('useId', () => {
  it('显式传入的 id 优先，且不校验格式', () => {
    expect(useId('my-id')).toBe('my-id');
    expect(useId('')).not.toBe(''); // 空串视为"没传"，走生成逻辑
  });

  it('组件外调用返回带前缀的兜底 id，且自增唯一', () => {
    const a = useId();
    const b = useId();
    expect(a).toMatch(/^apollo-id-\d+$/);
    expect(b).not.toBe(a);
  });

  it('★ 组件内生成非空、稳定、合法的 id（不得断言具体值，见文件头 INTENDED 说明）', async () => {
    const counter = ref(0);
    const Comp = defineComponent({
      setup() {
        const id = useId();
        return () => h('div', { id, 'data-n': String(counter.value) });
      },
    });

    const wrapper = mount(Comp);
    const first = (wrapper.element as HTMLElement).id;

    expect(first).toBeTruthy();
    // 合法 HTML id：不含空白（否则 querySelector / aria 引用会碎）
    expect(first).not.toMatch(/\s/);
    expect(() => document.querySelector(`#${CSS.escape(first)}`)).not.toThrow();

    // 重渲染后不变
    counter.value += 1;
    await nextTick();
    expect((wrapper.element as HTMLElement).id).toBe(first);

    wrapper.unmount();
  });

  it('★ 同一 app 内多个组件各自拿到唯一 id（这是它作为 aria-* 目标的前提）', () => {
    const Comp = defineComponent({
      setup() {
        return () => h('div', { id: useId() });
      },
    });

    const wrapper = mount({
      render: () => h('div', [h(Comp), h(Comp), h(Comp)]),
    });

    const ids = wrapper.findAll('div[id]').map((node) => (node.element as HTMLElement).id);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);

    wrapper.unmount();
  });

  it('同一组件内多次调用 useId 也各自唯一', () => {
    const Comp = defineComponent({
      setup() {
        const a = useId();
        const b = useId();
        return () => h('div', { id: a, 'data-b': b });
      },
    });
    const wrapper = mount(Comp);
    const el = wrapper.element as HTMLElement;
    expect(el.id).not.toBe(el.dataset.b);
    wrapper.unmount();
  });
});

describe('useDelayState', () => {
  it('初始值：直接值与惰性函数', () => {
    expect(useDelayState(5)[0].value).toBe(5);
    const init = vi.fn(() => 7);
    const [value] = useDelayState(init);
    expect(value.value).toBe(7);
    expect(init).toHaveBeenCalledTimes(1);
  });

  it('默认延迟到下一帧才更新', () => {
    vi.useFakeTimers();
    const [value, setValue] = useDelayState(0);
    setValue(1);
    expect(value.value).toBe(0);
    vi.runAllTimers();
    expect(value.value).toBe(1);
  });

  it('setValue(next, true) 立即更新', () => {
    const [value, setValue] = useDelayState(0);
    setValue(1, true);
    expect(value.value).toBe(1);
  });

  it('{ ms } 走 setTimeout', () => {
    vi.useFakeTimers();
    const [value, setValue] = useDelayState(0);
    setValue(1, { ms: 100 });
    vi.advanceTimersByTime(99);
    expect(value.value).toBe(0);
    vi.advanceTimersByTime(1);
    expect(value.value).toBe(1);
  });

  it('{ frame: 2 } 需要两帧', () => {
    vi.useFakeTimers();
    const [value, setValue] = useDelayState(0);
    setValue(1, { frame: 2 });
    vi.advanceTimersByTime(1);
    expect(value.value).toBe(0);
    vi.runAllTimers();
    expect(value.value).toBe(1);
  });

  it('函数式更新基于当前值', () => {
    const [value, setValue] = useDelayState(1);
    setValue((prev) => prev + 1, true);
    expect(value.value).toBe(2);
  });

  it('函数式更新同样可以延迟', () => {
    vi.useFakeTimers();
    const [value, setValue] = useDelayState(1);
    setValue((prev) => prev + 10);
    expect(value.value).toBe(1);
    vi.runAllTimers();
    expect(value.value).toBe(11);
  });

  it('★ 连续调用不排队 —— 只有最后一次生效（pending 被替换）', () => {
    vi.useFakeTimers();
    const [value, setValue] = useDelayState(0);
    setValue(1);
    setValue(2);
    setValue(3);
    vi.runAllTimers();
    expect(value.value).toBe(3);
  });

  it('★ 立即更新会取消掉之前待执行的延迟更新（不会被旧值覆盖回来）', () => {
    vi.useFakeTimers();
    const [value, setValue] = useDelayState(0);
    setValue(1);
    setValue(2, true);
    expect(value.value).toBe(2);
    vi.runAllTimers();
    expect(value.value).toBe(2);
  });

  it('★ 换一种调度方式也会取消掉前一个（不会两个都生效）', () => {
    vi.useFakeTimers();
    const [value, setValue] = useDelayState(0);

    setValue(1, { ms: 1000 });
    setValue(2, { frame: 1 });

    // ⚠️ 不能写 `advanceTimersByTime(999)` 来"只推进 ms" ——
    //    假 rAF 同样是定时器驱动的（约 16ms 一跳），推 999ms 会把帧也一起触发。
    vi.advanceTimersByTime(1);
    expect(value.value).toBe(0);

    // 全部推进：帧那次生效（2）。若 ms 那次没被取消，1000ms 处会把它覆盖回 1。
    vi.runAllTimers();
    expect(value.value).toBe(2);
  });

  it('作用域销毁时取消待执行更新（避免对已销毁的 ref 赋值）', () => {
    vi.useFakeTimers();
    const scope = effectScope();
    let value!: Ref<number>;
    let setValue!: SetDelayState<number>;
    scope.run(() => {
      [value, setValue] = useDelayState(0);
    });

    setValue(1);
    scope.stop();
    vi.runAllTimers();
    expect(value.value).toBe(0);
  });

  it('组件外使用不抛错（无 scope 时不注册 onScopeDispose）', () => {
    expect(() => useDelayState(0)).not.toThrow();
  });
});

describe('useSafeState', () => {
  it('初始值：直接值、惰性函数、省略', () => {
    expect(useSafeState(3)[0].value).toBe(3);
    expect(useSafeState(() => 4)[0].value).toBe(4);
    expect(useSafeState()[0].value).toBeUndefined();
  });

  it('setState 直接值 / 函数式更新', () => {
    const [value, setState] = useSafeState(1);
    setState(2);
    expect(value.value).toBe(2);
    setState((prev) => (prev ?? 0) + 10);
    expect(value.value).toBe(12);
  });

  it('未销毁时 ignoreDestroy 不影响更新', () => {
    const [value, setState] = useSafeState(1);
    setState(2, true);
    expect(value.value).toBe(2);
  });

  it('★ 销毁后 ignoreDestroy=true 跳过更新', () => {
    const scope = effectScope();
    let value!: Ref<number | undefined>;
    let setState!: SetState<number>;
    scope.run(() => {
      [value, setState] = useSafeState(0);
    });

    scope.stop();
    setState(1, true);
    expect(value.value).toBe(0);
  });

  it('★ 销毁后**不传** ignoreDestroy 仍然更新 —— 刻意不做自动保护，否则会掩盖真实泄漏', () => {
    const scope = effectScope();
    let value!: Ref<number | undefined>;
    let setState!: SetState<number>;
    scope.run(() => {
      [value, setState] = useSafeState(0);
    });

    scope.stop();
    setState(1);
    expect(value.value).toBe(1);
  });

  it('组件外使用不抛错，且 setState 正常', () => {
    const [value, setState] = useSafeState(0);
    setState(9);
    expect(value.value).toBe(9);
  });
});

describe('useUpdateEffect', () => {
  it('★ 首次挂载不执行（靠 watch 不带 immediate，不是靠首帧标记）', async () => {
    const cb = vi.fn();
    const dep = ref(0);
    const scope = effectScope();

    scope.run(() => useUpdateEffect(cb, [dep]));
    expect(cb).not.toHaveBeenCalled();

    dep.value = 1;
    await nextTick();
    expect(cb).toHaveBeenCalledTimes(1);

    scope.stop();
  });

  it('依赖不变时不执行', async () => {
    const cb = vi.fn();
    const dep = ref(0);
    const scope = effectScope();

    scope.run(() => useUpdateEffect(cb, [dep]));
    await nextTick();
    expect(cb).not.toHaveBeenCalled();

    scope.stop();
  });

  it('空依赖数组 → 永不执行', async () => {
    const cb = vi.fn();
    const scope = effectScope();

    scope.run(() => useUpdateEffect(cb, []));
    await nextTick();
    expect(cb).not.toHaveBeenCalled();

    scope.stop();
  });

  it('多个依赖中任一变化都触发', async () => {
    const cb = vi.fn();
    const a = ref(0);
    const b = ref(0);
    const scope = effectScope();

    scope.run(() => useUpdateEffect(cb, [a, b]));
    a.value = 1;
    await nextTick();
    b.value = 1;
    await nextTick();
    expect(cb).toHaveBeenCalledTimes(2);

    scope.stop();
  });

  it('返回值作为清理函数，在**下次执行前**调用', async () => {
    const order: string[] = [];
    const dep = ref(0);
    const scope = effectScope();

    scope.run(() =>
      useUpdateEffect(() => {
        order.push('run');
        return () => order.push('cleanup');
      }, [dep]),
    );

    dep.value = 1;
    await nextTick();
    dep.value = 2;
    await nextTick();

    expect(order).toEqual(['run', 'cleanup', 'run']);

    scope.stop();
  });

  it('作用域销毁时调用清理函数，且只调一次', async () => {
    const cleanup = vi.fn();
    const dep = ref(0);
    const scope = effectScope();

    scope.run(() => useUpdateEffect(() => cleanup, [dep]));
    dep.value = 1;
    await nextTick();

    scope.stop();
    expect(cleanup).toHaveBeenCalledTimes(1);

    scope.stop();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('★ flush: post —— 回调里能读到更新后的 DOM（选 post 而非 pre 的全部理由）', async () => {
    const text = ref('a');
    let observed: string | null = null;

    const Comp = defineComponent({
      setup() {
        const el = ref<HTMLElement | null>(null);
        useUpdateEffect(() => {
          observed = el.value?.textContent ?? null;
        }, [text]);
        return () => h('div', { ref: el }, text.value);
      },
    });

    const wrapper = mount(Comp);
    expect(observed).toBeNull();

    text.value = 'b';
    await nextTick();
    await nextTick();

    expect(observed).toBe('b');
    wrapper.unmount();
  });
});

describe('useControlledValue', () => {
  it('非受控：使用 defaultValue', () => {
    const [merged, setValue] = useControlledValue({ defaultValue: 1, getValue: () => undefined });
    expect(merged.value).toBe(1);
    setValue(2);
    expect(merged.value).toBe(2);
  });

  it('受控：getValue 的返回值优先，且 computed 立即反映', () => {
    const source = ref<number | undefined>(5);
    const [merged] = useControlledValue({ defaultValue: 1, getValue: () => source.value });
    expect(merged.value).toBe(5);
    source.value = 6;
    expect(merged.value).toBe(6);
  });

  it('lazy defaultValue 只求值一次', () => {
    const init = vi.fn(() => 42);
    const [merged] = useControlledValue({ defaultValue: init, getValue: () => undefined });
    expect(merged.value).toBe(42);
    expect(init).toHaveBeenCalledTimes(1);
  });

  it('setValue 触发 onChange', () => {
    const onChange = vi.fn();
    const [, setValue] = useControlledValue({
      defaultValue: 1,
      getValue: () => undefined,
      onChange,
    });
    setValue(3);
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('★ setValue 的函数式更新以 inner 为基准，而不是 merged（通过 onChange 观测）', () => {
    const source = ref<number | undefined>(3);
    const onChange = vi.fn();
    const [, setValue] = useControlledValue({
      defaultValue: 100,
      getValue: () => source.value,
      onChange,
    });

    // watch 不带 immediate ⇒ 首次不同步 ⇒ inner 仍是 100（merged 是 3）
    setValue((prev) => prev + 1);
    expect(onChange).toHaveBeenCalledWith(101);
  });

  it('受控值变化后 inner 跟随，函数式更新随之改变基准', async () => {
    const source = ref<number | undefined>(3);
    const onChange = vi.fn();
    const [, setValue] = useControlledValue({
      defaultValue: 100,
      getValue: () => source.value,
      onChange,
    });

    source.value = 4;
    await nextTick();
    setValue((prev) => prev + 1);
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('★ 受控 → 非受控切换时 inner 被重置为 undefined（rc-util 的既定行为）', async () => {
    const source = ref<number | undefined>(5);
    const [merged] = useControlledValue({ defaultValue: 1, getValue: () => source.value });

    expect(merged.value).toBe(5);
    source.value = undefined;
    await nextTick();
    // 不是回落到 defaultValue 1 —— 这就是 "Sync value back to undefined" 的字面含义
    expect(merged.value).toBeUndefined();
  });

  it('非受控 → 受控切换时立即取受控值', async () => {
    const source = ref<number | undefined>(undefined);
    const [merged, setValue] = useControlledValue({
      defaultValue: 1,
      getValue: () => source.value,
    });

    setValue(2);
    expect(merged.value).toBe(2);

    source.value = 9;
    await nextTick();
    expect(merged.value).toBe(9);
  });

  it('受控值不变时 watch 不触发（依赖是 getValue 的返回值，不是调用次数）', async () => {
    const source = ref<number | undefined>(3);
    const onChange = vi.fn();
    const [, setValue] = useControlledValue({
      defaultValue: 100,
      getValue: () => source.value,
      onChange,
    });

    // 赋同样的值 → watch 不触发 → inner 不被同步
    source.value = 3;
    await nextTick();
    setValue((prev) => prev + 1);
    expect(onChange).toHaveBeenCalledWith(101);
  });

  it('默认导出与具名导出一致', async () => {
    const named = await import('../hooks/use-controlled-value');
    expect(named.default).toBe(named.useControlledValue);
  });
});
