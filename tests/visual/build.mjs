/**
 * build.mjs — 用 vite 把两侧渲染入口打成静态 bundle。
 *
 * 为什么需要打包这一步：React 侧要 `import 'antd'`（cssinjs 运行时 + JSX），
 * Vue 侧要 `@apollo-design/ui` 的 dist 与 CSS —— 两者都得经过一次 bundler 才能在浏览器里跑。
 *
 * 两侧**不需要** `@vitejs/plugin-vue`：Vue 侧用例用 `h()` 写，不编译 SFC；
 * `@apollo-design/ui` 走的是已构建好的 `dist/index.mjs`。
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'vite';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RENDER_DIR = path.join(HERE, 'render');

/**
 * 打包一侧。
 * @param {'react'|'vue'} side
 * @param {string} outDir 绝对路径
 */
export async function buildSide(side, outDir) {
  const entry = side === 'react' ? 'react.html' : 'vue.html';

  const result = await build({
    root: RENDER_DIR,
    configFile: false,
    logLevel: 'warn',
    // 必须是相对 base：产物放在 `.artifacts/<side>/` 子目录下由静态服务器 serve，
    // 绝对路径 `/assets/x.js` 会被解析到服务器根，直接 404。
    base: './',
    // React 侧用 JSX automatic runtime（React 19 不再需要手写 import React）
    esbuild: side === 'react' ? { jsx: 'automatic' } : undefined,
    build: {
      outDir,
      emptyOutDir: true,
      // 产物是测试中间物，不需要 sourcemap 与压缩（压缩会让报错难读）
      minify: false,
      sourcemap: false,
      rollupOptions: { input: entry },
      // antd 6 体积不小，调高告警阈值避免刷屏
      chunkSizeWarningLimit: 4096,
    },
  });

  return result;
}

/** 打包两侧。 */
export async function buildAll(outRoot) {
  const out = {
    react: path.join(outRoot, 'react'),
    vue: path.join(outRoot, 'vue'),
  };
  await buildSide('react', out.react);
  await buildSide('vue', out.vue);
  return out;
}
