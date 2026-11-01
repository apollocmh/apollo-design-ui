// @vitest-environment node
import { describe, expect, it } from 'vitest';
import uiPackage from '../../../package.json';
import { genStyleAssets } from '../assets';
import {
  BASE_CSS,
  COMPONENT_STYLES,
  type ComponentStyleEntry,
  componentStyleEntries,
} from '../index';
import { styleSource } from '../source';

const assets = genStyleAssets();
const imports = (...names: string[]) => {
  const included = new Set(
    names.flatMap((name) => {
      const component = assets.manifest.components[name];
      if (!component) throw new Error(`Missing test style family: ${name}`);
      return component.styles;
    }),
  );
  return assets.manifest.order.filter((file) => included.has(file));
};
const css = (...names: string[]) =>
  imports(...names)
    .map((file) => assets.files[file.replace('@apollo-design/ui/', '')])
    .join('\n');
const occurrences = (text: string, needle: string) => text.split(needle).length - 1;

describe('Independently importable static style resources', () => {
  it('publishes one neutral base without theme declarations or preset imports', () => {
    expect(assets.files['base.css']).toBe(BASE_CSS);
    expect(BASE_CSS).not.toMatch(/(?:\{|;)\s*--[\w-]+\s*:/);
    expect(BASE_CSS).not.toContain('@import');
    expect(assets.manifest.schemaVersion).toBe(1);
    expect(Object.keys(assets.manifest.components)).toHaveLength(69);
  });

  it('derives all resolvable closures from the existing component graph in stable cascade order', () => {
    for (const entry of COMPONENT_STYLES) {
      const component = assets.manifest.components[entry.name];
      expect(component).toBeDefined();
      if (!component) throw new Error(`Missing ${entry.name} resource metadata`);
      expect(component.dependencies).toEqual(entry.dependencies ?? []);
      expect(component.styles[0]).toBe(assets.manifest.base);
      expect(component.styles).toContain(component.structure);
      expect(new Set(component.styles).size).toBe(component.styles.length);
      expect(component.styles).toEqual(
        assets.manifest.order.filter((file) => component.styles.includes(file)),
      );
      for (const file of component.styles) {
        expect(assets.files[file.replace('@apollo-design/ui/', '')], file).toBeTypeOf('string');
      }
    }
  });

  it('exports every generated resource and the JSON through ordinary package paths', () => {
    const exported = new Map(Object.entries(uiPackage.exports));
    for (const resource of assets.manifest.order) {
      const file = resource.replace('@apollo-design/ui/', '');
      expect(exported.get(`./${file}`), file).toBe(`./dist/${file}`);
    }
    expect(exported.get('./style-manifest.json')).toBe('./dist/style-manifest.json');
    expect(uiPackage.sideEffects).toContain('**/*.css');
  });

  it('shares the exact Button/Input/Space resources and base across combined consumers', () => {
    expect(imports('button', 'input')).toEqual([
      '@apollo-design/ui/base.css',
      '@apollo-design/ui/button/structure.css',
      '@apollo-design/ui/space/structure.css',
      '@apollo-design/ui/input/structure.css',
    ]);
    expect(occurrences(css('button', 'input'), BASE_CSS)).toBe(1);
    const button = assets.files['button/structure.css'];
    if (button === undefined) throw new Error('Missing Button structure resource');
    expect(occurrences(css('button', 'input'), button)).toBe(1);
  });

  it('supplies Tabs motion without Select paint and emits shared Select/Tabs motion only once', () => {
    expect(imports('tabs')).not.toContain('@apollo-design/ui/select/structure.css');
    expect(css('tabs')).not.toContain('.apollo-select{');
    const combined = css('select', 'tabs');
    expect(occurrences(combined, '@keyframes apollo-slide-up-in')).toBe(1);
    expect(
      occurrences(combined, '.apollo-slide-up-enter,.apollo-slide-up-appear{animation-duration'),
    ).toBe(1);
    expect(
      occurrences(
        combined,
        '.apollo-slide-up-enter.apollo-slide-up-enter-active,.apollo-slide-up-appear.apollo-slide-up-appear-active{animation-name:apollo-slide-up-in;',
      ),
    ).toBe(1);
    expect(occurrences(combined, BASE_CSS)).toBe(1);
    expect(occurrences(combined, '.apollo-icon {')).toBe(1);
  });

  it('retains component-specific shells and shares Tree motion without importing unrelated families', () => {
    expect(css('cascader')).toContain('.apollo-cascader{');
    expect(css('tree-select')).toContain('.apollo-tree-select{');
    expect(imports('cascader', 'tree-select')).not.toContain(
      '@apollo-design/ui/select/structure.css',
    );
    expect(imports('tree-select')).not.toContain('@apollo-design/ui/tree/structure.css');
    expect(occurrences(css('tree', 'tree-select'), '@keyframes apollo-tree-node-fx')).toBe(1);
  });

  it('shares motion properties while keeping distinct owner animation names', () => {
    const combined = css('menu', 'tooltip', 'popover', 'dropdown');
    expect(
      occurrences(
        combined,
        '.apollo-zoom-big-fast-enter,.apollo-zoom-big-fast-appear{animation-duration',
      ),
    ).toBe(1);
    expect(
      occurrences(combined, '.apollo-zoom-big-enter,.apollo-zoom-big-appear{animation-duration'),
    ).toBe(1);
    for (const owner of ['tooltip', 'menu', 'popover'])
      expect(combined).toContain(`animation-name:apollo-${owner}-zoom-big-in;`);
    expect(combined).toContain('animation-name:apollo-dropdown-slide-up-in;');
    expect(combined).toContain('animation-name:apollo-menu-slide-up-in;');
  });

  it('preserves the existing configurable prefix and Steps-before-Timeline cascade', () => {
    const probe = genStyleAssets(COMPONENT_STYLES, ['probe']);
    expect(probe.files['select/structure.css']).toContain('.probe-select');
    expect(probe.files['tree-select/structure.css']).toContain('.probe-tree-select');
    expect(probe.files['cascader/structure.css']).toContain('.probe-cascader');
    const timeline = imports('timeline');
    expect(timeline.indexOf('@apollo-design/ui/steps/structure.css')).toBeLessThan(
      timeline.indexOf('@apollo-design/ui/timeline/structure.css'),
    );
  });

  it('rejects unknown dependencies with the same explicit graph diagnostic', () => {
    const graph: ComponentStyleEntry[] = [
      { name: 'sample', gen: () => '.sample{}', dependencies: ['missing'] },
    ];
    expect(() => genStyleAssets(graph)).toThrow('未知组件 "missing"');
    expect(() => componentStyleEntries('missing')).toThrow('未知组件 "missing"');
  });

  it('rejects a cycle rather than emitting a partial closure', () => {
    const graph: ComponentStyleEntry[] = [
      { name: 'one', gen: () => '.one{}', dependencies: ['two'] },
      { name: 'two', gen: () => '.two{}', dependencies: ['one'] },
    ];
    expect(() => genStyleAssets(graph)).toThrow('one → two → one');
  });

  it('rejects conflicting definitions for the same shared resource part', () => {
    const graph: ComponentStyleEntry[] = [
      {
        name: 'one',
        gen: () => '',
        source: () => styleSource`${{ name: 'part', resource: 'shared', css: '.one{}' }}`,
      },
      {
        name: 'two',
        gen: () => '',
        source: () => styleSource`${{ name: 'part', resource: 'shared', css: '.two{}' }}`,
      },
    ];
    expect(() => genStyleAssets(graph)).toThrow('Conflicting shared style part: part');
  });

  it('produces deterministic plain JSON suitable for Node-only resolver consumption', () => {
    expect(JSON.parse(JSON.stringify(assets.manifest))).toEqual(genStyleAssets().manifest);
    expect(globalThis).not.toHaveProperty('document');
  });
});
