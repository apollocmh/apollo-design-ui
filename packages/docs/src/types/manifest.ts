/**
 * 内容管线的类型化契约（与 tooling/content/build-manifest.mjs 的产物一一对应）。
 * manifest 是构建期产物：结构变化必须同时改两边，并以 tests 内的类型用例钉住。
 */

export interface Bilingual {
  /** 中文（缺失时回退到 en 或文件名兜底）。 */
  zh: string;
  /** 英文（缺失时回退到 zh，enFallback 标记）。 */
  en: string;
  /** en 是否为回退值（页面上给出真实提示，不静默混排）。 */
  enFallback: boolean;
}

export interface TocItem {
  level: 2 | 3;
  text: string;
  id: string;
}

/** 预渲染的文档页面（构建期 markdown-it + shiki 产物，客户端不做 markdown 编译）。 */
export interface RenderedDoc {
  introHtml: string;
  restHtml: string;
  toc: TocItem[];
}

/** 指南页是单段正文（无 demo 拆分）。 */
export interface RenderedGuideDoc {
  html: string;
  toc: TocItem[];
}

export interface SourceFile {
  /** 相对 demo 目录的路径。 */
  path: string;
  label: string;
  /** 已完成 import 改写的展示源码（与真实运行的示例对应）。 */
  code: string;
  /** 构建期 shiki 高亮产物（双主题，客户端零高亮成本）。 */
  codeHtml: string;
  lang: string;
  main: boolean;
}

export interface DemoMeta {
  id: string;
  component: string;
  name: string;
  order: number;
  title: Bilingual;
  desc: Bilingual;
  descHtml: Bilingual;
  /** 元数据显式声明：该 demo 用 iframe 隔离（全局样式/全局状态场景）。 */
  iframe: boolean;
  sources: SourceFile[];
  /** GitHub 上对应源文件的仓库相对路径。 */
  githubPath: string;
}

export interface ComponentPageData {
  name: string;
  pascal: string;
  /** 公开导出（用于「使用方式」导入语句）。 */
  imports: string[];
  category: string;
  title: Bilingual;
  subtitle: Bilingual;
  doc: { zh: RenderedDoc; en: RenderedDoc };
  demos: DemoMeta[];
  githubDir: string;
}

export interface NavComponentEntry {
  name: string;
  title: Bilingual;
  subtitle: Bilingual;
  demoCount: number;
}

export interface NavCategory {
  name: string;
  components: NavComponentEntry[];
}

export interface GuideMeta {
  slug: string;
  title: Bilingual;
  order: number;
}

export interface GuidePageData {
  slug: string;
  title: Bilingual;
  doc: { zh: RenderedGuideDoc; en: RenderedGuideDoc };
}

export type SearchDocType = 'component' | 'demo' | 'guide';

export interface SearchDocument {
  type: SearchDocType;
  id: string;
  component?: string;
  demo?: string;
  title: Bilingual;
  subtitle?: Bilingual;
  text: { zh: string; en: string };
  route: { zh: string; en: string };
  anchor?: string;
}

export interface ChangelogCommit {
  hash: string;
  type: string;
  scope: string;
  subject: string;
}

export interface ChangelogDay {
  date: string;
  commits: ChangelogCommit[];
}

export interface SiteManifest {
  generatedAt: string;
  repoUrl: string;
  apolloVersion: string;
  antdTarget: string;
  categories: NavCategory[];
  components: Array<{
    name: string;
    id: string;
    title: Bilingual;
    subtitle: Bilingual;
    category: string;
    demoCount: number;
  }>;
  guides: GuideMeta[];
}
