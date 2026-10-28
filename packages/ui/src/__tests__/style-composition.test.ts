import { describe, expect, it } from 'vitest';
import { BASE_CSS, genComponentCss, genComponentStyleMap, genComponentStyleSheet } from '../style';

/** Actual descendants from the audited render chains, independent of dependency metadata. */
const ownedRules = [
  ['timeline', '.apollo-steps'],
  ['typography', '.apollo-tooltip'],
  ['statistic', '.apollo-skeleton'],
  ['input', '.apollo-btn'],
  ['input-number', '.apollo-space-addon'],
  ['qr-code', '.apollo-spin'],
  ['upload', '.apollo-progress'],
  ['menu', '.apollo-tooltip'],
  ['dropdown', '.apollo-btn'],
  ['modal', '.apollo-skeleton'],
  ['drawer', '.apollo-skeleton'],
  ['app', '.apollo-message'],
  ['select', '.apollo-empty'],
  ['popconfirm', '.apollo-popover'],
  ['tour', '.apollo-btn'],
  ['float-button', '.apollo-space-compact'],
  ['form', '.apollo-row'],
  ['slider', '.apollo-tooltip'],
  ['rate', '.apollo-tooltip'],
  ['segmented', '.apollo-tooltip'],
  ['steps', '.apollo-tooltip'],
  ['progress', '.apollo-tooltip'],
  ['pagination', '.apollo-select'],
  ['breadcrumb', '.apollo-dropdown'],
  ['card', '.apollo-skeleton'],
  ['anchor', '.apollo-affix'],
  ['list', '.apollo-pagination'],
  ['table', '.apollo-empty'],
  ['transfer', '.apollo-checkbox'],
  ['mentions', '.apollo-empty'],
  ['color-picker', '.apollo-input-number'],
  ['date-picker', '.apollo-btn'],
  ['calendar', '.apollo-radio-group'],
  ['avatar', '.apollo-popover'],
] as const;

function hasRootRule(css: string, selector: string): boolean {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...source.matchAll(/(?:^|})\s*([^{}]+)\{/g)].some((match) =>
    match[1]?.split(',').some((part) => part.trim() === selector),
  );
}

describe('Public component styles include implementation-owned descendants', () => {
  for (const [component, selector] of ownedRules)
    it(`${component} supplies ${selector} rules through both public generators`, () => {
      expect(hasRootRule(genComponentCss(component, 'apollo'), selector), 'custom-prefix CSS').toBe(
        true,
      );
      expect(hasRootRule(genComponentStyleSheet(component), selector), 'public stylesheet').toBe(
        true,
      );
    });

  it('keeps inherited Steps layout before Timeline overrides', () => {
    const css = genComponentStyleSheet('timeline');
    expect(css.indexOf('.apollo-steps')).toBeGreaterThanOrEqual(0);
    expect(css.indexOf('.apollo-steps')).toBeLessThan(css.indexOf('.apollo-timeline'));
  });

  it('supplies Tabs popup motion without importing an unrelated dropdown menu', () => {
    const css = genComponentCss('tabs', 'apollo');
    expect(hasRootRule(css, '.apollo-slide-up-enter')).toBe(true);
    expect(hasRootRule(css, '.apollo-slide-down-enter')).toBe(true);
    expect(css).not.toContain('.apollo-dropdown-menu');
  });

  it('emits one native reset in every existing stylesheet, despite shared descendant paths', () => {
    const map = genComponentStyleMap();
    expect(Object.keys(map)).toHaveLength(69);
    for (const [name, css] of Object.entries(map))
      expect(css.split(BASE_CSS).length - 1, name).toBe(1);
  });

  it('does not pull consumer-provided controls into layout and content containers', () => {
    for (const component of ['grid', 'space', 'descriptions']) {
      const css = genComponentCss(component, 'apollo');
      expect(css).not.toContain('.apollo-select');
      expect(css).not.toContain('.apollo-btn');
    }
  });

  it('preserves diagnostics for unknown public stylesheet names', () => {
    expect(() => genComponentCss('unknown-component', 'apollo')).toThrow('未知组件');
    expect(() => genComponentStyleSheet('unknown-component')).toThrow('未知组件');
  });
});
