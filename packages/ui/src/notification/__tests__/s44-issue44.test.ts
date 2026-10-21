/**
 * Issue #44 · [Notification] 全局 Holder 销毁未卸载 Vue app
 *
 * 与 `message`（Issue #43）同构：`flushNotificationQueue()` 用
 * `createApp(GlobalHolder).mount(container)` 建根应用，但 `actDestroy()` 只把
 * `notification` / `taskQueue` / `globalConfigRef` 复位 —— **没有 `app.unmount()`**
 * ⇒ 上一个根应用连同它的 watch 与 Teleport 出去的 notice 一起留着。
 *
 * 可观测点：notice 经 Teleport 落到 `document.body` ⇒ 「销毁后 notice 是否还在」
 * 就是「根应用有没有被卸载」的直接证据。
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

/** 等离场节点真正移除（`destroy()` 现在先播 leave，jsdom 无 transition 时走 500ms deadline）。 */
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

describe('Notification · Issue #44 actDestroy 必须卸载根应用', () => {
  it('[A] actDestroy() 后旧 holder 的 notice 从 DOM 消失（核心回归）', async () => {
    notification.success({ message: 'first' });
    await flush();
    expect(notices().length).toBe(1);

    actDestroy();
    await flush();
    // ⚠️ 修复前：根应用没卸载 ⇒ Teleport 出去的 notice 还挂在 body 上
    expect(notices().length).toBe(0);
    expect(document.body.textContent).not.toContain('first');
  });

  it('[B] 销毁后重建：只剩新的那一条（没有上一个 app 的残留）', async () => {
    notification.success({ message: 'old' });
    await flush();
    actDestroy();
    await flush();

    notification.success({ message: 'new' });
    await flush();
    expect(notices().length).toBe(1);
    expect(document.body.textContent).toContain('new');
    expect(document.body.textContent).not.toContain('old');
  });

  it('[C] 连续创建/销毁/重建三轮：始终只有一条 notice', async () => {
    for (let i = 0; i < 3; i += 1) {
      notification.success({ message: `round-${i}` });
      await flush();
      expect(notices().length).toBe(1);
      expect(document.body.textContent).toContain(`round-${i}`);
      actDestroy();
      await flush();
      expect(notices().length).toBe(0);
    }
  });

  it('[D] 守卫：实例 API 的 destroy() 仍能清空（既有行为不变）', async () => {
    notification.success({ message: 'bye' });
    await flush();
    expect(notices().length).toBe(1);

    notification.destroy();
    await flush();
    // 离场动效是异步的（先 leave 再摘除），不能再用「一次 flush 后立即为 0」。
    await waitForNoticeCount(0);
  });
});
