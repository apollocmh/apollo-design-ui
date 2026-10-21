/**
 * Issue #43 · [Message] 全局 Holder 销毁未卸载 Vue app
 *
 * `flushMessageQueue()` 用 `createApp(GlobalHolder).mount(container)` 建根应用，
 * 但 `actDestroy()` 只把模块变量置回初始值 —— **没有 `app.unmount()`** ⇒
 * 上一个根应用连同它的 watch / Teleport 出去的 notice 节点一起留着（Issue #43.1）。
 *
 * 可观测点：notice 经 Teleport 落到 `document.body`，所以「销毁后 notice 是否还在」
 * 就是「根应用有没有被卸载」的直接证据。
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

/** 等离场节点真正移除（`destroy()` 先播 leave；jsdom 无 transition ⇒ 500ms deadline）。 */
async function waitForNoticeCount(count: number, timeout = 2000): Promise<void> {
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

describe('Message · Issue #43 actDestroy 必须卸载根应用', () => {
  it('[A] actDestroy() 后旧 holder 的 notice 从 DOM 消失（核心回归）', async () => {
    message.success('first');
    await flush();
    expect(notices().length).toBe(1);

    actDestroy();
    await flush();
    // ⚠️ 修复前：根应用没卸载 ⇒ Teleport 出去的 notice 还挂在 body 上
    expect(notices().length).toBe(0);
    expect(document.body.textContent).not.toContain('first');
  });

  it('[B] 销毁后重建：只剩新的那一条（没有上一个 app 的残留）', async () => {
    message.success('old');
    await flush();
    actDestroy();
    await flush();

    message.success('new');
    await flush();
    expect(notices().length).toBe(1);
    expect(document.body.textContent).toContain('new');
    expect(document.body.textContent).not.toContain('old');
  });

  it('[C] 连续创建/销毁/重建三轮：始终只有一条 notice', async () => {
    for (let i = 0; i < 3; i += 1) {
      message.success(`round-${i}`);
      await flush();
      expect(notices().length).toBe(1);
      expect(document.body.textContent).toContain(`round-${i}`);
      actDestroy();
      await flush();
      expect(notices().length).toBe(0);
    }
  });

  it('[D] 守卫：实例 API 的 destroy() 仍能清空（既有行为不变）', async () => {
    message.success('bye');
    await flush();
    expect(notices().length).toBe(1);

    message.destroy();
    await flush();
    // 离场动画是异步的：先 leave，再按 500ms deadline 摘除
    await waitForNoticeCount(0);
  });
});
