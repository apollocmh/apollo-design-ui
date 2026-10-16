/**
 * tooling/ 下的 .mjs 都是构建期脚本（Node ESM），没有 .d.ts 时 vue-tsc 会把
 * 它们当成隐式 any。这里只声明**测试与配置真正用到的**导出签名，
 * 不为脚本补完整类型 —— 它们是工具，不是公共 API 面。
 */
export function normalizeText(raw: string): string;
export function parseFrontmatter(raw: string): { meta: Record<string, unknown>; body: string };
export function localeOf(meta: unknown, field: string, fallback?: string): string;
export function bilingualOf(
  meta: unknown,
  field: string,
  fallbackZh?: string,
  fallbackEn?: string,
): { zh: string; en: string; enFallback: boolean };
