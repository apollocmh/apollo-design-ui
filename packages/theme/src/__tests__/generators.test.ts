import { describe, expect, it } from 'vitest';
import { defaultSeedToken } from '../seed';
import { genCommonMapToken } from '../shared/common-map-token';
import { genControlHeight } from '../shared/control-height';
import genFontMapToken from '../shared/font-map-token';
import genFontSizes, { getLineHeight } from '../shared/font-sizes';
import getAlphaColor from '../shared/get-alpha-color';
import { genRadius } from '../shared/radius';
import { genCompactSizeMapToken, genSizeMapToken } from '../shared/size-map-token';

/**
 * 各派生函数的单元测试。
 *
 * 与 baseline.test.ts 的分工：那边证明「整体对得上 antd」，这边证明
 * 「每个分支都按预期走」。baseline 只有 15 个用例，覆盖不到 genRadius 的每一个断点，
 * 而那些断点一旦被误改，baseline 未必会红（默认 borderRadius=6 只命中其中一段）。
 *
 * 下面硬编码的期望值取自 antd 6.6.4 的真实输出（`registry/tools/gen-theme-baseline.mjs`
 * 同款来源），不是推导出来的。
 */

describe('genRadius —— 断点逐段', () => {
  it('默认 6 → XS=2 SM=4 LG=8 Outer=4', () => {
    expect(genRadius(6)).toEqual({
      borderRadius: 6,
      borderRadiusXS: 2,
      borderRadiusSM: 4,
      borderRadiusLG: 8,
      borderRadiusOuter: 4,
      // spin 会话裁决的有意扩展：完美圆几何常量（antd token 集不含，baseline.test.ts 白名单）
      borderRadiusCircle: '100%',
    });
  });

  it('5 → LG=6 SM=4 XS=1 Outer=4（第一个区间的边界）', () => {
    const r = genRadius(5);
    expect([r.borderRadiusLG, r.borderRadiusSM, r.borderRadiusXS, r.borderRadiusOuter]).toEqual([
      6, 4, 1, 4,
    ]);
  });

  it('7 → LG=9 SM=5 XS=2 Outer=4（SM 在区间交界处换档）', () => {
    const r = genRadius(7);
    expect([r.borderRadiusLG, r.borderRadiusSM, r.borderRadiusXS, r.borderRadiusOuter]).toEqual([
      9, 5, 2, 4,
    ]);
  });

  it('8 → SM=6 Outer=6（Outer 在 >4 且 <8 之外）', () => {
    const r = genRadius(8);
    expect([r.borderRadiusSM, r.borderRadiusOuter]).toEqual([6, 6]);
  });

  it('16 → LG 封顶 16、SM=8、Outer=6', () => {
    const r = genRadius(16);
    expect([r.borderRadiusLG, r.borderRadiusSM, r.borderRadiusOuter]).toEqual([16, 8, 6]);
  });

  it('14 → SM=7（最后一段 SM 区间）', () => {
    expect(genRadius(14).borderRadiusSM).toBe(7);
  });

  it('小于 5 时 XS / SM / LG / Outer 全部保持原值', () => {
    const r = genRadius(3);
    expect([r.borderRadiusLG, r.borderRadiusSM, r.borderRadiusXS, r.borderRadiusOuter]).toEqual([
      3, 3, 1, 3,
    ]);
  });
});

describe('genFontSizes —— 指数分级与取偶', () => {
  it('返回 10 档，第 2 档强制等于 base', () => {
    const sizes = genFontSizes(14);
    expect(sizes).toHaveLength(10);
    expect(sizes[1].size).toBe(14);
  });

  it('全部字号都是偶数', () => {
    for (const s of genFontSizes(14)) expect(s.size % 2).toBe(0);
  });

  it('base=14 的前几档与 antd 一致', () => {
    expect(
      genFontSizes(14)
        .slice(0, 4)
        .map((p) => p.size),
    ).toEqual([12, 14, 16, 20]);
  });

  it('lineHeight = (size + 8) / size', () => {
    expect(getLineHeight(8)).toBe(2);
    expect(getLineHeight(16)).toBe(1.5);
  });
});

