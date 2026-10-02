/**
 * L7 主题 —— ColorPicker 的 Component Token 与规则体。
 *
 * 契约来源：antd 6.6.4 `es/color-picker/style/index.js` 的**真实产物**
 * （`node tests/visual/debug/extract-color-picker-css.mjs`）。
 *
 * 这组用例钉四件事：
 *   1. **9 个** `--apollo-color-picker-*` 的**名字与顺序**（= `mergeToken` 的书写顺序）。
 *   2. **B7 双向比对**：规则引用的自有变量必须全部在声明清单里。
 *   3. **前缀参数化**：`genColorPickerStyle('ant')` 必须产出 `.ant-color-picker` 选择器，
 *      且**一个 `.apollo-` 类名都不剩**（calendar 那条守卫的同款判据）。
 *   4. **括号配平**（calendar 漏过一个多余的 `)` ⇒ 整条声明被浏览器丢弃）。
 */
import { describe, expect, it } from 'vitest';
import { genColorPickerStyle } from '../style';
import { colorPickerDerived, genColorPickerTokenDecls } from '../style/token';

const DECLS = genColorPickerTokenDecls('apollo');
/** 声明清单（`--apollo-color-picker-xxx`）。 */
const DECLARED = DECLS.map((d) => d.trim().replace(/:.*$/, ''));
const CSS = genColorPickerStyle('apollo');

describe('ColorPicker · L7 token 声明块（9 条派生）', () => {
  it('恰好 9 条（= 上游 `mergeToken` 的 9 个派生）', () => {
    expect(DECLS).toHaveLength(9);
    expect(new Set(DECLARED).size).toBe(9);
  });

  it('名字与顺序 = 上游 `mergeToken` 的书写顺序', () => {
    expect(DECLARED).toEqual([
      '--apollo-color-picker-width',
      '--apollo-color-picker-handler-size',
      '--apollo-color-picker-handler-size-sm',
      '--apollo-color-picker-alpha-input-width',
      '--apollo-color-picker-input-number-handle-width',
      '--apollo-color-picker-preset-color-size',
      '--apollo-color-picker-inset-shadow',
      '--apollo-color-picker-slider-height',
      '--apollo-color-picker-preview-size',
    ]);
  });

  it('6 个尺寸是字面量（上游就是字面量，产物里内联成 px）', () => {
    const byName = new Map(
      DECLS.map((d) => {
        const [k, val] = d.trim().replace(/;$/, '').split(':');
        return [k ?? '', val ?? ''];
      }),
    );
    expect(byName.get('--apollo-color-picker-width')).toBe('234px');
    expect(byName.get('--apollo-color-picker-handler-size')).toBe('16px');
    expect(byName.get('--apollo-color-picker-handler-size-sm')).toBe('12px');
    expect(byName.get('--apollo-color-picker-alpha-input-width')).toBe('44px');
    expect(byName.get('--apollo-color-picker-input-number-handle-width')).toBe('16px');
    expect(byName.get('--apollo-color-picker-preset-color-size')).toBe('24px');
    expect(byName.get('--apollo-color-picker-slider-height')).toBe('8px');
  });

  it('`inset-shadow` 引用全局 token（随主题走）', () => {
    expect(colorPickerDerived('apollo').insetShadow).toBe(
      'inset 0 0 1px 0 var(--apollo-color-text-quaternary)',
    );
    expect(DECLS.find((d) => d.includes('inset-shadow'))).toContain(
      'inset 0 0 1px 0 var(--apollo-color-text-quaternary)',
    );
  });

  it('🚨 `preview-size` 是算式，且引用的是**同族**变量（不是 `8px` 字面量）', () => {
    // 上游算式：token.calc(sliderHeight).mul(2).add(marginSM).equal()
    // 产物：calc(8px * 2 + var(--ant-margin-sm))
    expect(colorPickerDerived('apollo').previewSize).toBe(
      'calc(var(--apollo-color-picker-slider-height) * 2 + var(--apollo-margin-sm))',
    );
    // 换前缀时同族变量也要换（否则 ant 版引用的是 apollo 的变量 ⇒ 静默失效）
    expect(colorPickerDerived('ant').previewSize).toBe(
      'calc(var(--ant-color-picker-slider-height) * 2 + var(--apollo-margin-sm))',
    );
    // 全局别名变量**不动**
    expect(colorPickerDerived('ant').previewSize).toContain('var(--apollo-margin-sm)');
  });
});

