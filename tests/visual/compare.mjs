/**
 * compare.mjs — sharp 归一化 + pixelmatch 逐像素比对。
 *
 * ── 阈值（`TESTING.md` §9.3，不得放宽 —— `T17`） ───────────────────────────
 *
 * | 差异率 | 判定 |
 * |---|---|
 * | 0% | ✅ |
 * | ≤ 0.1% 且为分散单像素（抗锯齿噪声） | ✅ 自动 |
 * | > 0.1% 或成块 | ❌ 必须人工确认并分类 |
 *
 * 「抗锯齿噪声」的判据是**邻域分析**而不是拍脑袋：统计每个差异像素 8 邻域里的差异像素数，
 * 若绝大多数（≥ 90%）差异像素的邻居 ≤ 1，说明它们是散点而非色块。色块意味着真的画错了。
 *
 * ── 尺寸不一致怎么算 ────────────────────────────────────────────────────────
 *
 * 尺寸不同本身就是「成块差异」—— 组件高度差 1px 也是视觉差异。所以直接判 FAIL，
 * 但仍然产出一对齐后的 diff 图供人工分类（把两者贴到同一画布再比）。
 */

import fs from 'node:fs';
import path from 'node:path';

import pixelmatch from 'pixelmatch';
import sharp from 'sharp';

/** 差异率上限：0.1%。来自 TESTING.md §9.3，改这里需要用户批准。 */
export const MAX_DIFF_RATIO = 0.001;

/** 抗锯齿噪声判据：散点（邻居 ≤ 1）占差异像素的比例下限。 */
export const MIN_ISOLATED_RATIO = 0.9;

/** pixelmatch 的像素匹配阈值：0 最严格，1 最宽松。取 0.1（行业惯例 + 本项目的严格度）。 */
export const PIXEL_THRESHOLD = 0.1;

/**
 * 比对一对截图。
 * @param {string} reactPath React 参考（antd 6.6.4）
 * @param {string} vuePath   本实现（@apollo-design/ui）
 * @param {string} diffPath  diff 图输出路径
 */
export async function comparePair(reactPath, vuePath, diffPath) {
  if (!fs.existsSync(reactPath)) {
    return {
      verdict: 'FAIL',
      reason: 'missing-baseline',
      message: `缺少 React 参考截图：${reactPath}`,
    };
  }
  if (!fs.existsSync(vuePath)) {
    return { verdict: 'FAIL', reason: 'missing-current', message: `缺少 Vue 截图：${vuePath}` };
  }

  const metaA = await sharp(reactPath).metadata();
  const metaB = await sharp(vuePath).metadata();

  const sizeMismatch = metaA.width !== metaB.width || metaA.height !== metaB.height;

  // 对齐到同一画布：取两者最大尺寸，不足处用白色填充（light 主题背景）。
  const width = Math.max(metaA.width, metaB.width);
  const height = Math.max(metaA.height, metaB.height);

  const rawA = await toRaw(reactPath, width, height);
  const rawB = await toRaw(vuePath, width, height);

  const diffBuf = Buffer.alloc(width * height * 4);
  const diffPixels = pixelmatch(rawA, rawB, diffBuf, width, height, {
    threshold: PIXEL_THRESHOLD,
    diffMask: true,
  });

  const total = width * height;
  const diffRatio = total === 0 ? 0 : diffPixels / total;
  const isolatedRatio = diffPixels === 0 ? 1 : analyzeIsolated(diffBuf, width, height);

  // 写 diff 图（把差异画到 React 底图上，肉眼可定位）
  fs.mkdirSync(path.dirname(diffPath), { recursive: true });
  await sharp(rawA, { raw: { width, height, channels: 4 } })
    .composite([{ input: diffBuf, raw: { width, height, channels: 4 }, blend: 'over' }])
    .png()
    .toFile(diffPath);

  const result = {
    reactSize: { width: metaA.width, height: metaA.height },
    vueSize: { width: metaB.width, height: metaB.height },
    sizeMismatch,
    diffPixels,
    totalPixels: total,
    diffRatio,
    isolatedRatio,
    diffPath,
  };

  if (sizeMismatch) {
    return {
      ...result,
      verdict: 'FAIL',
      reason: 'size-mismatch',
      message:
        `尺寸不一致：React ${metaA.width}×${metaA.height} vs Vue ${metaB.width}×${metaB.height}。` +
        '尺寸差异本身即成块差异，必须人工分类（TESTING.md §4.3：BUG / INTENDED / PLATFORM / UPSTREAM）。',
    };
  }

  if (diffPixels === 0) {
    return { ...result, verdict: 'PASS', reason: 'exact', message: '逐像素完全一致。' };
  }

  if (diffRatio <= MAX_DIFF_RATIO && isolatedRatio >= MIN_ISOLATED_RATIO) {
    return {
      ...result,
      verdict: 'PASS',
      reason: 'antialias-noise',
      message:
        `差异率 ${(diffRatio * 100).toFixed(4)}% ≤ 0.1%，且 ${(isolatedRatio * 100).toFixed(1)}% 的` +
        `差异像素是散点（邻域 ≤ 1），判定为抗锯齿噪声。`,
    };
  }

  return {
    ...result,
    verdict: 'FAIL',
    reason: isolatedRatio < MIN_ISOLATED_RATIO ? 'block-diff' : 'diff-over-threshold',
    message:
      `差异率 ${(diffRatio * 100).toFixed(4)}%（阈值 0.1%），散点占比 ` +
      `${(isolatedRatio * 100).toFixed(1)}%（阈值 90%）。必须人工确认并分类。`,
  };
}

/** 读成指定尺寸的 raw RGBA buffer（不足处白色填充）。 */
async function toRaw(file, width, height) {
  return (
    sharp(file)
      // position 必须是 sharp 认可的单个值（'left top'），写成 'top left' 会直接抛错。
      // 左上角对齐：把差异留在右下角，而不是把内容居中后两侧各差半像素。
      .resize(width, height, { fit: 'contain', position: 'left top', background: '#ffffff' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: false })
  );
}

/**
 * 邻域分析：返回「邻居 ≤ 1 的差异像素」占全部差异像素的比例。
 * diffMask 模式下，差异像素在 alpha 通道为 255、其余为 0（pixelmatch 的 diffMask 行为）。
 */
function analyzeIsolated(diffBuf, width, height) {
  let diffCount = 0;
  let isolated = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      if (!isDiffPixel(diffBuf, i)) continue;
      diffCount += 1;

      let neighbours = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          if (isDiffPixel(diffBuf, (ny * width + nx) * 4)) neighbours += 1;
        }
      }
      if (neighbours <= 1) isolated += 1;
    }
  }
  return diffCount === 0 ? 1 : isolated / diffCount;
}

/** pixelmatch 的 diffMask：差异像素为不透明的红（R=255,G=0,B=0,A=255）。 */
function isDiffPixel(buf, i) {
  return buf[i + 3] > 0;
}
