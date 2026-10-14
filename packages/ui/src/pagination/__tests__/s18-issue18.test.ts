/**
 * Issue #18 回归：`showSizeChanger` 的三态归一必须每读现算。
 *
 * 判据（useShowSizeChanger.ts 头注释）：
 *   boolean ⇒ [该布尔, {}] · isPlainObject ⇒ [true, 该对象] · 未传 ⇒ [undefined, undefined]
 * 合并：`props 结果 ?? ConfigProvider 结果 ?? total > totalBoundaryShowSizeChanger`。
 * ⚠️ 它是**纯函数**，在 setup 里调用一次 = 快照 ⇒ props/Provider 后续变化不参与重算。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, provide, reactive } from 'vue';
import Pagination from '../Pagination.vue';

const P = 'apollo-pagination';

const mountPg = (props: Record<string, unknown> = {}) =>
  mount(Pagination, { props: { total: 30, ...props } as never });

describe('Pagination · Issue #18 showSizeChanger 响应性', () => {
  it('[A] props false ⇒ true：尺寸切换器由隐到显', async () => {
    const w = mountPg({ showSizeChanger: false });
    await nextTick();
    expect(w.find(`.${P}-options`).exists()).toBe(false);

    await w.setProps({ showSizeChanger: true } as never);
    await nextTick();
    expect(w.find(`.${P}-options`).exists()).toBe(true);
    w.unmount();
  });

  it('[B] 对象形态：className 变更同步到 Select', async () => {
    const w = mountPg({ showSizeChanger: { className: 'sc-a' } });
    await nextTick();
    const select = () => w.find('.apollo-select');
    expect(select().classes()).toContain('sc-a');

    await w.setProps({ showSizeChanger: { className: 'sc-b' } } as never);
    await nextTick();
    expect(select().classes()).toContain('sc-b');
    expect(select().classes()).not.toContain('sc-a');
    w.unmount();
  });

  it('[C] 对象 ⇒ false：显式关闭能盖掉对象形态', async () => {
    const w = mountPg({ showSizeChanger: { className: 'sc-a' } });
    await nextTick();
    expect(w.find(`.${P}-options`).exists()).toBe(true);

    await w.setProps({ showSizeChanger: false } as never);
    await nextTick();
    expect(w.find(`.${P}-options`).exists()).toBe(false);
    w.unmount();
  });

  it('[D] ConfigProvider 配置运行时变更同步', async () => {
    const { configContextKey, DEFAULT_CONFIG_CONTEXT } = await import(
      '../../config-provider/context'
    );
    // ⚠️ 组件配置收在 `components.pagination` 下（useComponentConfig 读它）
    const cfg = reactive<{ showSizeChanger: boolean | Record<string, unknown> }>({
      showSizeChanger: false,
    });
    const Host = defineComponent({
      setup() {
        provide(
          configContextKey as never,
          {
            ...DEFAULT_CONFIG_CONTEXT,
            components: { pagination: cfg },
          } as never,
        );
        return () => h(Pagination as never, { total: 30 } as never);
      },
    });
    const w = mount(Host);
    await nextTick();
    expect(w.find(`.${P}-options`).exists()).toBe(false);

    cfg.showSizeChanger = true;
    await nextTick();
    expect(w.find(`.${P}-options`).exists()).toBe(true);
    w.unmount();
  });
});
