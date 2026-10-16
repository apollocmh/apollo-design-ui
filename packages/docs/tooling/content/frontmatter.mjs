/**
 * frontmatter 解析（构建期专用）。
 *
 * 为什么不用 gray-matter：文档 frontmatter 只用到三种形态 ——
 *   1. 标量（category: 通用 / order: 0）
 *   2. 嵌套双语（title: { zh-CN: ..., en-US: ... }）
 *   3. 顶层双语（title.zh-CN: ...）
 * 用 `yaml` 包正确解析（处理引号/转义/CRLF/BOM），再归一化嵌套键。
 */
import yaml from 'yaml';

/** 去掉 UTF-8 BOM 与统一 CRLF → LF。 */
export function normalizeText(raw) {
  return raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}

/** 把 `a.b.c: v` 形态的扁平键归一成嵌套对象。 */
function unflatten(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split('.');
    let cur = out;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const p = parts[i];
      if (typeof cur[p] !== 'object' || cur[p] === null) cur[p] = {};
      cur = cur[p];
    }
    cur[parts[parts.length - 1]] = value;
  }
  return out;
}

/** 解析 `--- ... ---` frontmatter；无 frontmatter 返回 {}。 */
export function parseFrontmatter(raw) {
  const text = normalizeText(raw);
  const m = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(text);
  if (!m) return { meta: {}, body: text };
  let parsed;
  try {
    parsed = yaml.parse(m[1]) ?? {};
  } catch (error) {
    throw new Error(`frontmatter YAML 解析失败：${error.message}\n---\n${m[1]}`);
  }
  return { meta: unflatten(parsed), body: text.slice(m[0].length) };
}

/**
 * 文本字段强制转字符串。
 *
 * ⚠️ 真缺陷（不是理论问题）：demo 里存在 `title: 403` 这类 YAML **数字标量**
 * （result 组件的 403/404/500 示例）。下游把 title 当字符串用（`.toLowerCase()`、
 * 模板插值），拿到 number 会直接抛错 —— 归一化必须在这里收口，而不是让每个消费方各自防御。
 */
function asText(v) {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return '';
}

/** 读取双语字段：优先 `meta.title.zh-CN`，回退到字符串形态 `meta.title`。 */
export function localeOf(meta, field, fallback = '') {
  const v = meta?.[field];
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (v && typeof v === 'object') {
    return asText(v['zh-CN']) || asText(v['en-US']) || fallback;
  }
  return fallback;
}

/** 归一的双语取值：{ zh, en }，缺失侧回退到另一侧并标记 fallback。 */
export function bilingualOf(meta, field, fallbackZh = '', fallbackEn = '') {
  const v = meta?.[field];
  const obj =
    typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
      ? { 'zh-CN': asText(v) }
      : v && typeof v === 'object'
        ? v
        : {};
  const zh = asText(obj['zh-CN']) || fallbackZh;
  const en =
    asText(obj['en-US']) || (obj['zh-CN'] !== undefined ? asText(obj['zh-CN']) : '') || fallbackEn;
  return {
    zh,
    en,
    enFallback: obj['en-US'] === undefined,
  };
}
