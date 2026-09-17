/**
 * 颜色 —— `theme` 与 `icons` 共用的纯数学层。
 *
 * 放在 `utils` 而不是新开一个包，依据 `ARCHITECTURE.md` §3.1 R2 的例外条款：
 * `utils` 是 L0 的公共底座（`icons` / `motion` / `portal` … 都已依赖它），
 * 而新开包会把「只建必要数量」的约束往坏的方向推。
 *
 * ⚠️ 本目录**只能放算法**，不能放色值数据（R3）。
 * 预设色板这类数据归 `theme`，且必须是构建期固化物。
 */

export { Color } from './color';
export type { GenerateOptions } from './generate';
export { generatePalette } from './generate';
export type { ColorInput, ColorObject, HslColor, HsvColor, Rgba, RgbColor } from './types';
