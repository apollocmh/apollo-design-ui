/**
 * 示例源码的 import 改写与辅助模块收集。
 *
 * 契约（面向用户的那段「复制即可用」代码）：
 *   - 内部相对路径（../../index）必须改写成公开包名 @apollo-design/ui
 *   - 展示源码里不得出现 workspace:*、仓库相对路径等**装不上**的东西
 *   - 多文件示例的辅助模块要一起展示（浅拷贝，不递归引入整个仓库）
 *   - 改写是**语法形态识别**，不是字符串替换：注释 / 字符串里的同名文本不能被误伤
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { collectDemoSources, transformImports } from '../tooling/content/demo-source.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const UI_SRC = path.resolve(HERE, '../../ui/src');
const buttonDemo = path.join(UI_SRC, 'button/demo');

describe('transformImports', () => {
  it('把 ../../index 改写成 @apollo-design/ui', () => {
    const { code } = transformImports(
      "import { Button } from '../../index';\n< template >",
      buttonDemo,
    );
    expect(code).toContain("from '@apollo-design/ui'");
    expect(code).not.toContain('../../index');
  });

  it('改写后保留空格（不产生 from 与引号粘连的产物）', () => {
    const { code } = transformImports("import { Button } from '../../index';", buttonDemo);
    expect(code).toBe("import { Button } from '@apollo-design/ui';");
  });

  it('type import 同样改写', () => {
    const { code } = transformImports(
      "import type { ButtonProps } from '../../index';",
      buttonDemo,
    );
    expect(code).toContain('@apollo-design/ui');
  });

  it('动态 import() 同样改写', () => {
    const { code } = transformImports("const m = await import('../../index');", buttonDemo);
    expect(code).toContain("import('@apollo-design/ui')");
  });

  it('export ... from 同样改写', () => {
    const { code } = transformImports("export { Button } from '../../index';", buttonDemo);
    expect(code).toContain("from '@apollo-design/ui'");
  });

  it('第三方 bare import 原样保留（vue / dayjs 等）', () => {
    const src = "import { ref } from 'vue';\nimport dayjs from 'dayjs';";
    expect(transformImports(src, buttonDemo).code).toBe(src);
  });

  it('不误伤注释与字符串字面量里的同名文本', () => {
    const src = [
      "// 注意：不要写 from '../../index'",
      'const tip = "import x from \'../../index\'";',
      "import { Button } from '../../index';",
    ].join('\n');
    const { code } = transformImports(src, buttonDemo);
    expect(code).toContain("// 注意：不要写 from '../../index'");
    expect(code).toContain('"import x from \'../../index\'"');
    expect(code).toContain("from '@apollo-design/ui'");
  });

  it('demo 局部辅助模块保持相对路径，并被记录为 auxiliary', () => {
    const dir = path.join(UI_SRC, 'tree/demo');
    const { code, auxiliary } = transformImports(
      "import type { TreeProps } from '../interface';",
      dir,
    );
    expect(code).toContain("'../interface'");
    expect(auxiliary.some((p: string) => p.endsWith('tree/interface.ts'))).toBe(true);
  });
});

describe('collectDemoSources', () => {
  it('主文件排在首位且标记 main', () => {
    const src = collectDemoSources(path.join(UI_SRC, 'button/demo/basic.vue'));
    expect(src[0]!.main).toBe(true);
    expect(src[0]!.label).toBe('basic.vue');
    expect(src[0]!.lang).toBe('vue');
  });

  it('多文件示例把辅助模块一起收进来（浅拷贝，不递归整个仓库）', () => {
    const src = collectDemoSources(path.join(UI_SRC, 'tree/demo/dynamic.vue'));
    expect(src.length).toBeGreaterThan(1);
    expect(src.filter((s: { main: boolean }) => !s.main).length).toBeGreaterThan(0);
    // 辅助文件用相对 demo 目录的路径做标签，用户能照着建
    for (const s of src.slice(1)) expect(s.label).not.toMatch(/^\.\.\/\.\.\/\.\./);
  });

  it('单文件示例不凭空多出辅助文件', () => {
    const src = collectDemoSources(path.join(UI_SRC, 'button/demo/basic.vue'));
    expect(src.length).toBe(1);
  });

  it('辅助模块的 import 也被改写（不是只有主文件被处理）', () => {
    const src = collectDemoSources(path.join(UI_SRC, 'tree/demo/dynamic.vue'));
    for (const s of src) {
      expect(s.code).not.toMatch(/from\s+'\.\.\/\.\.\/index'/);
    }
  });
});

describe('展示源码的可用性红线', () => {
  it('全量示例源码里不得出现 workspace: 协议', () => {
    const offenders = allDemoSources().filter((s) => s.code.includes('workspace:*'));
    expect(offenders.map((s) => s.path)).toEqual([]);
  });

  it('全量示例源码里不得残留指向仓库内部的深层相对导入', () => {
    const offenders = allDemoSources().filter((s) =>
      /from\s+['"](\.\.\/){2,}/.test(s.code.replace(/from\s+['"]\.\.\/\.\.\/index['"]/g, '')),
    );
    expect(
      offenders.slice(0, 5).map((s) => s.path),
      `残留 ${offenders.length} 处`,
    ).toEqual([]);
  });

  it('引用组件库时一律用 @apollo-design/ui（不是相对路径）', () => {
    const offenders = allDemoSources().filter(
      (s) => /@apollo-design\/ui/.test(s.code) === false && /from\s+['"]\.\.\/\.\.\//.test(s.code),
    );
    expect(offenders.map((s) => s.path)).toEqual([]);
  });
});

/** 全量示例源码（754 个主文件 + 辅助文件）。 */
function allDemoSources(): Array<{ path: string; code: string }> {
  const out: Array<{ path: string; code: string }> = [];
  for (const comp of fs.readdirSync(UI_SRC)) {
    const demoDir = path.join(UI_SRC, comp, 'demo');
    if (!fs.existsSync(demoDir)) continue;
    for (const f of fs.readdirSync(demoDir)) {
      if (!f.endsWith('.vue')) continue;
      out.push(...collectDemoSources(path.join(demoDir, f)));
    }
  }
  return out;
}
