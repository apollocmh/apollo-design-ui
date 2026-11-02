import type MarkdownIt from 'markdown-it';

interface MarkdownOptions {
  currentPathPrefix?: string;
  pageTitles?: string[];
}

interface Heading {
  level: number;
  text: string;
  id: string;
}

interface RenderedDoc {
  html: string;
  toc: Heading[];
}

export declare function slugify(text: string): string;
export declare function createMarkdownRenderer(options?: MarkdownOptions): Promise<{
  md: MarkdownIt;
  headings: () => Heading[];
}>;
export declare function renderDoc(text: string, options?: MarkdownOptions): Promise<RenderedDoc>;
export declare function renderDocWithToc(
  text: string,
  options?: MarkdownOptions,
): Promise<RenderedDoc>;
export declare function highlightCode(code: string, lang?: string): Promise<string>;
