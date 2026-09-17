import { describe, expect, it } from 'vitest';
import { effectScope, ref } from 'vue';
import type { UseTypeaheadReturn } from '../index';
import { isTypeaheadKey, useTypeahead } from '../index';

const LABELS = ['Ant', 'Ape', 'Asp', 'Bee'];

function keyEvent(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, cancelable: true, ...init });
}

/** 造一个「activeIndex 由 onMatch 驱动」的接线，模拟真实用法。 */
function createHarness(labels: readonly string[] = LABELS, resetDelay?: number) {
  const active = ref<number | undefined>(undefined);
  let clock = 0;
  const scope = effectScope();
  // effectScope.run 的返回类型带 | undefined；回调一定返回值，这里收窄一次
  const api = scope.run(() =>
    useTypeahead({
      labels,
      activeIndex: active,
      resetDelay,
      now: () => clock,
      onMatch: (index) => {
        active.value = index;
      },
    }),
  ) as UseTypeaheadReturn;
  return {
    api,
    active,
    /** 推进时钟 */
    at(ms: number) {
      clock = ms;
    },
    stop() {
      scope.stop();
    },
  };
}

describe('isTypeaheadKey', () => {
  it('单字符算', () => {
    expect(isTypeaheadKey({ key: 'a' })).toBe(true);
    expect(isTypeaheadKey({ key: 'A' })).toBe(true);
    expect(isTypeaheadKey({ key: '中' })).toBe(true);
  });

  it('⭐ 空格算（经典 typeahead 的合法字符）', () => {
    expect(isTypeaheadKey({ key: ' ' })).toBe(true);
  });

  it('功能键不算', () => {
    for (const key of ['Enter', 'Escape', 'ArrowDown', 'Tab', 'Backspace', 'F1']) {
      expect(isTypeaheadKey({ key })).toBe(false);
    }
  });

  it('⭐ 带修饰键的一律不算（那是快捷键不是搜索）', () => {
    expect(isTypeaheadKey({ key: 'a', ctrlKey: true })).toBe(false);
    expect(isTypeaheadKey({ key: 'a', metaKey: true })).toBe(false);
    expect(isTypeaheadKey({ key: 'a', altKey: true })).toBe(false);
  });
});

