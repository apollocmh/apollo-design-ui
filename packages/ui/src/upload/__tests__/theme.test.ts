/**
 * L7 主题 —— Upload 的 2 个 Component Token 以 CSS 变量声明在组件根
 * （wrapper）；别名色消费 var(--apollo-*)；pictureCardSize 算式为构建期解析值。
 */

import { themeTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import ConfigProvider from '../../config-provider';
import { Upload } from '../index';
import { genTokenDecls, genUploadStyle } from '../style';
import { prepareComponentToken } from '../style/token';

themeTest('Upload', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Upload · token 契约', () => {
  const css = genUploadStyle('apollo');
  const decls = genTokenDecls('apollo');

  it('2 个 Component Token 全部声明（--apollo-upload-*）', () => {
    expect(decls.length).toBe(2);
    expect(css).toContain('--apollo-upload-actions-color:var(--apollo-color-icon);');
    expect(css).toContain(
      '--apollo-upload-picture-card-size:calc(var(--apollo-control-height-lg) * 2.55);',
    );
  });

  it('base 段（wrapper / select / hidden / disabled）', () => {
    expect(css).toContain('.apollo-upload-wrapper .apollo-upload{outline:0;');
    expect(css).toContain('.apollo-upload-wrapper .apollo-upload-select{display:inline-block;}');
    expect(css).toContain('.apollo-upload-wrapper .apollo-upload-hidden{display:none;}');
    expect(css).toContain('.apollo-upload-wrapper [class^="apollo-upload"]');
    expect(css).not.toContain('[class^="ant-upload"]');
  });

  it('dragger 段（-drag / -drag-hover / -drag-container）', () => {
    expect(css).toContain('.apollo-upload-wrapper .apollo-upload-drag{');
    // ⚠️ 这里**没有** `-drag-uploading`：antd 6.6.4 的
    //    `es/upload/style/dragger.js` 全文无 `uploading` 键，上传中不改拖拽区
    //    边框色（只有 hover / disabled 两态）。原断言要求它存在属于**测试与规格
    //    不符**（AGENTS.md §4.2 第 3 条），已改为反向钉死，避免实现凭空加选择器。
    expect(css).not.toContain('drag-uploading');
    expect(css).toContain('.apollo-upload-drag-hover:not(.apollo-upload-disabled)');
    expect(css).toContain('.apollo-upload-drag-container{');
  });

  it('picture-card 段（-picture / -picture-card 缩略图尺寸）', () => {
    expect(css).toContain('.apollo-upload-picture-card-wrapper');
    expect(css).toContain('var(--apollo-upload-picture-card-size)');
  });

  it('list 段（-list-item / -list-item-error / 动效名）', () => {
    expect(css).toContain('.apollo-upload-list-item');
    expect(css).toContain('.apollo-upload-list-item-error');
    expect(css).toContain('.apollo-upload-animate');
    expect(css).toContain('.apollo-upload-animate-inline');
  });

  it('action 按钮色消费 actionsColor token', () => {
    expect(css).toContain('var(--apollo-upload-actions-color)');
  });

  it('动画名稳定化（占位名会静默失配 ⇒ motion 卡死，2026-10-08）', () => {
    // cssinjs 开发态占位名（`css-dev-only-do-not-override-…`）在静态 CSS 里
    // 没有对应的 @keyframes ⇒ 动画不跑、animationend 不触发。
    expect(css).not.toContain('css-dev-only-do-not-override');
    expect(css).toContain('@keyframes apollo-fade-in');
    expect(css).toContain('@keyframes apollo-fade-out');
    expect(css).toContain('@keyframes apollo-upload-animate-inline-in');
    expect(css).toContain('@keyframes apollo-upload-animate-inline-out');
    expect(css).toContain('animation-name:apollo-fade-in');
    expect(css).toContain('animation-name:apollo-upload-animate-inline-in');
  });
});

describe('Upload current theme source', () => {
  it('projects current component tokens, aliases and native overrides with reversible clearing', async () => {
    const phase = ref(0);
    const native = ref(false);
    const Host = defineComponent({
      setup: () => () =>
        h(
          ConfigProvider,
          {
            theme:
              phase.value === 2
                ? undefined
                : {
                    token: {
                      colorIcon: phase.value === 0 ? '#112233' : '#445566',
                      controlHeightLG: phase.value === 0 ? 44 : 48,
                    },
                    components:
                      phase.value === 0
                        ? { Upload: { pictureCardSize: 140, actionsColor: '#abcdef' } }
                        : undefined,
                  },
          },
          {
            default: () =>
              h(
                Upload,
                {
                  listType: 'picture-card',
                  style: native.value
                    ? { '--apollo-upload-picture-card-size': '160px' }
                    : undefined,
                },
                () => '+',
              ),
          },
        ),
    });
    const wrapper = mount(Host, { global: { stubs: { teleport: false } } });
    const root = () => wrapper.get<HTMLElement>('.apollo-upload-wrapper').element;
    expect(root().style.getPropertyValue('--apollo-upload-picture-card-size')).toBe('140px');
    expect(root().style.getPropertyValue('--apollo-upload-actions-color')).toBe('#abcdef');
    phase.value = 1;
    await nextTick();
    expect(
      Number.parseFloat(root().style.getPropertyValue('--apollo-upload-picture-card-size')),
    ).toBeCloseTo(122.4);
    expect(root().style.getPropertyValue('--apollo-upload-actions-color')).toBe(
      'var(--apollo-color-icon)',
    );
    expect(root().style.getPropertyValue('--apollo-color-icon')).toBe('#445566');
    native.value = true;
    await nextTick();
    expect(root().style.getPropertyValue('--apollo-upload-picture-card-size')).toBe('160px');
    native.value = false;
    phase.value = 2;
    await nextTick();
    expect(root().style.getPropertyValue('--apollo-upload-picture-card-size')).toBe('');
    expect(root().style.getPropertyValue('--apollo-color-icon')).toBe('');
    wrapper.unmount();
  });
});

describe('Upload · prepareComponentToken 判据', () => {
  const token = prepareComponentToken({
    colorIcon: 'rgba(0, 0, 0, 0.45)',
    controlHeightLG: 40,
    fontSizeHeading3: 20,
    marginXS: 8,
    lineWidth: 1,
  });

  it('pictureCardSize = controlHeightLG * 2.55 = 102px', () => {
    expect(token.pictureCardSize).toBe('102px');
  });
  it('actionsColor 走 var(--apollo-color-icon)', () => {
    expect(token.actionsColor).toBe('var(--apollo-color-icon)');
  });
});
