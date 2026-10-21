/**
 * Issue #46 · [Notification] Holder 配置到内核的动态传导（契约验证）
 *
 * 与 message（Issue #45）同判：`useKernelNotification()` 在 setup 期把根配置
 * **解构成常量** ⇒ `duration` / `maxCount` / `pauseOnHover` / `stack` 传裸值会被
 * 钉死，Holder 已经建好之后再改这些配置（`notification.config({...})`）传不进内核。
 *
 * 复现走官方路径：先 `success()` 建 holder（不销毁），再 `notification.config()`
 * 更新（`config()` 会 `sync()` ⇒ holder 的 props 真的变了），最后用 DOM 断言。
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import notification, { actDestroy } from '../index';

const flush = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

const notices = () => document.body.querySelectorAll('.apollo-notification-notice, [role="alert"]');

/** 等被 maxCount 挤掉的那条播完 leave 再消失（jsdom 无 transition ⇒ 500ms deadline）。 */
async function waitForNoticeCount(count: number, timeout = 1500): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (notices().length === count) return;
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 16);
    });
    await flush();
  }
  expect(notices()).toHaveLength(count);
}

beforeEach(() => {
  actDestroy();
  document.body.innerHTML = '';
});

afterEach(() => {
  actDestroy();
  document.body.innerHTML = '';
});

/** 先建 holder（不带该配置），清空已有 notice，但不销毁 holder。 */
const bootHolder = async () => {
  notification.success({ message: 'boot' });
  await flush();
  notification.destroy();
  await flush();
};

describe('Notification · Issue #46 Holder 配置更新必须传导到内核', () => {
  it('[A] holder 建好后改 maxCount ⇒ 生效（核心回归）', async () => {
    await bootHolder();

    notification.config({ maxCount: 1 });
    await flush();

    notification.success({ message: 'one' });
    await flush();
    notification.success({ message: 'two' });
    await flush();

    // 超出 maxCount ⇒ 只保留最后一条（被挤掉的那条要先播完 leave）
    await waitForNoticeCount(1);
    expect(document.body.textContent).toContain('two');
    expect(document.body.textContent).not.toContain('one');
  });

  it('[B] 守卫：maxCount 在 holder 建立**之前**设置 ⇒ 生效（既有路径未被破坏）', async () => {
    notification.config({ maxCount: 1 });
    notification.success({ message: 'one' });
    await flush();
    notification.success({ message: 'two' });
    await flush();

    await waitForNoticeCount(1);
    expect(document.body.textContent).toContain('two');
  });
});
