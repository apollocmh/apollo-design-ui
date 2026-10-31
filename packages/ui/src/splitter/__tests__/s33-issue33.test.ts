/**
 * Splitter · Issue #33 回归（2 项，先复现后修）。
 */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { Splitter } from '../index';
import type { SplitterProps } from '../interface';

const P = 'apollo-splitter';

const mountSplitter = (props: SplitterProps = {}) =>
  mount(Splitter, {
    attachTo: document.body,
    props: props,
    slots: {
      default: () => [
        h(Splitter.Panel, { class: 'editor', defaultSize: '40%' }, { default: () => 'A' }),
        h(Splitter.Panel, { class: 'preview', defaultSize: '60%' }, { default: () => 'B' }),
      ],
    },
  });

afterEach(() => {
  document.body.innerHTML = '';
});

describe('#33.1 Splitter.Panel 的原生 class 要落到面板节点', () => {
  it('[A] 字符串原生 class 生效', () => {
    const w = mountSplitter();
    const panels = w.findAll(`.${P}-panel`);
    expect(panels.length).toBe(2);
    expect(panels.at(0)?.classes()).toContain('editor');
    expect(panels.at(1)?.classes()).toContain('preview');
    w.unmount();
  });

  it('[B] 数组 / 对象形态也生效（Vue 原生 class）', () => {
    const w = mount(Splitter, {
      attachTo: document.body,
      slots: {
        default: () => [
          h(Splitter.Panel, { class: ['arr-a', { 'arr-on': true }] }, { default: () => 'A' }),
          h(Splitter.Panel, { class: { 'obj-a': true, 'obj-b': false } }, { default: () => 'B' }),
        ],
      },
    });
    const panels = w.findAll(`.${P}-panel`);
    expect(panels.at(0)?.classes()).toContain('arr-a');
    expect(panels.at(0)?.classes()).toContain('arr-on');
    expect(panels.at(1)?.classes()).toContain('obj-a');
    expect(panels.at(1)?.classes()).not.toContain('obj-b');
    w.unmount();
  });

  it('[C] 旧键 className 仍然生效，且与原生 class 共存', () => {
    const w = mount(Splitter, {
      attachTo: document.body,
      slots: {
        default: () => [
          h(
            Splitter.Panel,
            { class: 'native-cls', className: 'legacy-cls' },
            { default: () => 'A' },
          ),
          h(
            Splitter.Panel,
            {},
            {
              default: () => 'B',
            },
          ),
        ],
      },
    });
    const cls = w.findAll(`.${P}-panel`).at(0)?.classes() ?? [];
    expect(cls).toContain('native-cls');
    expect(cls).toContain('legacy-cls');
    w.unmount();
  });

  it('[D] 守卫：语义 `classNames.panel` 与原生 class 同时生效', () => {
    const w = mountSplitter({ classNames: { panel: 'sem-panel' } });
    const cls = w.findAll(`.${P}-panel`).at(0)?.classes() ?? [];
    expect(cls).toContain('sem-panel');
    expect(cls).toContain('editor');
    w.unmount();
  });
});

describe('#33.2 SplitBar 前缀要随 prefixCls 动态更新', () => {
  it('[A] 同实例切换 prefixCls ⇒ bar / dragger / collapse 全部换新前缀', async () => {
    const prefixCls = ref<string | undefined>(undefined);
    const Host = defineComponent({
      setup: () => () =>
        h(
          Splitter,
          { prefixCls: prefixCls.value },
          {
            default: () => [
              h(
                Splitter.Panel,
                {},
                {
                  default: () => 'A',
                },
              ),
              h(
                Splitter.Panel,
                {},
                {
                  default: () => 'B',
                },
              ),
            ],
          },
        ),
    });
    const w = mount(Host, { attachTo: document.body });
    await nextTick();

    expect(document.querySelector(`.${P}-bar`)).not.toBeNull();
    expect(document.querySelector(`.${P}-bar-dragger`)).not.toBeNull();

    prefixCls.value = 'custom-splitter';
    await nextTick();
    await nextTick();

    expect(document.querySelector(`.custom-splitter-bar`)).not.toBeNull();
    expect(document.querySelector(`.custom-splitter-bar-dragger`)).not.toBeNull();
    // 旧前缀不应残留
    expect(document.querySelector(`.${P}-bar`)).toBeNull();
    w.unmount();
  });

  it('[B] 守卫：默认前缀下 collapse bar 的前缀一致', () => {
    const w = mount(Splitter, {
      attachTo: document.body,
      slots: {
        default: () => [
          h(Splitter.Panel, { collapsible: true }, { default: () => 'A' }),
          h(
            Splitter.Panel,
            {},
            {
              default: () => 'B',
            },
          ),
        ],
      },
    });
    const bar = document.querySelector(`.${P}-bar`);
    expect(bar).not.toBeNull();
    expect(bar?.className.split(/\s+/)).toContain(`${P}-bar`);
    w.unmount();
  });
});
