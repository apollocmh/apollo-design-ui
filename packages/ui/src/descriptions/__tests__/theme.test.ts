import { themeTest } from '@apollo-design/test-utils';
import { getDesignToken } from '@apollo-design/theme';
import { describe, expect, it } from 'vitest';
import { genDescriptionsStyle, genTokenDecls as genDescriptionsTokenDecls } from '../style';
import { prepareComponentToken } from '../style/token';

themeTest('Descriptions', { demos: import.meta.glob('../demo/*.vue', { eager: true }) });

describe('Descriptions static theme contracts', () => {
  const css = genDescriptionsStyle('apollo');
  it('declares all ten tokens and consumes each variable', () => {
    const decls = genDescriptionsTokenDecls('apollo');
    expect(decls).toHaveLength(10);
    for (const declaration of decls) {
      const name = declaration.trim().split(':')[0];
      expect(css).toContain(`var(${name})`);
    }
    expect(css).toContain('--apollo-descriptions-label-color:var(--apollo-color-text-secondary);');
    expect(prepareComponentToken(getDesignToken()).labelColor).toBe(
      getDesignToken().colorTextSecondary,
    );
  });
  it('derives title spacing from current font aliases', () => {
    expect(css).toContain(
      '--apollo-descriptions-title-margin-bottom:calc(var(--apollo-font-size-sm) * var(--apollo-line-height-sm));',
    );
  });
  it('keeps colons configurable with both spacing tokens', () => {
    expect(css).toContain('content:":";position:relative;top:-0.5px;');
    expect(css).toContain(
      'margin-inline:var(--apollo-descriptions-colon-margin-left) var(--apollo-descriptions-colon-margin-right);',
    );
    expect(css).toContain('.apollo-descriptions-item-no-colon::after{content:"";}');
    expect(css).toContain('.apollo-descriptions-item-no-label{display:none;}');
  });
  it('bordered cells consume the same padding and colors as ordinary cells', () => {
    expect(css).toContain(
      'padding:var(--apollo-descriptions-item-padding-bottom) var(--apollo-descriptions-item-padding-end);',
    );
    expect(css).toContain('background-color:var(--apollo-descriptions-label-bg);');
    expect(css).toContain('border-radius:var(--apollo-border-radius-lg);');
    expect(css).toContain(
      'border-inline-end:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-split);',
    );
  });
  it('uses stable grid geometry and size aliases instead of content branches', () => {
    expect(css).toContain(
      'grid-template-columns:repeat(var(--apollo-descriptions-columns),minmax(0,1fr));',
    );
    expect(css).toContain('grid-template-rows:subgrid;grid-row:span 2;');
    expect(css).toContain('--apollo-descriptions-item-padding-bottom:var(--apollo-padding-sm);');
    expect(css).toContain('--apollo-descriptions-item-padding-bottom:var(--apollo-padding-xs);');
  });
  it('semantic selectors are owned by the immediate list and preserve nested components', () => {
    expect(css).toContain(
      '.apollo-descriptions > .apollo-descriptions-view > .apollo-descriptions-list > .apollo-descriptions-item > .apollo-descriptions-item-label{',
    );
    expect(css).not.toContain('.apollo-descriptions .apollo-descriptions-item-label{');
    expect(css).toContain('.apollo-descriptions-rtl{direction:rtl;}');
  });
});
