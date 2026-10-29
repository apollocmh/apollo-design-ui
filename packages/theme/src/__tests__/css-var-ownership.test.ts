import { describe, expect, it } from 'vitest';
import {
  applyCSSVar,
  createCSSVarScope,
  IGNORE,
  PRESERVE,
  token2CSSVar,
  transformToken,
  UNITLESS,
} from '../css-var';
import { getDesignToken } from '../get-design-token';

const token = (colorPrimary: string) => getDesignToken({ token: { colorPrimary } });
const key = '--apollo-color-primary';

describe('CSS variable scope ownership', () => {
  it('sparse native SVG scopes release only their own keys and preserve the original priority', () => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    el.style.setProperty(key, '#663399', 'important');
    const first = createCSSVarScope(el);
    const second = createCSSVarScope(el);
    first.apply({ colorPrimary: '#0055aa', paddingXS: 8 });
    second.apply({ colorPrimary: '#aa3300' });
    first.apply({ paddingXS: 12 });
    expect(el.style.getPropertyValue(key)).toBe('#aa3300');
    expect(el.style.getPropertyValue('--apollo-padding-xs')).toBe('12px');
    second.remove();
    expect(el.style.getPropertyValue(key)).toBe('#663399');
    expect(el.style.getPropertyPriority(key)).toBe('important');
    first.remove();
    expect(el.style.getPropertyValue('--apollo-padding-xs')).toBe('');
    expect(el.style.getPropertyValue(key)).toBe('#663399');
  });

  it('removing an older owner leaves the latest live owner intact', () => {
    const el = document.createElement('div');
    const first = createCSSVarScope(el);
    const second = createCSSVarScope(el);
    first.apply(token('#0055aa'));
    second.apply(token('#aa3300'));
    first.remove();
    expect(el.style.getPropertyValue(key)).toBe('#aa3300');
    second.remove();
    expect(el.style.getPropertyValue(key)).toBe('');
  });

  it('removing the visible owner restores the last live owner, then original priority', () => {
    const el = document.createElement('div');
    el.style.setProperty(key, '#663399', 'important');
    const first = createCSSVarScope(el);
    const second = createCSSVarScope(el);
    first.apply(token('#0055aa'));
    second.apply(token('#aa3300'));
    second.remove();
    expect(el.style.getPropertyValue(key)).toBe('#0055aa');
    first.remove();
    expect(el.style.getPropertyValue(key)).toBe('#663399');
    expect(el.style.getPropertyPriority(key)).toBe('important');
  });

  it('the latest apply wins while removing a key only releases that owner', () => {
    const el = document.createElement('div');
    const first = createCSSVarScope(el);
    const second = createCSSVarScope(el);
    first.apply(getDesignToken({ token: { customLength: 9 } }));
    second.apply(getDesignToken({ token: { customLength: 12 } }));
    first.apply(getDesignToken({ token: { customLength: 15 } }));
    expect(el.style.getPropertyValue('--apollo-custom-length')).toBe('15px');
    first.apply(getDesignToken());
    expect(el.style.getPropertyValue('--apollo-custom-length')).toBe('12px');
    second.remove();
    expect(el.style.getPropertyValue('--apollo-custom-length')).toBe('');
    first.remove();
  });

  it('cleanup preserves a later external write, and a later apply can own it again', () => {
    const el = document.createElement('div');
    const scope = createCSSVarScope(el);
    scope.apply(token('#0055aa'));
    el.style.setProperty(key, '#884422', 'important');
    scope.apply(token('#aa3300'));
    expect(el.style.getPropertyValue(key)).toBe('#aa3300');
    scope.remove();
    expect(el.style.getPropertyValue(key)).toBe('#884422');
    expect(el.style.getPropertyPriority(key)).toBe('important');
    scope.apply(token('#0055aa'));
    el.style.setProperty(key, '#228844');
    scope.remove();
    expect(el.style.getPropertyValue(key)).toBe('#228844');
  });

  it('one-shot writes persist before and after an owned write, including equal values', () => {
    const el = document.createElement('div');
    const scope = createCSSVarScope(el);
    applyCSSVar(el, token('#0055aa'));
    scope.apply(token('#aa3300'));
    scope.remove();
    expect(el.style.getPropertyValue(key)).toBe('#0055aa');
    scope.apply(token('#aa3300'));
    applyCSSVar(el, token('#aa3300'));
    scope.remove();
    expect(el.style.getPropertyValue(key)).toBe('#aa3300');
    scope.apply(token('#0055aa'));
    applyCSSVar(el, token('#228844'));
    scope.remove();
    expect(el.style.getPropertyValue(key)).toBe('#228844');
  });

  it('independent prefixes, keys snapshots and repeated remove/reapply stay isolated', () => {
    const el = document.createElement('div');
    const first = createCSSVarScope(el, '');
    const second = createCSSVarScope(el, 'second');
    first.apply(token('#0055aa'));
    second.apply(token('#aa3300'));
    first.keys.push('--second-color-primary');
    first.remove();
    first.remove();
    expect(first.keys).toEqual([]);
    expect(el.style.getPropertyValue('--second-color-primary')).toBe('#aa3300');
    first.apply(token('#228844'));
    expect(el.style.getPropertyValue('--color-primary')).toBe('#228844');
    first.remove();
    second.remove();
    expect(el.style.length).toBe(0);
  });
});

describe('CSS variable rule tables only match own scalar keys', () => {
  it('prototype names remain ordinary extension token names', () => {
    const names = ['constructor', 'toString', '__proto__', 'hasOwnProperty'];
    const result = transformToken(
      getDesignToken({ token: Object.fromEntries(names.map((name) => [name, 7])) }),
    );
    for (const name of names) {
      const variable = token2CSSVar(name);
      expect(Object.hasOwn(PRESERVE, name)).toBe(false);
      expect(Object.hasOwn(IGNORE, name)).toBe(false);
      expect(Object.hasOwn(UNITLESS, name)).toBe(false);
      expect(result.vars[variable]).toBe('7px');
      expect(Object.hasOwn(result.refs, name)).toBe(true);
      expect(result.refs[name]).toBe(`var(${variable})`);
    }
  });
});