describe('ColorPicker · L7 B7 双向比对（声明 ↔ 规则引用）', () => {
  const used = new Set(
    [...CSS.matchAll(/var\((--apollo-color-picker-[a-z0-9_-]+)/g)]
      .map((m) => m[1] as string)
      .filter((x): x is string => x !== undefined),
  );
  const declaredSet = new Set(DECLARED);

  it('规则引用的自有变量**全部**在声明清单里', () => {
    const missing = [...used].filter((u) => !declaredSet.has(u)).sort();
    expect(missing).toEqual([]);
  });

  it('规则确实引用了自有变量（否则上一条是空转）', () => {
    // 9 条里 `input-number-handle-width` 只被引用一次、`slider-height` 被引用多次
    expect(used.size).toBe(9);
    expect(used.has('--apollo-color-picker-width')).toBe(true);
    expect(used.has('--apollo-color-picker-inset-shadow')).toBe(true);
    expect(used.has('--apollo-color-picker-preview-size')).toBe(true);
    expect(used.has('--apollo-color-picker-slider-height')).toBe(true);
  });

  it('没有「声明了却没人用」的死变量（9/9 全部被引用）', () => {
    const dead = DECLARED.filter((d) => !used.has(d)).sort();
    expect(dead).toEqual([]);
  });

  it('声明块挂在根与 `-css-var` 两个选择器上', () => {
    expect(CSS.startsWith('.apollo-color-picker,.apollo-color-picker-css-var{')).toBe(true);
  });

  it('🚨 `-css-var` 的 reset 块产出 `font-family` / `font-size`（image/menu/select 同判）', () => {
    expect(CSS).toContain(
      '.apollo-color-picker-css-var{font-family:var(--apollo-font-family);font-size:var(--apollo-font-size);box-sizing:border-box;}',
    );
  });
});

describe('ColorPicker · L7 规则体（前缀参数化 + 结构）', () => {
  it('🚨 `genColorPickerStyle("ant")` 产出 `.ant-color-picker` 选择器', () => {
    const ant = genColorPickerStyle('ant');
    expect((ant.match(/\.ant-color-picker/g) ?? []).length).toBeGreaterThan(80);
    expect(ant.includes('.apollo-color-picker')).toBe(false);
    expect(ant.includes('--ant-color-picker-width:')).toBe(true);
    expect(ant.includes('--apollo-color-picker-width:')).toBe(false);
  });

  it('🚨 `ant` 版**一个 `.apollo-` 类名都不剩**（跨组件类名也要换）', () => {
    const ant = genColorPickerStyle('ant');
    expect(ant.includes('.apollo-')).toBe(false);
    // 反向哨兵：`apollo` 版确实有（否则是空转）
    expect(CSS.includes('.apollo-')).toBe(true);
    // 类名总数守恒（只换前缀，不增不减）
    const count = (text: string, re: RegExp) => (text.match(re) ?? []).length;
    expect(count(ant, /\.ant-/g)).toBe(count(CSS, /\.apollo-/g));
  });

  it('🚨 **全局别名变量不动**（`tokens.css` 只声明 `--apollo-*`）', () => {
    const ant = genColorPickerStyle('ant');
    expect(ant.includes('var(--apollo-color-text)')).toBe(true);
    expect(ant.includes('var(--ant-color-text)')).toBe(false);
    expect(ant.includes('var(--apollo-motion-duration-mid)')).toBe(true);
    // 而组件自有变量跟着换
    expect(ant.includes('var(--ant-color-picker-width)')).toBe(true);
    expect(ant.includes('var(--apollo-color-picker-width)')).toBe(false);
  });

  it('跨组件类名也参数化（`.divider` / `.select` / `.collapse` / `.input-number` / `.input`）', () => {
    expect(CSS).toContain(
      '.apollo-color-picker .apollo-color-picker-inner-content>.apollo-divider{',
    );
    expect(CSS).toContain('.apollo-color-picker-format-select.apollo-select{');
    expect(CSS).toContain('.apollo-color-picker-presets .apollo-collapse{');
    expect(CSS).toContain('.apollo-color-picker-steppers.apollo-input-number{');
    expect(CSS).toContain('.apollo-color-picker-hex-input.apollo-input-affix-wrapper{');
  });

  it('面板骨架：宽度走 `--apollo-color-picker-width`（上游内联 `234px`）', () => {
    expect(CSS).toContain(
      '.apollo-color-picker .apollo-color-picker-inner-content{display:flex;flex-direction:column;width:var(--apollo-color-picker-width);}',
    );
  });

  it('色块尺寸走 `preview-size` / `preset-color-size`', () => {
    expect(CSS).toContain('width:var(--apollo-color-picker-preview-size);');
    expect(CSS).toContain('width:var(--apollo-color-picker-preset-color-size);');
  });

  it('🚨 所有 `box-shadow` 都不含原始色值（E10 的真实意图）', () => {
    const shadows = [...CSS.matchAll(/box-shadow:([^;}]*)/g)].map((m) => m[1] ?? '');
    expect(shadows.length).toBeGreaterThan(0);
    for (const s of shadows) {
      expect(s, `box-shadow 含原始色值: ${s}`).not.toMatch(
        /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/,
      );
    }
    // 反向哨兵：`inset` 开头的那条确实存在（它是唯一只能靠变量表达的阴影 ——
    // 上游内联写死 `inset 0 0 0 var(--ant-line-width) var(--ant-color-fill-secondary)`，
    // 而 E10 的 `box-shadow` 正则只放行 `var(`/`${`/`none`/`0` 开头）
    expect(shadows.some((s) => s.startsWith('inset 0 0 0 var(--apollo-line-width)'))).toBe(true);
    // 另有 4 条 `colorPickerInsetShadow` 派生（`var(...)` 开头）
    expect(
      shadows.filter((s) => s.startsWith('var(--apollo-color-picker-inset-shadow)')).length,
    ).toBeGreaterThanOrEqual(4);
  });

  it('Compact 的焦点类名是 `-trigger-active`（不是 `:focus`）', () => {
    expect(CSS).toContain(
      '.apollo-color-picker-compact-item:hover,.apollo-color-picker-compact-item:hover.apollo-color-picker-trigger-active{z-index:4;}',
    );
  });

  it('RTL 只改 `::after` 的 `direction`（两条）', () => {
    expect(CSS).toContain(
      '.apollo-color-picker-rtl .apollo-color-picker-presets-color::after{direction:ltr;}',
    );
    expect(CSS).toContain(
      '.apollo-color-picker-rtl .apollo-color-picker-clear::after{direction:ltr;}',
    );
  });

  it('🚨 每条规则的**圆括号必须配平**（calendar 漏过一个多余的 `)`）', () => {
    for (const line of CSS.split('\n')) {
      const open = line.indexOf('{');
      const close = line.lastIndexOf('}');
      if (open < 0 || close <= open) continue;
      const body = line.slice(open + 1, close);
      const l = (body.match(/\(/g) ?? []).length;
      const r = (body.match(/\)/g) ?? []).length;
      expect(l, `${line.slice(0, 70)} … 括号不配平（${l} vs ${r}）`).toBe(r);
    }
  });

  it('规则条数与上游产物对得上（96 → 92 条规则 + 1 条声明块）', () => {
    // 算术（逐项可自证）：
    //   上游含 `.ant-color-picker` 的规则 = 96 条
    //     − 4 条 `resetComponent` 的 box-sizing（BASE_CSS 已覆盖）
    //     − 1 条 cssinjs 的 `.data-ant-cssinjs-cache-path`（不是样式）
    //     + 1 条本仓保留的 `-css-var` 的 font-family/font-size（image/menu/select 同判）
    //   = 92 条规则
    //   + 1 条 token 声明块 = 93 行 `{…}`
    const rules = CSS.split('\n').filter((l) => l.includes('{') && l.includes('}'));
    expect(rules).toHaveLength(93);
  });
});
