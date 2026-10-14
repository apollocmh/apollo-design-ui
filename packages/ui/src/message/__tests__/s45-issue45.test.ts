/**
 * Issue #45 · [Message] Holder 配置到通知内核的动态传导（契约验证）
 *
 * `message/useMessage.ts` 的 Holder 把配置交给内核 `useNotification({...})` 时，
 * `style` / `className` / `motion` / `getContainer` 用的是 **getter**（因此能追踪），
 * 但 `duration` / `maxCount` / `pauseOnHover` / `stack` / `classNames` / `styles`
 * 传的是 **裸值**（setup 期求值一次）⇒ Holder 已经建好之后再改这些配置，
 * 内核收不到。
 *
 * 复现走官方路径：先 `success()` 建 holder，再 `message.config({...})` 更新
 * （`config()` 会 `sync()` ⇒ holder 的 props 真的变了），最后用 DOM 断言。
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import message, { actDestroy } from '../index';

const flush = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

const notices = () => document.body.querySelectorAll('[role="alert"]');

beforeEach(() => {
  actDestroy();
  document.body.innerHTML = '';
});

afterEach(() => {
  actDestroy();
  document.body.innerHTML = '';
});

/** 先建 holder（不带该配置），再经 `config()` 更新它。 */
const bootHolder = async () => {
  message.success('boot');
  await flush();
  message.destroy();
  await flush();
};

describe('Message · Issue #45 Holder 配置更新必须传导到内核', () => {
  it('[A] holder 建好后改 maxCount ⇒ 生效（核心回归）', async () => {
    await bootHolder();

    message.config({ maxCount: 1 });
    await flush();

    message.success('one');
    await flush();
    message.success('two');
    await flush();

    // 超出 maxCount ⇒ 只保留最后一条
    expect(notices().length).toBe(1);
    expect(document.body.textContent).toContain('two');
    expect(document.body.textContent).not.toContain('one');
  });

  it('[B] 守卫：maxCount 在 holder 建立**之前**设置 ⇒ 生效（既有路径未被破坏）', async () => {
    message.config({ maxCount: 1 });
    message.success('one');
    await flush();
    message.success('two');
    await flush();

    expect(notices().length).toBe(1);
    expect(document.body.textContent).toContain('two');
  });
});