describe('genFontMapToken', () => {
  it('fontSizeXL 与 fontSizeHeading4 同值（antd 的冗余定义）', () => {
    const t = genFontMapToken(14);
    expect(t.fontSizeXL).toBe(t.fontSizeHeading4);
    expect(t.fontSizeLG).toBe(t.fontSizeHeading5);
  });

  it('fontHeight 是行高 × 字号的取整', () => {
    const t = genFontMapToken(14);
    expect(t.fontHeight).toBe(Math.round(t.lineHeight * t.fontSize));
  });
});

describe('尺寸梯度', () => {
  it('默认梯度（sizeUnit=4 sizeStep=4）', () => {
    const s = genSizeMapToken({ sizeUnit: 4, sizeStep: 4 });
    expect(s.sizeXXS).toBe(4);
    expect(s.sizeXS).toBe(8);
    expect(s.sizeSM).toBe(12);
    expect(s.size).toBe(16);
    expect(s.sizeMS).toBe(16);
    expect(s.sizeMD).toBe(20);
    expect(s.sizeLG).toBe(24);
    expect(s.sizeXL).toBe(32);
    expect(s.sizeXXL).toBe(48);
  });

  it('紧凑梯度会合并相邻档位（不是整体减 2）', () => {
    const s = genCompactSizeMapToken({ sizeUnit: 4, sizeStep: 4 });
    expect(s.sizeLG).toBe(s.sizeMD);
    expect(s.size).toBe(s.sizeSM);
    expect(s.sizeXS).toBe(s.sizeXXS);
    expect(s.size).toBe(8);
  });
});

describe('genControlHeight', () => {
  it('三档是浮点，不取整', () => {
    const h = genControlHeight(32);
    expect(h.controlHeightSM).toBe(24);
    expect(h.controlHeightXS).toBe(16);
    expect(h.controlHeightLG).toBe(40);
    // 非 4 的倍数会出小数 —— 取整会改变视觉基线
    expect(genControlHeight(30).controlHeightSM).toBe(22.5);
  });
});

describe('genCommonMapToken', () => {
  it('动效时长用 toFixed(1) 规避浮点误差', () => {
    const t = genCommonMapToken(defaultSeedToken);
    expect(t.motionDurationFast).toBe('0.1s');
    expect(t.motionDurationMid).toBe('0.2s');
    expect(t.motionDurationSlow).toBe('0.3s');
  });

  it('同样用 toFixed(1) 挡住 0.30000000000000004', () => {
    const t = genCommonMapToken({ motionUnit: 0.1, motionBase: 0, borderRadius: 6, lineWidth: 1 });
    expect(t.motionDurationSlow).toBe('0.3s');
  });

  it('lineWidthBold = lineWidth + 1', () => {
    expect(genCommonMapToken({ ...defaultSeedToken, lineWidth: 2 }).lineWidthBold).toBe(3);
  });
});

describe('getAlphaColor —— 反解不透明色', () => {
  it('已经是半透明时直接返回原色（短路分支）', () => {
    expect(getAlphaColor('rgba(0, 0, 0, 0.5)', '#fff')).toBe('rgba(0, 0, 0, 0.5)');
  });

  it('纯黑叠白底 → 完全不透明的黑', () => {
    expect(getAlphaColor('#000', '#fff')).toBe('rgb(0,0,0)');
  });

  it('#f5f5f5 叠白底 → rgba(5,5,5,0.04)（antd 实测值）', () => {
    expect(getAlphaColor('#f5f5f5', '#ffffff')).toBe('rgba(5,5,5,0.04)');
  });

  it('#1677ff 叠白底 → rgba(2,107,255,0.92)（antd 实测值）', () => {
    expect(getAlphaColor('#1677ff', '#ffffff')).toBe('rgba(2,107,255,0.92)');
  });

  it('幂等：结果的 alpha 恒 <= 1', () => {
    for (const c of ['#f5f5f5', '#1677ff', '#52c41a', '#faad14']) {
      const out = getAlphaColor(c, '#ffffff');
      const a = Number((/rgba\([^)]*,\s*([\d.]+)\)/.exec(out) ?? [])[1] ?? '1');
      expect(a).toBeLessThanOrEqual(1);
    }
  });
});
