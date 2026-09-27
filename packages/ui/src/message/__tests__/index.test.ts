/**
 * L1/L2 —— message 的行为测试（命令式 API + hooks 形态）。
 *
 * ⚠️ 命令式路径整体走 portal（`document.body`）且 holder 是**模块级单例**：
 *   - 断言在 `document.body` 上找，不在 wrapper 里找；
 *   - 每条用例前必须 `actDestroy()` 复位（否则上一条的实例会被复用）。
 */
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';

import message, { actDestroy } from '..';
import PureList from '../PureList';
import PurePanel from '../PurePanel';
import useMessage from '../useMessage';

/** holder 挂载 + 队列回放 + Teleport 提交：一次 nextTick 不够。 */
async function flush(times = 6): Promise<void> {
  for (let i = 0; i < times; i += 1) {
    await Promise.resolve();
    await nextTick();
  }
}

const notices = () => Array.from(document.querySelectorAll('.apollo-message-notice'));

beforeEach(() => {
  actDestroy();
  document.body.innerHTML = '';
});

afterEach(() => {
  actDestroy();
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('message · 命令式 API', () => {
  it('success 渲染一条消息（notice + 类型类 + 类型图标 + 标题）', async () => {
    message.success('Hello');
    await flush();

    expect(notices()).toHaveLength(1);
    const notice = notices()[0]!;
    expect(notice.className).toContain('apollo-message-notice');
    expect(notice.className).toContain('apollo-message-notice-success');
    expect(notice.querySelector('.apollo-message-notice-wrapper')?.className).toContain(
      'apollo-message-success',
    );
    expect(notice.querySelector('.apollo-message-notice-icon')?.className).toContain(
      'apollo-message-notice-icon-success',
    );
    expect(notice.querySelector('.apollo-message-notice-title')?.textContent).toBe('Hello');
  });

  it('五条类型方法都能渲染（info/success/warning/error/loading）', async () => {
    message.info('i');
    message.success('s');
    message.warning('w');
    message.error('e');
    message.loading('l');
    await flush();

    expect(notices()).toHaveLength(5);
    for (const type of ['info', 'success', 'warning', 'error', 'loading']) {
      expect(document.querySelector(`.apollo-message-notice-icon-${type}`)).not.toBeNull();
    }
  });

  it('open({content, type, key, icon}) —— 自定义图标优先，类型类仍叠加', async () => {
    message.open({ content: 'x', type: 'success', key: 'k1', icon: h('i', { class: 'my-icon' }) });
    await flush();

    // ⚠️ 上游语义：`icon` 优先决定**渲染哪个图标**，但 `-notice-icon-{type}` 类恒叠加
    //    （`getMessageIcon` 只挑节点，类名由 `classNames.icon` 拼）
    expect(document.querySelector('.my-icon')).not.toBeNull();
    expect(document.querySelector('.apollo-message-notice-icon')?.className).toContain(
      'apollo-message-notice-icon-success',
    );
  });

  it('destroy() 清空；destroy(key) 只关那一条', async () => {
    message.open({ content: 'a', key: 'a' });
    message.open({ content: 'b', key: 'b' });
    await flush();
    expect(notices()).toHaveLength(2);

    message.destroy('a');
    await flush();
    expect(notices()).toHaveLength(1);
    expect(document.body.textContent).toContain('b');

    message.destroy();
    await flush();
    expect(notices()).toHaveLength(0);
  });

  it('返回值可调用（调用即关闭）；promise 在**自然关闭**后 resolve true', async () => {
    const result = message.success('closable');
    await flush();
    expect(notices()).toHaveLength(1);

    // 手动关闭：notice 消失
    result();
    await flush();
    expect(notices()).toHaveLength(0);
  });

  it('promise / then 在计时到点（自然关闭）后 resolve true', async () => {
    vi.useFakeTimers();
    const result = message.open({ content: 'timed', duration: 1 });
    await flush();

    let resolved = false;
    result.then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(1200);
    await flush();
    expect(resolved).toBe(true);
    await expect(result.promise).resolves.toBe(true);
  });

  it('duration 到点自动关闭', async () => {
    vi.useFakeTimers();
    message.open({ content: 'timed', duration: 1 });
    await flush();
    expect(notices()).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(1200);
    await flush();
    expect(notices()).toHaveLength(0);
  });

  it('onClose 在**自然关闭**时被调用一次（手动关闭不调 —— 上游语义）', async () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    message.open({ content: 'x', duration: 1, onClose });
    await flush();
    expect(onClose).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1200);
    await flush();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('typeOpen 的第二参传函数 ⇒ 视为 onClose（第三参被忽略）', async () => {
    vi.useFakeTimers();
    const first = vi.fn();
    const second = vi.fn();
    message.success('x', first, second);
    await flush();

    // 默认时长 3s 到点 ⇒ onClose 是第二参那个函数
    await vi.advanceTimersByTimeAsync(3200);
    await flush();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });

  it('onClick 落在 notice 根上', async () => {
    const onClick = vi.fn();
    message.open({ content: 'clickable', onClick });
    await flush();

    notices()[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('未传 key 时自动生成唯一 key（两条不会互相顶掉）', async () => {
    message.success('one');
    message.success('two');
    await flush();
    expect(notices()).toHaveLength(2);
  });
});

describe('message · config()', () => {
  it('top 写成 CSS 变量（number ⇒ px）', async () => {
    message.config({ top: 100 });
    message.success('x');
    await flush();

    const list = document.querySelector('.apollo-message-list') as HTMLElement | null;
    expect(list?.getAttribute('style')).toContain('--notification-top: 100px');
  });

  it('maxCount 只保留最后 N 条', async () => {
    message.config({ maxCount: 2 });
    message.success('1');
    message.success('2');
    message.success('3');
    await flush();

    expect(notices()).toHaveLength(2);
    expect(document.body.textContent).toContain('2');
    expect(document.body.textContent).toContain('3');
    expect(document.body.textContent).not.toContain('1');
  });

  it('rtl 给列表根加 -rtl 类', async () => {
    message.config({ rtl: true });
    message.success('x');
    await flush();

    expect(document.querySelector('.apollo-message-rtl')).not.toBeNull();
  });

  it('getContainer 决定 portal 目标', async () => {
    const container = document.createElement('div');
    container.id = 'my-message-container';
    document.body.appendChild(container);

    message.config({ getContainer: () => container });
    message.success('x');
    await flush();

    expect(container.querySelectorAll('.apollo-message-notice')).toHaveLength(1);
  });

  it('prefixCls 决定类名前缀', async () => {
    message.config({ prefixCls: 'my-msg' });
    message.success('x');
    await flush();

    expect(document.querySelector('.my-msg-notice')).not.toBeNull();
  });
});

describe('message · useMessage()', () => {
  function mountHook(config: Parameters<typeof useMessage>[0] = { duration: 0 }) {
    const apiRef: { current?: ReturnType<typeof useMessage>[0] } = {};
    const Host = defineComponent({
      name: 'MessageHost',
      setup() {
        const [api, holder] = useMessage(config);
        apiRef.current = api;
        return () => h('div', [holder()]);
      },
    });
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    return { wrapper, api: () => apiRef.current! };
  }

  it('hook 形态能打开/关闭消息（走组件树，不是全局单例）', async () => {
    const { wrapper, api } = mountHook();
    await flush();

    api().success('from hook');
    await flush();
    expect(notices()).toHaveLength(1);

    api().destroy();
    await flush();
    expect(notices()).toHaveLength(0);
    wrapper.unmount();
  });

  it('useMessage 的 classNames/styles 生效（语义槽）', async () => {
    const { wrapper, api } = mountHook({
      duration: 0,
      classNames: { root: 'my-root', wrapper: 'my-wrapper', icon: 'my-icon' },
    });
    await flush();
    api().success('semantic');
    await flush();

    expect(notices()).toHaveLength(1);
    expect(document.querySelector('.apollo-message-notice')?.className).toContain('my-root');
    expect(document.querySelector('.apollo-message-notice-wrapper')?.className).toContain(
      'my-wrapper',
    );
    wrapper.unmount();
  });
});

describe('message · 静态面板（_Internal*）', () => {
  it('PurePanel 渲染单条（根类是 -notice-pure-panel，且不 portal）', () => {
    const wrapper = mount(PurePanel, { props: { type: 'success', content: 'panel' } });
    expect(wrapper.find('.apollo-message-notice-pure-panel').exists()).toBe(true);
    expect(wrapper.find('.apollo-message-notice').exists()).toBe(true);
    expect(wrapper.find('.apollo-message-notice-icon-success').exists()).toBe(true);
    expect(wrapper.text()).toContain('panel');
    wrapper.unmount();
  });

  it('PureList 渲染多条（placement=top 的列表根）', () => {
    const wrapper = mount(PureList, {
      props: {
        items: [
          { key: 'a', content: 'one', type: 'info' },
          { key: 'b', content: 'two', type: 'error' },
        ],
      },
    });
    expect(wrapper.find('.apollo-message-list').exists()).toBe(true);
    expect(wrapper.findAll('.apollo-message-notice')).toHaveLength(2);
    expect(wrapper.find('.apollo-message-notice-icon-error').exists()).toBe(true);
    wrapper.unmount();
  });
});
