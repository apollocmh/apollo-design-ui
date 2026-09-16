import { describe, expect, it } from 'vitest';
import {
  applyCSSVar,
  createCSSVarScope,
  getCSSVarDeclarations,
  token2CSSVar,
  transformToken,
} from '../css-var';
import { darkAlgorithm, getDesignToken } from '../get-design-token';

/**
 * CSS 变量层的测试。
 *
 * 命名规则是**对外契约**：用户会直接写 `var(--apollo-color-primary)` 覆盖样式。
 * 所以它不能是"我们觉得合理的 kebab-case"，必须与 antd 同构 ——
 * 这三个 replace 的顺序来自 @ant-design/cssinjs，改任意一步都会让用户的覆盖失效。
 */

describe('token2CSSVar —— 命名规则', () => {
  it('普通 camelCase', () => {
    expect(token2CSSVar('colorPrimary')).toBe('--apollo-color-primary');
  });

  it('连续大写（LG / SM / XL）会各自成段', () => {
    expect(token2CSSVar('borderRadiusLG')).toBe('--apollo-border-radius-lg');
    expect(token2CSSVar('sizeXXL')).toBe('--apollo-size-xxl');
  });

  it('大写缩写后接单词（screenXSMax）', () => {
    expect(token2CSSVar('screenXSMax')).toBe('--apollo-screen-xs-max');
  });

  it('小写接**数字**也要插横线（Heading1 → heading-1）', () => {
    expect(token2CSSVar('fontSizeHeading1')).toBe('--apollo-font-size-heading-1');
    expect(token2CSSVar('lineHeightHeading5')).toBe('--apollo-line-height-heading-5');
  });

  it('多词复合', () => {
    expect(token2CSSVar('zIndexPopupBase')).toBe('--apollo-z-index-popup-base');
    expect(token2CSSVar('motionDurationFast')).toBe('--apollo-motion-duration-fast');
  });

  it('前缀可换成 ant（prefix-cls-default 裁决 A 的覆盖路径）', () => {
    expect(token2CSSVar('colorPrimary', 'ant')).toBe('--ant-color-primary');
  });

  it('前缀为空时不带连字符', () => {
    expect(token2CSSVar('colorPrimary', '')).toBe('--color-primary');
  });
});

describe('transformToken —— 单位与黑白名单', () => {
  it('number 默认加 px', () => {
    const { vars } = transformToken(getDesignToken());
    expect(vars['--apollo-border-radius']).toBe('6px');
    expect(vars['--apollo-control-height']).toBe('32px');
  });

  it('unitless 的 number 不加 px', () => {
    const { vars } = transformToken(getDesignToken());
    expect(vars['--apollo-line-height']).toBe('1.5714285714285714');
    expect(vars['--apollo-font-weight-strong']).toBe('600');
    expect(vars['--apollo-opacity-loading']).toBe('0.65');
  });

  it('ignore 的 token 不产出变量', () => {
    const { vars } = transformToken(getDesignToken());
    expect(vars['--apollo-motion-base']).toBeUndefined();
    expect(vars['--apollo-motion-unit']).toBeUndefined();
  });

  it('preserve 的断点保留原值、不转成 var()', () => {
    const { refs, vars } = transformToken(getDesignToken());
    expect(refs.screenMD).toBe(768);
    expect(vars['--apollo-screen-md']).toBeUndefined();
  });

  it('boolean 不产出变量（wireframe / motion / focusOutline）', () => {
    const { vars } = transformToken(getDesignToken());
    expect(vars['--apollo-wireframe']).toBeUndefined();
    expect(vars['--apollo-motion']).toBeUndefined();
  });

  it('string 原样输出', () => {
    const { vars } = transformToken(getDesignToken());
    expect(vars['--apollo-color-primary']).toBe('#1677ff');
  });
});

describe('零运行时路径：静态 CSS', () => {
  it('默认产出 :root 规则', () => {
    const css = getCSSVarDeclarations(getDesignToken());
    expect(css.startsWith(':root{')).toBe(true);
    expect(css).toContain('--apollo-color-primary:#1677ff;');
    expect(css.endsWith('}')).toBe(true);
  });

  it('可指定选择器做作用域覆盖（dark 主题）', () => {
    const dark = getDesignToken({ algorithm: darkAlgorithm });
    const css = getCSSVarDeclarations(dark, { selector: '[data-apollo-theme="dark"]' });
    expect(css.startsWith('[data-apollo-theme="dark"]{')).toBe(true);
    expect(css).not.toContain('--apollo-color-primary:#1677ff;');
  });

  it('同一 token 两次产出完全一致（可幂等落盘）', () => {
    const t = getDesignToken();
    expect(getCSSVarDeclarations(t)).toBe(getCSSVarDeclarations(t));
  });
});

describe('运行时注入路径（zero-runtime-mode 裁决 B）', () => {
  it('★ 与静态路径共用同一套变量名 —— 否则两条路径会分叉', () => {
    const token = getDesignToken();
    const el = document.createElement('div');
    applyCSSVar(el, token);

    const { vars } = transformToken(token);
    for (const name of Object.keys(vars).slice(0, 50)) {
      expect(el.style.getPropertyValue(name)).toBe(vars[name]);
    }
  });

  it('scope.apply 写入、remove 清空', () => {
    const el = document.createElement('div');
    const scope = createCSSVarScope(el);
    scope.apply(getDesignToken());
    expect(scope.keys.length).toBeGreaterThan(100);
    expect(el.style.getPropertyValue('--apollo-color-primary')).toBe('#1677ff');

    scope.remove();
    expect(scope.keys).toEqual([]);
    expect(el.style.getPropertyValue('--apollo-color-primary')).toBe('');
  });

  it('★ 切回亮色时不残留暗色变量（覆盖只增不减会留脏值）', () => {
    const el = document.createElement('div');
    const scope = createCSSVarScope(el);

    const dark = getDesignToken({ algorithm: darkAlgorithm });
    const light = getDesignToken();
    const darkOnly = Object.keys(transformToken(dark).vars).filter(
      (k) => !(k in transformToken(light).vars),
    );

    scope.apply(dark);
    scope.apply(light);
    // 亮色里没有被移除的变量应当回到亮色值，而不是保持暗色值
    for (const k of darkOnly) expect(el.style.getPropertyValue(k)).toBe('');
    expect(el.style.getPropertyValue('--apollo-color-primary')).toBe('#1677ff');
  });

  it('两个 scope 用不同前缀互不干扰', () => {
    const el = document.createElement('div');
    createCSSVarScope(el, 'apollo').apply(getDesignToken());
    createCSSVarScope(el, 'ant').apply(getDesignToken());
    expect(el.style.getPropertyValue('--apollo-color-primary')).toBe('#1677ff');
    expect(el.style.getPropertyValue('--ant-color-primary')).toBe('#1677ff');
  });
});