describe('useTypeahead', () => {
  it('单字符命中并通知', () => {
    const h = createHarness();
    expect(h.api.onKeyDown(keyEvent('b'))).toBe(true);
    expect(h.active.value).toBe(3);
    h.stop();
  });

  it('累积多字符缩小范围', () => {
    const h = createHarness();
    h.api.onKeyDown(keyEvent('a'));
    expect(h.active.value).toBe(0);
    h.api.onKeyDown(keyEvent('s'));
    expect(h.active.value).toBe(2);
    expect(h.api.buffer.value).toBe('as');
    h.stop();
  });

  it('⭐ 连按同一个键在匹配项之间循环', () => {
    const h = createHarness();
    h.api.onKeyDown(keyEvent('a'));
    expect(h.active.value).toBe(0);
    h.api.onKeyDown(keyEvent('a'));
    expect(h.active.value).toBe(1);
    h.api.onKeyDown(keyEvent('a'));
    expect(h.active.value).toBe(2);
    // 绕回开头
    h.api.onKeyDown(keyEvent('a'));
    expect(h.active.value).toBe(0);
    h.stop();
  });

  it('⭐ 循环时 buffer 收回到单字符（不是 "aaaa"）', () => {
    const h = createHarness();
    h.api.onKeyDown(keyEvent('a'));
    h.api.onKeyDown(keyEvent('a'));
    expect(h.api.buffer.value).toBe('a');
    h.stop();
  });

  it('没有命中时返回 false，且不改 activeIndex', () => {
    const h = createHarness();
    expect(h.api.onKeyDown(keyEvent('z'))).toBe(false);
    expect(h.active.value).toBeUndefined();
    h.stop();
  });

  it('功能键 / 修饰键直接返回 false', () => {
    const h = createHarness();
    expect(h.api.onKeyDown(keyEvent('ArrowDown'))).toBe(false);
    expect(h.api.onKeyDown(keyEvent('a', { ctrlKey: true }))).toBe(false);
    expect(h.active.value).toBeUndefined();
    h.stop();
  });

  it('⭐ 超过 resetDelay 后重新起头', () => {
    const h = createHarness();
    h.api.onKeyDown(keyEvent('a'));
    expect(h.api.buffer.value).toBe('a');

    h.at(10_000);
    h.api.onKeyDown(keyEvent('b'));
    expect(h.api.buffer.value).toBe('b');
    expect(h.active.value).toBe(3);
    h.stop();
  });

  it('⭐ 刚好等于 resetDelay 时**不**重新起头', () => {
    const h = createHarness();
    h.api.onKeyDown(keyEvent('a'));
    h.at(500);
    h.api.onKeyDown(keyEvent('s'));
    expect(h.api.buffer.value).toBe('as');
    h.stop();
  });

  it('可以自定义 resetDelay', () => {
    const h = createHarness(LABELS, 50);
    h.api.onKeyDown(keyEvent('a'));
    h.at(60);
    h.api.onKeyDown(keyEvent('b'));
    expect(h.api.buffer.value).toBe('b');
    h.stop();
  });

  it('reset 清空缓冲', () => {
    const h = createHarness();
    h.api.onKeyDown(keyEvent('a'));
    expect(h.api.buffer.value).toBe('a');
    h.api.reset();
    expect(h.api.buffer.value).toBe('');
    h.stop();
  });

  it('累积串命中时 buffer 保留累积值（不会被误退化）', () => {
    // 'an' 命中 'Ant' —— 说明退化分支只在**真的**没命中时才走
    const h = createHarness();
    h.api.onKeyDown(keyEvent('a'));
    expect(h.api.onKeyDown(keyEvent('n'))).toBe(true);
    expect(h.active.value).toBe(0);
    expect(h.api.buffer.value).toBe('an');
    h.stop();
  });

  it('⭐ 累积串没命中但单字符命中时，退化成单字符（不是「什么都不发生」）', () => {
    // 'ab' 没有任何匹配项；退化到 'b' 命中 Bee
    const h = createHarness(['Ant', 'Bee']);
    h.api.onKeyDown(keyEvent('a'));
    expect(h.active.value).toBe(0);
    expect(h.api.onKeyDown(keyEvent('b'))).toBe(true);
    expect(h.active.value).toBe(1);
    expect(h.api.buffer.value).toBe('b');
    h.stop();
  });

  it('累积串与单字符都没命中时，buffer 保留累积值（便于继续输入）', () => {
    const h = createHarness(['Ant']);
    h.api.onKeyDown(keyEvent('z'));
    expect(h.api.onKeyDown(keyEvent('z'))).toBe(false);
    expect(h.api.buffer.value).toBe('zz');
    h.stop();
  });

  it('不注入 now 时用 Date.now —— 默认时间源可用', () => {
    const active = ref<number | undefined>(undefined);
    const scope = effectScope();
    // effectScope.run 的返回类型带 | undefined；回调一定返回值，这里收窄一次
    const api = scope.run(() =>
      useTypeahead({
        labels: LABELS,
        activeIndex: active,
        onMatch: (index) => {
          active.value = index;
        },
      }),
    ) as UseTypeaheadReturn;

    expect(api.onKeyDown(keyEvent('a'))).toBe(true);
    expect(active.value).toBe(0);
    scope.stop();
  });

  it('空候选表：什么都不命中', () => {
    const h = createHarness([]);
    expect(h.api.onKeyDown(keyEvent('a'))).toBe(false);
    h.stop();
  });

  it('大小写不敏感', () => {
    const h = createHarness();
    expect(h.api.onKeyDown(keyEvent('B'))).toBe(true);
    expect(h.active.value).toBe(3);
    h.stop();
  });
});
