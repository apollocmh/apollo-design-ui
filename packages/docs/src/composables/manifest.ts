/**
 * 内容数据访问层：manifest 静态导入（小），页面数据按需懒加载（大）。
 * `.generated/` 由 tooling/content/build-manifest.mjs 产出。
 */

import rawManifest from '../../.generated/manifest.json';
import type {
  ChangelogDay,
  ComponentPageData,
  GuidePageData,
  SearchDocument,
  SiteManifest,
} from '../types/manifest';

export const siteManifest = rawManifest as unknown as SiteManifest;

/** 组件页数据（文档 HTML + TOC + demo 元数据与源码）。 */
const componentPageLoaders = import.meta.glob<{ default: ComponentPageData }>(
  '../../.generated/docs/*.json',
);

const guidePageLoaders = import.meta.glob<{ default: GuidePageData }>(
  '../../.generated/guides/*.json',
);

export async function loadComponentPage(name: string): Promise<ComponentPageData> {
  const loader = componentPageLoaders[`../../.generated/docs/${name}.json`];
  if (!loader) throw new Error(`未知组件：${name}`);
  return (await loader()).default;
}

export async function loadGuidePage(slug: string): Promise<GuidePageData> {
  const loader = guidePageLoaders[`../../.generated/guides/${slug}.json`];
  if (!loader) throw new Error(`未知指南：${slug}`);
  return (await loader()).default;
}

/** 搜索索引（首次打开搜索时才下载）。 */
export async function loadSearchIndex(): Promise<SearchDocument[]> {
  const mod = await import('../../.generated/search.json');
  return (mod.default as unknown as SearchDocument[]) ?? [];
}

export async function loadChangelog(): Promise<{ generatedAt: string; days: ChangelogDay[] }> {
  const mod = await import('../../.generated/changelog.json');
  return mod.default as unknown as { generatedAt: string; days: ChangelogDay[] };
}

/** 按 name 查组件清单项（导航 / 面包屑用）。 */
export function findComponent(name: string): SiteManifest['components'][number] | undefined {
  return siteManifest.components.find((c) => c.name === name);
}
