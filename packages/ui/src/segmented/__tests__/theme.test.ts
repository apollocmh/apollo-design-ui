/**
 * L7 主题矩阵 —— Segmented 有 **8 个 Component Token**（antd 同，规则 R7 逐字段对齐）。
 * 钉：主题无关性（themeTest）+ Token 声明形态 + 关键 token 的 var() 消费。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { genSegmentedStyle, genTokenDecls as genSegmentedTokenDecls } from '../style';

themeTest('Segmented', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Segmented · 主题无关性', () => {
  const css = genSegmentedStyle('apollo');
  const decls = genSegmentedTokenDecls('apollo');

  it('Component Token 恰好 8 个（antd 的 ComponentToken 接口全字段）', () => {
    expect(decls).toHaveLength(8);
    expect(css).toContain('--apollo-segmented-item-color:var(--apollo-color-text-label);');
    expect(css).toContain('--apollo-segmented-item-hover-color:var(--apollo-color-text);');
    expect(css).toContain('--apollo-segmented-item-hover-bg:var(--apollo-color-fill-secondary);');
    expect(css).toContain('--apollo-segmented-item-active-bg:var(--apollo-color-fill);');
    expect(css).toContain('--apollo-segmented-item-selected-bg:var(--apollo-color-bg-elevated);');
    expect(css).toContain('--apollo-segmented-item-selected-color:var(--apollo-color-text);');
    expect(css).toContain('--apollo-segmented-track-padding:var(--apollo-line-width-bold);');
    expect(css).toContain('--apollo-segmented-track-bg:var(--apollo-color-bg-layout);');
  });

  it('labelHeight 派生（controlHeight − trackPadding×2，三档）', () => {
    expect(css).toContain(
      'min-height:calc(var(--apollo-control-height) - var(--apollo-segmented-track-padding) * 2);',
    );
    expect(css).toContain(
      'min-height:calc(var(--apollo-control-height-lg) - var(--apollo-segmented-track-padding) * 2);',
    );
    expect(css).toContain(
      'min-height:calc(var(--apollo-control-height-sm) - var(--apollo-segmented-track-padding) * 2);',
    );
  });

  it('segmentedPaddingHorizontal 派生（controlPaddingHorizontal − lineWidth）', () => {
    expect(css).toContain(
      'padding:0 calc(var(--apollo-control-padding-horizontal) - var(--apollo-line-width));',
    );
    expect(css).toContain(
      'padding:0 calc(var(--apollo-control-padding-horizontal-sm) - var(--apollo-line-width));',
    );
  });

  it('thumb motion 的过渡（motionDurationSlow × motionEaseInOut）', () => {
    expect(css).toContain(
      'transition:transform var(--apollo-motion-duration-slow) var(--apollo-motion-ease-in-out),width var(--apollo-motion-duration-slow) var(--apollo-motion-ease-in-out);',
    );
  });

  it('shape:round 全圆角（9999px）', () => {
    expect(css).toContain('.apollo-segmented-shape-round{');
    expect(css).toContain('border-radius:9999px;');
  });

  it('上游渲染怪癖保留（Safari translateZ、thumb 兄弟选择器）', () => {
    // 上游 issue 45250：Safari 渲染 bug 的 translateZ(0)
    expect(css).toContain('transform:translateZ(0);');
    // thumb 存在期间非选中项 ::after 透明（上游 40888 的 pointer-events 组合判据同段）
    expect(css).toContain('.apollo-segmented-thumb ~ .apollo-segmented-item:');
  });
});
