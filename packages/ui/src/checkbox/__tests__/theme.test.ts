/**
 * L7 主题矩阵 —— Checkbox **没有 Component Token**（antd 同），全部 alias token。
 * 这一层钉的是：主题无关性（themeTest）+ 关键 alias token 的 var() 消费 +
 * 「无 --apollo-checkbox-* 变量」这条契约。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genCheckboxStyle } from '../style';

themeTest('Checkbox', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Checkbox · 主题无关性', () => {
  const css = genCheckboxStyle('apollo');

  it('尺寸 = controlInteractiveSize（checkboxSize 的来源）', () => {
    // ⚠️ 生成器的声明间是「两空格缩进」—— 跨声明拼接的期望串匹配不上
    expect(css).toContain('width:var(--apollo-control-interactive-size);');
    expect(css).toContain('height:var(--apollo-control-interactive-size);');
  });

  it('勾的几何（:after 的 calc 形态与 antd 产物同构）', () => {
    expect(css).toContain(
      'top:calc(var(--apollo-control-interactive-size) / 2 - var(--apollo-line-width));',
    );
    expect(css).toContain('width:calc(var(--apollo-control-interactive-size) / 14 * 5);');
    expect(css).toContain('height:calc(var(--apollo-control-interactive-size) / 14 * 8);');
    expect(css).toContain('border:var(--apollo-line-width-bold) solid var(--apollo-color-white);');
  });

  it('checked / indeterminate / disabled 三态', () => {
    expect(css).toContain('.apollo-checkbox-checked{');
    expect(css).toContain('background-color:var(--apollo-color-primary);');
    expect(css).toContain('border-color:var(--apollo-color-primary);');
    expect(css).toContain('.apollo-checkbox-indeterminate:after{');
    expect(css).toContain('top:50%;');
    expect(css).toContain('width:calc(var(--apollo-font-size-lg) / 2);');
    expect(css).toContain('background:var(--apollo-color-bg-container-disabled);');
    expect(css).toContain('.apollo-checkbox-disabled+span{');
    expect(css).toContain('color:var(--apollo-color-text-disabled);');
  });

  it('hover 包在 pointer 精细设备的 media query 里', () => {
    expect(css).toContain(
      '@media (hover: hover) and (pointer: fine){.apollo-checkbox-wrapper:not(.apollo-checkbox-wrapper-disabled):hover .apollo-checkbox,',
    );
  });

  it('prefers-reduced-motion 关闭过渡（genNoMotionStyle）', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce){');
  });

  it('ant 前缀产物同构（无 Component Token 变量）', () => {
    const ant = genCheckboxStyle('ant');
    expect(ant).toContain('width:var(--apollo-control-interactive-size);');
    expect(ant).not.toContain('--ant-checkbox-');
    expect(css).not.toContain('--apollo-checkbox-');
  });
});
