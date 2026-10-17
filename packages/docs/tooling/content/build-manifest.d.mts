/**
 * build-manifest.mjs 的类型声明（工具脚本是 ESM JS，vite.config 以 TS 引入）。
 */
export interface BuildManifestResult {
  ok: boolean;
  problems: string[];
  notes: string[];
  manifest: {
    generatedAt: string;
    repoUrl: string;
    apolloVersion: string;
    antdTarget: string;
    categories: Array<{ name: string; components: Array<{ name: string }> }>;
    components: Array<{ name: string }>;
    guides: Array<{ slug: string }>;
  };
}

export declare function buildManifest(options?: { write?: boolean }): Promise<BuildManifestResult>;

/**
 * 清掉历史遗留的 demo 引用标记：`### 标题` + `<code src="…">`。
 * 演示卡片由 `demo/*.md` + `demo/*.vue` 渲染，这些标记只会被直出成空小节
 * （页面底部重复的标题列表）。
 */
export declare function stripLegacyDemoRefs(body: string): string;
