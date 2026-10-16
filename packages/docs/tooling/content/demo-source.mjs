/**
 * Demo 展示源码的 import 改写（构建期）。
 *
 * 需求：展示源码与真实运行的示例保持对应，但不把仓库内部路径暴露给用户。
 * 做法：**语法形态识别**（import / export-from / 动态 import 三种语句的模块说明符），
 * 只改写「解析后指向某个包入口 index 的相对路径」为公开包名；
 * 其余相对导入（demo 局部辅助模块）原样保留 —— 这些文件会被收集为辅助源码一起展示。
 *
 * 刻意不做字符串全局替换：`from '../../index'` 只可能出现在模块说明符位置，
 * 但粗暴 replace 会误伤注释、字符串字面量里的同名文本。
 */
import nodePath from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// 本文件位于 packages/docs/tooling/content/ ⇒ ui/src 在 ../../../ui/src。
const HERE = nodePath.dirname(fileURLToPath(import.meta.url));
const UI_SRC = nodePath.resolve(HERE, '../../../ui/src');

/** 包目录名 → 公开包名（packages/x → @apollo-design/x）。 */
function packageNameFor(dirPath) {
  const rel = nodePath.relative(nodePath.resolve(UI_SRC, '../..'), dirPath);
  const parts = rel.split(nodePath.sep);
  if (parts[0] === 'packages' && parts.length >= 2) {
    return `@apollo-design/${parts[1]}`;
  }
  return null;
}

/**
 * 解析模块说明符。
 * 返回 { kind: 'ui' | 'package' | 'relative' | 'bare', spec, resolvedFile? }
 */
function classify(spec, importerDir) {
  if (!spec.startsWith('.')) return { kind: 'bare', spec };
  const resolved = nodePath.resolve(importerDir, spec);
  // ① 指向 ui 包入口
  const asIndex = (p) =>
    fs.existsSync(p) && fs.statSync(p).isFile()
      ? p
      : fs.existsSync(nodePath.join(p, 'index.ts'))
        ? nodePath.join(p, 'index.ts')
        : null;
  const file = asIndex(resolved) ?? asIndex(`${resolved}.ts`);
  if (file) {
    if (nodePath.dirname(file) === UI_SRC) return { kind: 'ui', spec, resolvedFile: file };
    const pkg = packageNameFor(nodePath.dirname(file));
    if (pkg && nodePath.basename(file) === 'index.ts') {
      return { kind: 'package', spec, resolvedFile: file, packageName: pkg };
    }
  }
  return { kind: 'relative', spec, resolvedFile: file ?? undefined };
}

/**
 * 标记「不可改写区域」：字符串字面量、模板字符串、行注释、块注释。
 *
 * 为什么需要：仅靠正则无法区分「模块说明符」和「长得像 import 语句的字符串内容」。
 * 实测缺陷 —— 注释里写 `// 不要写 from '../../index'` 会被改写，
 * 于是展示给用户的示例代码与注释自相矛盾。
 */
function maskLiterals(code) {
  const skip = new Uint8Array(code.length);
  const n = code.length;
  let i = 0;
  while (i < n) {
    const c = code[i];
    if (c === '/' && code[i + 1] === '/') {
      const end = code.indexOf('\n', i);
      const e = end === -1 ? n : end;
      skip.fill(1, i, e);
      i = e;
      continue;
    }
    if (c === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2);
      const e = end === -1 ? n : end + 2;
      skip.fill(1, i, e);
      i = e;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < n) {
        if (code[j] === '\\') {
          j += 2;
          continue;
        }
        if (code[j] === c) break;
        j += 1;
      }
      const e = Math.min(j + 1, n);
      skip.fill(1, i, e);
      i = e;
      continue;
    }
    i += 1;
  }
  return skip;
}

/**
 * 改写一段源码里的 import 说明符。
 * 返回 { code, auxiliary: string[] }（auxiliary = 保留的相对导入解析出的文件绝对路径）。
 *
 * 🚨 每条 pattern 必须自带 render —— 曾经三条共用 `from` 模板，于是
 *   `await import('../../index')` 被改写成 `await import from '@apollo-design/ui'`
 *   （**产物是非法代码**）。语句形态由 pattern 决定，不能统一套 `from`。
 */
export function transformImports(code, importerDir) {
  const auxiliary = new Set();
  const skip = maskLiterals(code);
  const patterns = [
    {
      // 静态 import（含 type import）/ export ... from
      re: /(\bimport\s+type\b[^'"]*?|\bimport\b[^'"]*?|\bexport\b[^'"]*?)\sfrom\s*(['"])([^'"]+)\2/g,
      render: (head, quote, spec) => `${head} from ${quote}${spec}${quote}`,
    },
    {
      // 动态 import('...')
      re: /(\bimport\s*)\(\s*(['"])([^'"]+)\2\s*\)/g,
      render: (head, quote, spec) => `${head}(${quote}${spec}${quote})`,
    },
    {
      // 侧效 import '...'
      re: /(\bimport\s*)(['"])([^'"]+)\2/g,
      render: (head, quote, spec) => `${head}${quote}${spec}${quote}`,
    },
  ];

  let out = code;
  for (const { re, render } of patterns) {
    out = out.replace(re, (match, head, quote, spec, offset) => {
      // 落在字符串 / 注释里的「假 import 语句」原样保留。
      // ⚠️ 只看**起始位置**：match 本身包含模块说明符（它天然落在字符串区内），
      //    连末端一起判会把所有真语句也误判成字符串。
      if (skip[offset]) return match;
      const info = classify(spec, importerDir);
      if (info.kind === 'ui') return render(head, quote, '@apollo-design/ui');
      if (info.kind === 'package') return render(head, quote, info.packageName);
      if (info.kind === 'relative' && info.resolvedFile) {
        auxiliary.add(info.resolvedFile);
      }
      return match;
    });
  }
  return { code: out, auxiliary: [...auxiliary] };
}

/**
 * 读取一个 demo 的完整源码组：主 .vue + 全部辅助模块。
 * 返回 SourceFile[]（展示用源码已完成 import 改写）。
 */
export function collectDemoSources(demoVuePath) {
  const dir = nodePath.dirname(demoVuePath);
  const raw = fs.readFileSync(demoVuePath, 'utf8');
  const { code, auxiliary } = transformImports(raw, dir);
  const sources = [
    {
      path: nodePath.basename(demoVuePath),
      label: nodePath.basename(demoVuePath),
      code,
      lang: 'vue',
      main: true,
    },
  ];
  const seen = new Set([nodePath.resolve(demoVuePath)]);
  const queue = [...auxiliary];
  while (queue.length > 0) {
    const file = queue.shift();
    const abs = nodePath.resolve(file);
    if (seen.has(abs) || !fs.existsSync(abs)) continue;
    seen.add(abs);
    const text = fs.readFileSync(abs, 'utf8');
    const { code: transformed, auxiliary: next } = transformImports(text, nodePath.dirname(abs));
    queue.push(...next);
    const ext = nodePath.extname(abs);
    sources.push({
      path: nodePath.relative(dir, abs),
      label: nodePath.relative(dir, abs),
      code: transformed,
      lang: ext === '.ts' ? 'ts' : ext === '.css' ? 'css' : ext === '.vue' ? 'vue' : 'text',
      main: false,
    });
  }
  return sources;
}
