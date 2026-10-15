/**
 * Issue #48 · [ConfigProvider] warning Context 的动态更新（契约验证）
 *
 * 上游判据（antd 6.6.4 `es/_util/warning.js`）：
 * `useDevWarning` 里 `const { strict } = React.useContext(WarningContext)` —— 每次 render
 * 都重读 context；`ConfigProvider` 用 `WarningContext.Provider value={warning}` 包住子树
 * ⇒ 挂载后改 `warning` 是**活的**。
 *
 * 本仓在 setup 期 `provide(warningContextKey, props.warning ?? parentWarning ?? {})` ——
 * 单次值快照，且消费者 `useDevWarning` 也把 context 捕获成常量 ⇒ 挂载后改 `warning`
 * 不传导（与 size / disabled 两条 provide 的写法不一致：那两条是 computed）。
 *
 * 复现走官方路径：`ConfigProvider` 的 `warning` 来自一个 ref（模拟「挂载后改」），
 * 子树里的探针调 `deprecated(...)`，用 console 通道区分「逐条」与「聚合」两种行为。
 */

import { BRAND_BRACKET, resetDevWarned, useDevWarning, warningPrefix } from '@apollo-design/utils';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

import { ConfigProvider } from '../ConfigProvider';

const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

/** 探针：只调用 `useDevWarning`，不产生别的输出。 */
function createWarningProbe(component = 'Probe') {
  let devWarning!: ReturnType<typeof useDevWarning>;
  const Probe = defineComponent({
    name: 'WarningProbe',
    setup() {
      devWarning = useDevWarning(component);
      return () => h('div');
    },
  });
  return { Probe, get: () => devWarning };
}

beforeEach(() => {
  // ⚠️ **必须**：聚合分支不自动重置 `deprecatedWarnList`（只有逐条分支在 isTest 下重置）
  //    ⇒ 不复位会让后续用例的「第一次聚合」判据恒假，`console.warn` 一次都不打（假绿/假红）。
  resetDevWarned();
  errorSpy.mockClear();
  warnSpy.mockClear();
});

afterEach(() => {
  resetDevWarned();
  errorSpy.mockClear();
  warnSpy.mockClear();
});

describe('ConfigProvider · Issue #48 warning Context 动态更新', () => {
  it('[A] 挂载后改 warning.strict ⇒ 子树行为跟随（核心回归）', async () => {
    const { Probe, get } = createWarningProbe();
    const warning = ref<{ strict?: boolean }>({ strict: true });

    const wrapper = mount(
      defineComponent({
        name: 'Host',
        setup: () => () => h(ConfigProvider, { warning: warning.value }, () => h(Probe)),
      }),
      { attachTo: document.body },
    );
    await nextTick();

    // strict: true（默认语义）⇒ 逐条打印
    get().deprecated(false, 'visible', 'open');
    expect(errorSpy).toHaveBeenCalledWith(
      `Warning: ${warningPrefix('Probe')} \`visible\` is deprecated. Please use \`open\` instead.`,
    );
    expect(warnSpy).not.toHaveBeenCalled();

    errorSpy.mockClear();
    warnSpy.mockClear();

    // 挂载后改成聚合
    warning.value = { strict: false };
    await nextTick();

    get().deprecated(false, 'dropdownClassName', 'popupClassName');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0]?.[0])).toContain(
      `${BRAND_BRACKET} There exists deprecated usage in your code:`,
    );
    expect(errorSpy).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('[B] 嵌套：内层 ConfigProvider 未传 warning ⇒ 跟随外层（parentWarning 也要活的）', async () => {
    const { Probe, get } = createWarningProbe('Nested');
    const warning = ref<{ strict?: boolean }>({ strict: true });

    const wrapper = mount(
      defineComponent({
        name: 'Host',
        setup: () => () =>
          h(ConfigProvider, { warning: warning.value }, () =>
            // 内层不传 warning ⇒ `props.warning ?? parentWarning ?? {}`
            h(ConfigProvider, {}, () => h(Probe)),
          ),
      }),
      { attachTo: document.body },
    );
    await nextTick();

    warning.value = { strict: false };
    await nextTick();

    get().deprecated(false, 'a', 'b');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('[C] 守卫：既不传也不继承 ⇒ `strict` 为 undefined ⇒ 逐条打印', async () => {
    const { Probe, get } = createWarningProbe('Bare');
    const wrapper = mount(ConfigProvider, {
      slots: { default: () => h(Probe) },
      attachTo: document.body,
    });
    await nextTick();

    get().deprecated(false, 'visible', 'open');
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();

    wrapper.unmount();
  });
});
