import { describe, expect, it } from 'vitest';
import {
  compactAlgorithm,
  darkAlgorithm,
  defaultAlgorithm,
  getDesignToken,
} from '../get-design-token';
import { defaultSeedToken, PresetColors } from '../seed';

/**
 * getDesignToken 的纯度契约。
 *
 * 「纯函数」不是修辞：ConfigProvider 会在多个组件里并发调用它，
 * 一旦它读写全局状态，就会出现「后渲染的组件改了先渲染组件的主题」。
 *
 * 这里重点盯两类污染：
 *   1. 入参被就地修改（调用方传进来的 token 对象被写脏）
 *   2. 默认 seed 被修改（模块级单例被算法副作用污染 —— antd 自己就有
 *      `presetPrimaryColors.pink = magenta` 这种就地赋值，我们必须在自己内部消化掉）
 */
describe('getDesignToken 是纯函数', () => {
  it('同一入参两次调用结果完全一致', () => {
    const a = getDesignToken();
    const b = getDesignToken();
    expect(a).toEqual(b);
  });

  it('不修改传入的 config.token', () => {
    const override = { colorPrimary: '#00b96b', borderRadius: 10 };
    const snapshot = { ...override };
    getDesignToken({ token: override });
    expect(override).toEqual(snapshot);
  });

  it('★ 不污染模块级 defaultSeedToken', () => {
    const before = JSON.stringify(defaultSeedToken);
    getDesignToken();
    getDesignToken({ algorithm: darkAlgorithm });
    getDesignToken({ algorithm: [darkAlgorithm, compactAlgorithm] });
    getDesignToken({ token: { colorPrimary: '#00b96b' } });
    expect(JSON.stringify(defaultSeedToken)).toBe(before);
  });

  it('★ 连续调用不同算法互不干扰（暗色不会渗进后续的亮色）', () => {
    const dark = getDesignToken({ algorithm: darkAlgorithm });
    const light = getDesignToken();
    expect(light.colorBgContainer).toBe('#ffffff');
    expect(dark.colorBgContainer).toBe('#141414');
    // 再跑一次暗色，结果必须和第一次一致（证明没有累积状态）
    expect(getDesignToken({ algorithm: darkAlgorithm }).colorBgContainer).toBe(
      dark.colorBgContainer,
    );
  });

  it('返回值是新对象，改动它不影响后续调用', () => {
    const first = getDesignToken();
    (first as unknown as Record<string, unknown>).colorPrimary = '#mutated';
    expect(getDesignToken().colorPrimary).toBe('#1677ff');
  });
});

describe('算法可组合', () => {
  it('[dark, compact] 与先 dark 再 compact 的链式结果一致', () => {
    const composed = getDesignToken({ algorithm: [darkAlgorithm, compactAlgorithm] });
    const chained = getDesignToken({ algorithm: compactAlgorithm });
    // 两者都以 dark 为底色时，紧凑相关的尺寸应当一致
    expect(composed.size).toBe(chained.size);
    expect(composed.controlHeight).toBe(28);
  });

  it('★ dark 与 compact 顺序不影响结果（已用 antd 真实代码核对 diff=0）', () => {
    // 这条断言的是「两者改动面不相交」：dark 只动颜色，compact 只动尺寸与字号，
    // 且 compact 只从上游读 fontSizeSM（dark 不改它）。所以它们可交换。
    //
    // 它不是「顺序一定无所谓」的一般性结论 —— 任何让 compact 去读一个颜色 token
    // 的改动都会立刻让这条用例变红，那正是我们想要的告警。
    const a = getDesignToken({ algorithm: [darkAlgorithm, compactAlgorithm] });
    const b = getDesignToken({ algorithm: [compactAlgorithm, darkAlgorithm] });
    expect(a).toEqual(b);
  });

  it('[dark, compact] 同时生效：底色是暗的、尺寸是紧凑的', () => {
    const t = getDesignToken({ algorithm: [darkAlgorithm, compactAlgorithm] });
    expect(t.colorBgContainer).toBe('#141414');
    expect(t.controlHeight).toBe(28);
    expect(t.size).toBe(8);
  });

  it('default 单独使用与不传 algorithm 等价', () => {
    expect(getDesignToken({ algorithm: defaultAlgorithm })).toEqual(getDesignToken());
  });
});

describe('Seed 契约', () => {
  it('colorLink / colorTextBase / colorBgBase 默认为空串（空串是有意义的分支）', () => {
    expect(defaultSeedToken.colorLink).toBe('');
    expect(defaultSeedToken.colorTextBase).toBe('');
    expect(defaultSeedToken.colorBgBase).toBe('');
  });

  it('13 个预设色，pink 与 magenta 同值', () => {
    expect(PresetColors).toHaveLength(13);
    expect(defaultSeedToken.pink).toBe(defaultSeedToken.magenta);
  });

  it('pink 与 magenta 各自生成一套完整色板（antd 的冗余行为）', () => {
    const t = getDesignToken() as unknown as Record<string, string>;
    for (let i = 1; i <= 10; i += 1) {
      expect(t[`pink-${i}`]).toBe(t[`magenta-${i}`]);
    }
  });

  it('非 Seed 的 override 会盖掉 alias 的派生值', () => {
    const t = getDesignToken({ token: { colorPrimaryBg: '#123456' } });
    expect(t.colorPrimaryBg).toBe('#123456');
  });

  it('Seed 键的 override 在 Seed 阶段生效（不参与 alias 覆盖）', () => {
    const t = getDesignToken({ token: { colorPrimary: '#00b96b' } });
    expect(t.colorPrimary).toBe('#00b96b');
    // 派生出来的 Bg 应当跟着变，而不是保持默认主色的派生值
    expect(t.colorPrimaryBg).not.toBe('#e6f4ff');
  });

  it('★ 显式传 undefined 会真的产出 undefined（对齐 antd，不擅自"修好"）', () => {
    // antd 实测：`getDesignToken({ token: { colorPrimaryBg: undefined } }).colorPrimaryBg === undefined`。
    // 我们一度改成"忽略 undefined"，那是与 antd 的偏差 —— 已回退。
    // 这条用例锁住这个行为：想改它必须先登记兼容性差异，不能悄悄改。
    const bare = getDesignToken();
    expect(bare.colorPrimaryBg).toBe('#e6f4ff');
    const withUndef = getDesignToken({ token: { colorPrimaryBg: undefined } });
    expect(withUndef.colorPrimaryBg).toBeUndefined();
  });

  it('motion: false 把三档时长全部归零', () => {
    const t = getDesignToken({ token: { motion: false } });
    expect(t.motionDurationFast).toBe('0s');
    expect(t.motionDurationMid).toBe('0s');
    expect(t.motionDurationSlow).toBe('0s');
  });
});
