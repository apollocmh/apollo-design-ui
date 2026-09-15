import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { defineComponent, h, provide } from 'vue';
import { BRAND_BRACKET, warningPrefix } from '../brand';
import {
  type DevWarning,
  devUseWarning,
  resetDevWarned,
  useDevWarning,
  warningContextKey,
} from '../dev-warning';
import { resetPreMessage } from '../warning';

/**
 * `dev-warning` 是 antd `es/_util/warning.js` 的 Vue 映射。
 * 它在 rc-util 的 `warning` 之上加了三件事，测试要逐条锁定：
 *   1. 组件名前缀 `[apollo: Button]`
 *   2. `strict === false` 时的 deprecated 聚合（**只在第一次**打印一次汇总）
 *   3. 测试环境每条告警后自动重置去重表
 *
 * ⚠️ 断言里一律通过 `warningPrefix()` / `BRAND_BRACKET` 派生前缀，
 *    不硬编码 `'[apollo: ...]'` —— 待裁决项 Q1 一旦把 BRAND 改成 `ant`，这里不需要动。
 */

let errorSpy: MockInstance;
let warnSpy: MockInstance;

beforeEach(() => {
  resetDevWarned();
  resetPreMessage();
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
  warnSpy.mockRestore();
  resetDevWarned();
  resetPreMessage();
});

/**
 * 取第 `callIndex` 次调用的第 `argIndex` 个参数。
 *
 * `noUncheckedIndexedAccess` 下 `mock.calls[i]` 是 `Call | undefined`。测试里调用次数
 * 由前一行断言保证，这里显式收窄；用辅助函数是为了让"断言被删掉"变成可读的抛错。
 */
function spyArg(spy: MockInstance, callIndex: number, argIndex: number): unknown {
  const call = spy.mock.calls[callIndex];
  if (!call) {
    throw new Error(
      `断言前提不成立：期望至少 ${callIndex + 1} 次调用，实际 ${spy.mock.calls.length} 次`,
    );
  }
  return call[argIndex];
}

/** 挂载一个提供了 `WarningContext` 的父组件，并捕获子组件拿到的 `devWarning`。 */
function mountWithContext(
  strict: boolean | undefined,
  component = 'Button',
): { devWarning: DevWarning; unmount: () => void } {
  let devWarning!: DevWarning;

  const Child = defineComponent({
    name: 'Child',
    setup() {
      devWarning = useDevWarning(component);
      return () => h('div');
    },
  });

  const wrapper = mount({
    setup() {
      provide(warningContextKey, { strict });
      return () => h(Child);
    },
  });

  return { devWarning, unmount: () => wrapper.unmount() };
}

describe('warningContextKey', () => {
  it('是 Symbol 而不是字符串键（避免与用户的 provide 冲突）', () => {
    expect(typeof warningContextKey).toBe('symbol');
    expect(warningContextKey.toString()).toContain('apolloWarning');
  });
});

describe('useDevWarning —— 通用告警', () => {
  it('输出带组件名前缀的 Warning', () => {
    const { devWarning, unmount } = mountWithContext(undefined);
    devWarning(false, 'something is wrong');
    expect(errorSpy).toHaveBeenCalledWith(`Warning: ${warningPrefix('Button')} something is wrong`);
    unmount();
  });

  it('valid 为 true 时静默', () => {
    const { devWarning, unmount } = mountWithContext(undefined);
    devWarning(true, 'not printed');
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    unmount();
  });

  it('组件名只影响前缀，不参与去重', () => {
    const a = mountWithContext(undefined, 'Alpha');
    const b = mountWithContext(undefined, 'Beta');
    a.devWarning(false, 'same text');
    b.devWarning(false, 'same text');
    expect(errorSpy).toHaveBeenCalledTimes(2);
    expect(spyArg(errorSpy, 0, 0)).toContain('Alpha');
    expect(spyArg(errorSpy, 1, 0)).toContain('Beta');
    a.unmount();
    b.unmount();
  });

  it('★ 组件外调用不抛错（inject 被 getCurrentInstance 守卫住）', () => {
    const devWarning = useDevWarning('Outside');
    expect(() => devWarning(false, 'x')).not.toThrow();
    expect(errorSpy).toHaveBeenCalledWith(`Warning: ${warningPrefix('Outside')} x`);
  });

  it('★ 测试环境下每条告警后自动重置去重表（antd 的测试便利）', () => {
    const { devWarning, unmount } = mountWithContext(undefined);
    devWarning(false, 'same');
    devWarning(false, 'same');
    // 若没有 isTest 重置，第二次会被 warningOnce 去重掉
    expect(errorSpy).toHaveBeenCalledTimes(2);
    unmount();
  });
});

describe('useDevWarning.deprecated —— 逐条打印（strict 为真 / 未设置）', () => {
  it('★ 消息格式与 antd 逐字一致', () => {
    const { devWarning, unmount } = mountWithContext(undefined);
    devWarning.deprecated(false, 'visible', 'open');
    expect(errorSpy).toHaveBeenCalledWith(
      `Warning: ${warningPrefix('Button')} \`visible\` is deprecated. Please use \`open\` instead.`,
    );
    unmount();
  });

  it('附加 message 以空格拼接在末尾', () => {
    const { devWarning, unmount } = mountWithContext(undefined);
    devWarning.deprecated(false, 'visible', 'open', 'Note: this is a long message.');
    expect(errorSpy).toHaveBeenCalledWith(
      `Warning: ${warningPrefix('Button')} \`visible\` is deprecated. Please use \`open\` instead. Note: this is a long message.`,
    );
    unmount();
  });

  it('附加 message 为空串时不留下尾随空格', () => {
    const { devWarning, unmount } = mountWithContext(undefined);
    devWarning.deprecated(false, 'a', 'b', '');
    const message = spyArg(errorSpy, 0, 0) as string;
    expect(message.endsWith('instead.')).toBe(true);
    unmount();
  });

  it('valid 为 true（旧属性没被使用）时静默', () => {
    const { devWarning, unmount } = mountWithContext(undefined);
    devWarning.deprecated(true, 'visible', 'open');
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    unmount();
  });

  it('strict === true 时同样逐条打印', () => {
    const { devWarning, unmount } = mountWithContext(true);
    devWarning.deprecated(false, 'visible', 'open');
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();
    unmount();
  });
});

