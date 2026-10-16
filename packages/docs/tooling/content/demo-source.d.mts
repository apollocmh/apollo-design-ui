export function transformImports(
  code: string,
  importerDir: string,
): { code: string; auxiliary: string[] };

export interface CollectedSource {
  path: string;
  label: string;
  code: string;
  lang: string;
  main: boolean;
}

export function collectDemoSources(demoVuePath: string): CollectedSource[];
