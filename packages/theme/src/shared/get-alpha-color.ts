import { FastColor } from '@ant-design/fast-color';

function isStableColor(color: number): boolean {
  return color >= 0 && color <= 255;
}

/**
 * 求「前景色叠在背景色上，视觉等价于某个不透明色」的那个不透明色。
 *
 * antd 用它把「半透明前景」反解成「实色 + alpha」，供不支持透明的场景使用。
 *
 * 算法是从 0.01 起以 0.01 步长暴力搜索第一个能让 RGB 都落在 [0,255] 的 alpha。
 * 这是 O(100) 的循环，不是解析解 —— 改写成闭式解会改变取值（因为 antd 的搜索
 * 顺序决定了「第一个满足」是哪一个），所以必须逐字保留。
 *
 * 短路条件：`originAlpha < 1` 时直接返回原色（已经是半透明，无需再解）。
 */
export default function getAlphaColor(frontColor: string, backgroundColor: string): string {
  const { r: fR, g: fG, b: fB, a: originAlpha } = new FastColor(frontColor).toRgb();

  if (originAlpha < 1) {
    return frontColor;
  }

  const { r: bR, g: bG, b: bB } = new FastColor(backgroundColor).toRgb();

  for (let fA = 0.01; fA <= 1; fA += 0.01) {
    const r = Math.round((fR - bR * (1 - fA)) / fA);
    const g = Math.round((fG - bG * (1 - fA)) / fA);
    const b = Math.round((fB - bB * (1 - fA)) / fA);
    if (isStableColor(r) && isStableColor(g) && isStableColor(b)) {
      return new FastColor({
        r,
        g,
        b,
        a: Math.round(fA * 100) / 100,
      }).toRgbString();
    }
  }

  // antd 在这里有 `/* istanbul ignore next */`：正常输入下不可达。
  // 我们保留同样的兜底，但不给它写测试断言 —— 断言不可达分支等于断言 nothing。
  return new FastColor({ r: fR, g: fG, b: fB, a: 1 }).toRgbString();
}
