/**
 * L7 主题 —— Tree 的 Component Token（**9 个自有字段**：7 shared + 2 directory）。
 *
 * 钉：主题无关性（themeTest）+ token 判定值（与 antd 6.6.4 产物逐字对拍，
 * 见 style/token.ts 头注释 / docs/analysis/tree.md §5）+ 变量声明单位规则
 * （title/switcher/indent 三个尺寸带 px）+ 展开动效类（-motion-collapse）。
 */

import { themeTest } from '@apollo-design/test-utils';
import { getDesignToken, ThemeProvider } from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import DirectoryTree from '../DirectoryTree';
import NodeList from '../NodeList';
import { genTreeStyle, genTreeTokenDecls } from '../style';
import { prepareComponentToken } from '../style/token';
import Tree from '../Tree';

themeTest('Tree', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Tree · Component Token 判定值（antd 产物逐字对拍）', () => {
  const t = prepareComponentToken(getDesignToken() as never);

  it('9 个字段（G3 产物对拍：extract-tree-css.mjs）', () => {
    expect(t.titleHeight).toBe(24); // controlHeightSM
    expect(t.switcherSize).toBe(24);
    expect(t.indentSize).toBe(24);
    expect(t.nodeHoverBg).toBe('rgba(0,0,0,0.04)'); // controlItemBgHover
    expect(t.nodeHoverColor).toBe('rgba(0,0,0,0.88)'); // colorText
    expect(t.nodeSelectedBg).toBe('#e6f4ff'); // controlItemBgActive
    expect(t.nodeSelectedColor).toBe('rgba(0,0,0,0.88)');
    expect(t.directoryNodeSelectedColor).toBe('#fff'); // colorTextLightSolid
    expect(t.directoryNodeSelectedBg).toBe('#1677ff'); // colorPrimary
  });
});

describe('Tree · 静态 CSS（变量声明 / var() 消费 / 动效类）', () => {
  const css = genTreeStyle('apollo');
  const decls = genTreeTokenDecls();

  it('component defaults follow the current CSS aliases', () => {
    expect(decls).toContain('--apollo-tree-title-height:var(--apollo-control-height-sm);');
    expect(decls).toContain('--apollo-tree-switcher-size:var(--apollo-tree-title-height);');
    expect(decls).toContain('--apollo-tree-indent-size:var(--apollo-tree-title-height);');
    expect(decls).toContain('--apollo-tree-node-hover-bg:var(--apollo-control-item-bg-hover);');
    expect(decls).toContain('--apollo-tree-node-selected-bg:var(--apollo-control-item-bg-active);');
    expect(decls).toContain(
      '--apollo-tree-directory-node-selected-color:var(--apollo-color-text-light-solid);',
    );
    expect(decls).toContain(
      '--apollo-tree-directory-node-selected-bg:var(--apollo-color-primary);',
    );
  });

  it('关键选择器消费 token 变量', () => {
    expect(css).toContain('line-height:var(--apollo-tree-title-height);');
    expect(css).toContain('width:var(--apollo-tree-switcher-size);');
    // ⚠️ 上游怪值：选中态用的是 `color: var(--node-selected-bg)`（非 background）
    expect(css).toContain('background-color:var(--apollo-tree-node-selected-bg);');
    expect(css).toContain('color:var(--apollo-tree-directory-node-selected-color);');
  });

  it('展开动效类 -motion-collapse（-legacy/-active 三件套）', () => {
    expect(css).toContain('.apollo-tree .apollo-motion-collapse-legacy-active');
    expect(css).toContain('.apollo-tree .apollo-motion-collapse');
  });

  it('checkbox 视觉（antd 自定义勾选框非原生）', () => {
    expect(css).toContain('.apollo-tree .apollo-tree-checkbox');
    expect(css).toContain('.apollo-tree-checkbox-indeterminate');
    expect(css).toContain('.apollo-tree-checkbox-checked:after');
  });

  it('自定义前缀替换（R9：genTreeStyle(prefixCls)）', () => {
    const custom = genTreeStyle('x');
    expect(custom).toContain('.x-tree{');
    expect(custom).not.toContain('.apollo-tree');
  });
});

describe('Tree current source tokens', () => {
  it('projects every component token, sizes virtual rows and restores dynamic defaults', async () => {
    const custom = ref(true);
    const overrides = {
      titleHeight: 40,
      switcherSize: 36,
      indentSize: 32,
      nodeHoverBg: '#112233',
      nodeHoverColor: '#223344',
      nodeSelectedBg: '#334455',
      nodeSelectedColor: '#445566',
      directoryNodeSelectedColor: '#556677',
      directoryNodeSelectedBg: '#667788',
    };
    const wrapper = mount(
      defineComponent(
        () => () =>
          h(
            ThemeProvider,
            {
              theme: { components: { Tree: custom.value ? overrides : {} } },
            },
            () => [
              h(Tree, { treeData: [{ key: 'one', title: 'One' }], height: 80 }),
              h(DirectoryTree, { treeData: [{ key: 'two', title: 'Two' }] }),
            ],
          ),
      ),
    );
    const tree = wrapper.get<HTMLElement>('.apollo-tree');
    for (const [name, value] of Object.entries(overrides)) {
      const variable = `--apollo-tree-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
      expect(tree.element.style.getPropertyValue(variable)).toBe(
        typeof value === 'number' ? `${value}px` : value,
      );
    }
    expect(wrapper.findComponent(NodeList).props('itemHeight')).toBe(44);
    custom.value = false;
    await nextTick();
    expect(tree.element.style.getPropertyValue('--apollo-tree-title-height')).toBe('24px');
    expect(wrapper.findComponent(NodeList).props('itemHeight')).toBe(28);
    wrapper.unmount();
  });

  it('keeps nested and native style overrides on their own trees', () => {
    const wrapper = mount(ThemeProvider, {
      props: { theme: { components: { Tree: { titleHeight: 30 } } } },
      slots: {
        default: () => [
          h(Tree, { treeData: [] }),
          h(ThemeProvider, { theme: { components: { Tree: { titleHeight: 40 } } } }, () =>
            h(Tree, { treeData: [], style: { '--apollo-tree-title-height': '50px' } }),
          ),
        ],
      },
    });
    expect(
      wrapper
        .findAll<HTMLElement>('.apollo-tree')
        .map((node) => node.element.style.getPropertyValue('--apollo-tree-title-height')),
    ).toEqual(['30px', '50px']);
    wrapper.unmount();
  });
});
