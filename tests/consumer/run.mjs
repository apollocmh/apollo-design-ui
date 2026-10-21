/**
 * 真实 Vite 消费端验证 —— **tarball 分发**（2026-10-21 审计 A11）。
 *
 * 背景：本仓暂不发布 npm，而是把构建产物打成 `.tgz` 分享。这个脚本模拟用户：
 *   1. 对 13 个 foundation 包 + ui 执行 `pnpm pack`；
 *   2. 在临时目录创建独立 Vite 工程，用 `file:` tarball + pnpm-workspace
 *      overrides 安装全部 @apollo-design/*（**不使用 workspace 链接**）；
 *   3. 分别用 `vite build` 与 `webpack build` 打包同一入口，检查：
 *      - 根入口 / 深入口 / 样式入口都能解析；
 *      - `.apollo-btn` / `.apollo-input-search` / `.apollo-otp` 真的进了 CSS
 *        （防 `sideEffects` 把样式摇掉）；
 *      - 产物没有 `@ant-design/*` / `@rc-component/*` 运行时引用。
 *
 * 用法：`node tests/consumer/run.mjs`（建议先完成 `node tests/build/run.mjs`）。
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const PNPM = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

const PACKAGES = [
  'utils',
  'theme',
  'icons',
  'motion',
  'portal',
  'position',
  'a11y',
  'virtual-list',
  'overlay',
  'form-core',
  'picker',
  'locale',
  'ui',
];

function run(command, args, cwd) {
  execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      CI: '1',
      COREPACK_ENABLE_DOWNLOAD_PROMPT: '0',
    },
  });
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-consumer-'));
const tarballs = path.join(tmp, 'tarballs');
const consumer = path.join(tmp, 'vite-app');
fs.mkdirSync(tarballs, { recursive: true });
fs.mkdirSync(consumer, { recursive: true });

try {
  console.log(`[consumer] temp dir: ${tmp}`);

  for (const name of PACKAGES) {
    console.log(`[consumer] pack @apollo-design/${name}`);
    run(PNPM, ['--filter', `@apollo-design/${name}`, 'pack', '--pack-destination', tarballs], ROOT);
  }

  // 直接依赖全部 tarball：pnpm 12 不再读取 package.json 的 `pnpm.overrides`
  // （迁移到 pnpm-workspace.yaml），而 tarball 内的依赖版本是 0.0.0。
  // 把 13 个包都列为直接 file: 依赖，解析器就能就地满足这些 0.0.0 约束。
  const dependencies = Object.fromEntries(
    PACKAGES.map((name) => [
      `@apollo-design/${name}`,
      `file:../tarballs/apollo-design-${name}-0.0.0.tgz`,
    ]),
  );
  dependencies.vue = '^3.5.42';

  write(
    path.join(consumer, 'package.json'),
    JSON.stringify(
      {
        name: 'apollo-tarball-consumer',
        private: true,
        type: 'module',
        scripts: { build: 'vite build' },
        dependencies,
        devDependencies: {
          '@vitejs/plugin-vue': '^6.0.0',
          vite: '^8.0.0',
          webpack: '^5.0.0',
          'webpack-cli': '^6.0.0',
          'css-loader': '^7.0.0',
          'style-loader': '^4.0.0',
        },
      },
      null,
      2,
    ),
  );

  // pnpm 12 的 overrides 只读 pnpm-workspace.yaml（package.json 的 pnpm 字段被忽略）。
  // 必须把 tarball 内的 0.0.0 依赖重定向到本地 tgz，否则 pnpm 会去 registry 找
  // 一个尚未发布的包并 404。
  write(
    path.join(consumer, 'pnpm-workspace.yaml'),
    [
      'packages:',
      "  - '.'",
      'overrides:',
      ...PACKAGES.map(
        (name) => `  '@apollo-design/${name}': 'file:../tarballs/apollo-design-${name}-0.0.0.tgz'`,
      ),
      '',
    ].join('\n'),
  );

  write(
    path.join(consumer, 'vite.config.mjs'),
    `import vue from '@vitejs/plugin-vue';

export default {
  plugins: [vue()],
  build: { minify: true },
};
`,
  );

  write(
    path.join(consumer, 'index.html'),
    '<!doctype html><html><body><div id="app"></div><script type="module" src="/src/main.js"></script></body></html>',
  );

  const ENTRY = `import { createApp, h } from 'vue';
import { Button, InputSearch, InputOTP } from '@apollo-design/ui';
import '@apollo-design/ui/style.css';
import '@apollo-design/ui/button/style.css';
import '@apollo-design/theme/tokens.css';

createApp({
  render: () =>
    h('div', [
      h(Button, { type: 'primary' }, () => 'Button'),
      h(InputSearch, { enterButton: true, placeholder: 'search' }),
      h(InputOTP, { length: 6 }),
    ]),
}).mount('#app');
`;

  write(path.join(consumer, 'src/main.js'), ENTRY);

  // Webpack 消费端：同一入口，验证 tarball 产物在非 Vite 打包器里也能解析。
  // `import.meta.env?.DEV` 在 Webpack 下是 undefined（可选链安全），但若
  // Webpack 解析 import.meta 报错，用 ProvidePlugin/DefinePlugin 兜底。
  write(path.join(consumer, 'src/webpack.js'), ENTRY);

  write(
    path.join(consumer, 'webpack.config.mjs'),
    `import path from 'node:path';
import webpack from 'webpack';

export default {
  mode: 'production',
  entry: './src/webpack.js',
  output: {
    path: path.resolve('dist-webpack'),
    filename: 'main.js',
    clean: true,
  },
  module: {
    rules: [{ test: /\\.css$/i, use: ['style-loader', 'css-loader'] }],
  },
  resolve: { extensions: ['.js', '.mjs'] },
  plugins: [
    new webpack.DefinePlugin({
      'import.meta.env': JSON.stringify({ DEV: false, PROD: true, MODE: 'production' }),
    }),
  ],
  stats: 'errors-warnings',
  performance: { hints: false },
};
`,
  );

  console.log('[consumer] pnpm install (tarball overrides, no workspace links)');
  run(PNPM, ['install', '--prefer-offline'], consumer);

  console.log('[consumer] vite build');
  run(PNPM, ['exec', 'vite', 'build'], consumer);

  console.log('[consumer] webpack build');
  run(PNPM, ['exec', 'webpack', '--config', 'webpack.config.mjs'], consumer);

  const dist = path.join(consumer, 'dist');
  const assets = fs.readdirSync(path.join(dist, 'assets'));
  const css = assets
    .filter((f) => f.endsWith('.css'))
    .map((f) => fs.readFileSync(path.join(dist, 'assets', f), 'utf8'))
    .join('\n');
  const js = assets
    .filter((f) => f.endsWith('.js'))
    .map((f) => fs.readFileSync(path.join(dist, 'assets', f), 'utf8'))
    .join('\n');

  const webpackJs = fs.readFileSync(path.join(consumer, 'dist-webpack', 'main.js'), 'utf8');

  const checks = [
    ['index.html', fs.existsSync(path.join(dist, 'index.html'))],
    ['.apollo-btn 进入 CSS（Vite）', css.includes('.apollo-btn')],
    ['.apollo-input-search 进入 CSS（Vite）', css.includes('.apollo-input-search')],
    ['.apollo-otp 进入 CSS（Vite）', css.includes('.apollo-otp')],
    ['无 @ant-design/* 运行时引用（Vite）', !js.includes('@ant-design/')],
    ['无 @rc-component/* 运行时引用（Vite）', !js.includes('@rc-component/')],
    ['无 react 运行时引用（Vite）', !/(?:from|import\()\s*["']react(?:-dom)?["']/.test(js)],
    ['.apollo-btn 进入产物（Webpack）', webpackJs.includes('.apollo-btn')],
    ['.apollo-input-search 进入产物（Webpack）', webpackJs.includes('.apollo-input-search')],
    ['.apollo-otp 进入产物（Webpack）', webpackJs.includes('.apollo-otp')],
    ['无 @ant-design/* 运行时引用（Webpack）', !webpackJs.includes('@ant-design/')],
    ['无 @rc-component/* 运行时引用（Webpack）', !webpackJs.includes('@rc-component/')],
    [
      '无 react 运行时引用（Webpack）',
      !/(?:from|import\()\s*["']react(?:-dom)?["']/.test(webpackJs),
    ],
  ];

  let failed = false;
  for (const [label, ok] of checks) {
    console.log(`${ok ? '✅' : '❌'} ${label}`);
    if (!ok) failed = true;
  }
  if (failed) process.exitCode = 1;
  else {
    console.log('[consumer] PASS（tarball + Vite/Webpack 消费端）');
    fs.rmSync(tmp, { recursive: true, force: true });
  }
} catch (error) {
  console.error('[consumer] FAIL:', error?.message ?? error);
  console.error(`[consumer] 临时目录保留以便排查：${tmp}`);
  process.exitCode = 1;
}
