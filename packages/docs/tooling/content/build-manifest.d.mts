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
