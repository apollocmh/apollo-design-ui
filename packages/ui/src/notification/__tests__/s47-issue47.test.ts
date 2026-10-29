/**
 * Issue #47 · [Notification] 运行时语言切换后的关闭标签（契约验证）
 *
 * 上游判据（antd 6.6.4 `es/notification/useNotification.js`）：
 * `Holder` 用 `useImperativeHandle(ref, () => ({ ..., closeLabel: contextLocale.close ?? ... }))`
 * —— **没有依赖数组** ⇒ React 每次 render 都重建 imperative handle ⇒ `closeLabel` 是「活的」。
 * `open()` 每次从 `holderRef.current` 现读 ⇒ **切语言后新开的通知拿新文案**。
 *
 * 历史缺陷是 setup 快照。当前 canonical useLocale 是 ComputedRef；
 * 已存在通知也按 Apollo 当前裁决更新默认关闭文案。
 *
 * 复现走官方路径：Holder 挂在 `LocaleProvider` 内（hook 形态），
 * 先用 en 开一条，切 zh 后再开一条，断言两条的关闭按钮 `aria-label`。
 */

import { ANT_MARK, LocaleProvider } from '@apollo-design/locale';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

import type { NotificationInstance } from '../interface';
import useNotification from '../useNotification';

/** holder 挂载 + 队列回放 + Teleport 提交：一次 nextTick 不够（与 index.test.ts 同判）。 */
async function flush(times = 6): Promise<void> {
  for (let i = 0; i < times; i += 1) {
    await Promise.resolve();
    await nextTick();
  }
}

const notices = () => Array.from(document.querySelectorAll('.apollo-notification-notice'));

const noticeByTitle = (title: string) =>
  notices().find(
    (n) => n.querySelector('.apollo-notification-notice-title')?.textContent === title,
  );

const closeLabelOf = (title: string) =>
  noticeByTitle(title)
    ?.querySelector('.apollo-notification-notice-close')
    ?.getAttribute('aria-label');

const enUS = { locale: 'en-US', global: { close: 'Close' } };
const zhCN = { locale: 'zh-CN', global: { close: '关闭' } };

/** hook 形态的 Holder，挂在 `LocaleProvider` 内（这样 locale 才能注入到 Holder）。 */
function mountHost(localeRef: { value: unknown }) {
  let api: NotificationInstance | undefined;
  const Host = defineComponent({
    name: 'Host',
    setup() {
      const [instance, holder] = useNotification();
      api = instance;
      return () =>
        h(
          LocaleProvider,
          { locale: localeRef.value as never, _ANT_MARK__: ANT_MARK },
          { default: () => holder() },
        );
    },
  });
  const wrapper = mount(Host, { attachTo: document.body, global: { stubs: { teleport: false } } });
  return { wrapper, getApi: () => api! };
}

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Notification · Issue #47 运行时语言切换后的关闭标签', () => {
  it('[A] 切语言后【新开】的通知关闭按钮 aria-label 跟随新 locale（核心回归）', async () => {
    const locale = ref(enUS);
    const { wrapper, getApi } = mountHost(locale);
    await flush();

    getApi().open({ title: 'first' });
    await flush();
    expect(closeLabelOf('first')).toBe('Close');

    // 切语言（不卸载任何东西）
    locale.value = zhCN;
    await flush();

    getApi().open({ title: 'second' });
    await flush();
    expect(closeLabelOf('second')).toBe('关闭');

    wrapper.unmount();
  });

  it('[B] 守卫：不挂 Provider ⇒ 兜底 en 的 `Close`', async () => {
    let api: NotificationInstance | undefined;
    const Host = defineComponent({
      name: 'HostNoProvider',
      setup() {
        const [instance, holder] = useNotification();
        api = instance;
        return () => h('div', [holder()]);
      },
    });
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await flush();

    api!.open({ title: 'solo' });
    await flush();
    expect(closeLabelOf('solo')).toBe('Close');

    wrapper.unmount();
  });

  it('[C] 已存在通知跟随当前关闭文案，保留 notice 身份', async () => {
    const locale = ref(enUS);
    const { wrapper, getApi } = mountHost(locale);
    await flush();

    getApi().open({ title: 'old' });
    await flush();
    expect(closeLabelOf('old')).toBe('Close');

    const original = noticeByTitle('old');
    locale.value = zhCN;
    await flush();

    // 2026-10-29 集中裁决：默认关闭文案是当前 Provider 派生值。
    // 用户显式 aria-label 优先，正文/notice 不因语言更新重建。
    expect(closeLabelOf('old')).toBe('关闭');
    expect(noticeByTitle('old')).toBe(original);

    wrapper.unmount();
  });
});
