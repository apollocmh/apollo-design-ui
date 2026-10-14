/**
 * Issue #35 · [Spin] 全局尺寸配置继承失效
 *
 * antd 6.6.4 是 `useSize((ctxSize) => size ?? ctxSize)`；本仓 Spin 写的是
 * `computed(() => props.size)` ⇒ ConfigProvider 的 `componentSize` 完全不参与
 * （Issue #35.1）。
 *
 * 覆盖矩阵：全局 small / large / middle / medium、局部覆盖、运行时更新、嵌套
 * Provider、函数式语义槽里的 `info.props.size`。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Spin } from '../index';
import type { SpinSize } from '../interface';

const P = 'apollo-spin';

/** ConfigProvider（componentSize）包裹 Spin。 */
const withSize = (componentSize: string | undefined, spinProps: Record<string, unknown> = {}) =>
  mount(ConfigProvider, {
    props: { componentSize: componentSize as never },
    slots: { default: () => h(Spin, spinProps) },
    attachTo: document.body,
  });

const cls = (w: ReturnType<typeof withSize>) => Array.from(w.find(`.${P}`).element.classList);

describe('Spin · Issue #35 继承 ConfigProvider componentSize', () => {
  it('[A] 守卫：无 Provider、无 size ⇒ 既不是 -sm 也不是 -lg', () => {
    const w = mount(Spin);
    expect(w.find(`.${P}`).classes()).not.toContain(`${P}-sm`);
    expect(w.find(`.${P}`).classes()).not.toContain(`${P}-lg`);
    w.unmount();
  });

  it('[B] 全局 small ⇒ 根上 -sm', async () => {
    const w = withSize('small');
    await nextTick();
    expect(cls(w)).toContain(`${P}-sm`);
    expect(cls(w)).not.toContain(`${P}-lg`);
    w.unmount();
  });

  it('[C] 全局 large ⇒ 根上 -lg', async () => {
    const w = withSize('large');
    await nextTick();
    expect(cls(w)).toContain(`${P}-lg`);
    expect(cls(w)).not.toContain(`${P}-sm`);
    w.unmount();
  });

  it('[D] 全局 middle / medium ⇒ 无尺寸类（守卫，Spin 只对 small/large 出类）', async () => {
    for (const size of ['middle', 'medium']) {
      const w = withSize(size);
      await nextTick();
      expect(cls(w)).not.toContain(`${P}-sm`);
      expect(cls(w)).not.toContain(`${P}-lg`);
      w.unmount();
    }
  });

  it('[E] 局部 size 覆盖全局（small 全局 + large 局部 ⇒ -lg）', async () => {
    const w = withSize('small', { size: 'large' });
    await nextTick();
    expect(cls(w)).toContain(`${P}-lg`);
    expect(cls(w)).not.toContain(`${P}-sm`);
    w.unmount();
  });

  it('[F] 运行时变更 componentSize：small → large 类名跟着变（核心回归）', async () => {
    const w = withSize('small');
    await nextTick();
    expect(cls(w)).toContain(`${P}-sm`);

    await w.setProps({ componentSize: 'large' as never });
    await nextTick();
    expect(cls(w)).toContain(`${P}-lg`);
    expect(cls(w)).not.toContain(`${P}-sm`);

    await w.setProps({ componentSize: undefined });
    await nextTick();
    expect(cls(w)).not.toContain(`${P}-lg`);
    expect(cls(w)).not.toContain(`${P}-sm`);
    w.unmount();
  });

  it('[G] 局部 size 运行时更新同样生效（守卫：不是只读首帧）', async () => {
    const size = ref<SpinSize | undefined>(undefined);
    const Parent = defineComponent({
      setup() {
        return () => h(Spin, { size: size.value });
      },
    });
    const p = mount(ConfigProvider, {
      props: { componentSize: 'small' as never },
      slots: { default: () => h(Parent) },
      attachTo: document.body,
    });
    await nextTick();
    expect(Array.from(p.find(`.${P}`).element.classList)).toContain(`${P}-sm`);

    size.value = 'large';
    await nextTick();
    expect(Array.from(p.find(`.${P}`).element.classList)).toContain(`${P}-lg`);
    expect(Array.from(p.find(`.${P}`).element.classList)).not.toContain(`${P}-sm`);
    p.unmount();
  });

  it('[H] 嵌套 Provider：内层覆盖外层；内层不设则继承外层', async () => {
    const inner = (componentSize?: string) =>
      mount(ConfigProvider, {
        props: { componentSize: 'large' as never },
        slots: {
          default: () =>
            h(
              ConfigProvider,
              { componentSize: componentSize as never },
              {
                default: () => h(Spin),
              },
            ),
        },
        attachTo: document.body,
      });

    const overridden = inner('small');
    await nextTick();
    expect(cls(overridden)).toContain(`${P}-sm`);
    expect(cls(overridden)).not.toContain(`${P}-lg`);
    overridden.unmount();

    const inherited = inner(undefined);
    await nextTick();
    expect(cls(inherited)).toContain(`${P}-lg`);
    inherited.unmount();
  });

  it('[I] 函数式 classNames 的 info.props.size 能读到全局尺寸（semanticProps 同步）', async () => {
    const w = mount(ConfigProvider, {
      props: { componentSize: 'small' as never },
      slots: {
        default: () =>
          h(Spin, {
            classNames: (info: { props: { size?: string } }) =>
              info.props.size === 'small' ? { root: 'fn-small' } : { root: 'fn-other' },
          } as never),
      },
      attachTo: document.body,
    });
    await nextTick();
    expect(cls(w)).toContain('fn-small');
    w.unmount();
  });
});