describe('useDevWarning.deprecated —— 聚合（strict === false）', () => {
  it('★ 不逐条打印，改为一次性汇总', () => {
    const { devWarning, unmount } = mountWithContext(false);
    devWarning.deprecated(false, 'visible', 'open');

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(spyArg(warnSpy, 0, 0)).toContain(
      `${BRAND_BRACKET} There exists deprecated usage in your code:`,
    );
    unmount();
  });

  it('★ 汇总内容按「组件 → 消息列表」组织', () => {
    const { devWarning, unmount } = mountWithContext(false, 'Select');
    devWarning.deprecated(false, 'dropdownClassName', 'popupClassName');
    devWarning.deprecated(false, 'dropdownMatchSelectWidth', 'popupMatchSelectWidth');

    const list = spyArg(warnSpy, 0, 1) as Record<string, string[]>;
    expect(Object.keys(list)).toEqual(['Select']);
    expect(list.Select).toEqual([
      '`dropdownClassName` is deprecated. Please use `popupClassName` instead.',
      '`dropdownMatchSelectWidth` is deprecated. Please use `popupMatchSelectWidth` instead.',
    ]);
    unmount();
  });

  it('★ 汇总只在**第一次**打印，之后继续累积但不再输出', () => {
    const { devWarning, unmount } = mountWithContext(false);
    devWarning.deprecated(false, 'a', 'b');
    expect(warnSpy).toHaveBeenCalledTimes(1);

    devWarning.deprecated(false, 'c', 'd');
    devWarning.deprecated(false, 'e', 'f');
    expect(warnSpy).toHaveBeenCalledTimes(1);

    // 但列表确实在增长
    const list = spyArg(warnSpy, 0, 1) as Record<string, string[]>;
    expect(list.Button).toHaveLength(3);
    unmount();
  });

  it('★ 同一条消息重复出现不会重复入列', () => {
    const { devWarning, unmount } = mountWithContext(false);
    devWarning.deprecated(false, 'a', 'b');
    devWarning.deprecated(false, 'a', 'b');

    const list = spyArg(warnSpy, 0, 1) as Record<string, string[]>;
    expect(list.Button).toHaveLength(1);
    unmount();
  });

  it('★ 汇总时 valid 为 true 的消息不入列', () => {
    const { devWarning, unmount } = mountWithContext(false);
    devWarning.deprecated(true, 'a', 'b');
    expect(warnSpy).not.toHaveBeenCalled();
    unmount();
  });

  it('★ 聚合只作用于 deprecated；普通告警仍然逐条打印', () => {
    const { devWarning, unmount } = mountWithContext(false);
    devWarning(false, 'normal issue');
    expect(errorSpy).toHaveBeenCalledWith(`Warning: ${warningPrefix('Button')} normal issue`);

    devWarning.deprecated(false, 'a', 'b');
    expect(errorSpy).toHaveBeenCalledTimes(1); // 没有多出 deprecated 的 error
    expect(warnSpy).toHaveBeenCalledTimes(1); // 只有那条汇总
    unmount();
  });

  it('多个组件各自成键，共用同一条汇总输出', () => {
    const a = mountWithContext(false, 'Alpha');
    const b = mountWithContext(false, 'Beta');
    a.devWarning.deprecated(false, 'x', 'y');
    b.devWarning.deprecated(false, 'p', 'q');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const list = spyArg(warnSpy, 0, 1) as Record<string, string[]>;
    expect(Object.keys(list).sort()).toEqual(['Alpha', 'Beta']);
    a.unmount();
    b.unmount();
  });
});

describe('resetDevWarned', () => {
  it('★ 清空聚合表，使下一次 deprecated 重新触发汇总输出', () => {
    const { devWarning, unmount } = mountWithContext(false);
    devWarning.deprecated(false, 'a', 'b');
    expect(warnSpy).toHaveBeenCalledTimes(1);

    resetDevWarned();
    devWarning.deprecated(false, 'c', 'd');
    expect(warnSpy).toHaveBeenCalledTimes(2);

    // 重置后是全新的表，只有这次的消息
    const list = spyArg(warnSpy, 1, 1) as Record<string, string[]>;
    expect(list.Button).toEqual(['`c` is deprecated. Please use `d` instead.']);
    unmount();
  });

  it('同时重置 rc 层的去重表（resetWarned）', () => {
    const { devWarning, unmount } = mountWithContext(undefined);
    devWarning(false, 'msg');
    resetDevWarned();
    devWarning(false, 'msg');
    expect(errorSpy).toHaveBeenCalledTimes(2);
    unmount();
  });
});

describe('导出别名', () => {
  it('devUseWarning 与 useDevWarning 是同一个函数（保留两个名字便于迁移时搜索）', () => {
    expect(devUseWarning).toBe(useDevWarning);
  });
});
