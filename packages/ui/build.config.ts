import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineBuildConfig } from 'unbuild';

/**
 * `@apollo-design/ui` 的构建配置。
 *
 * 与 foundation 包的差别只有一个：**这里含 `.vue` SFC**，而 unbuild 默认的
 * rollup 管线不认识 SFC。因此本文件要解决三件 foundation 包不需要解决的事。
 *
 * ── 1. SFC 编译：往 rollup 的插件表里塞 `@vitejs/plugin-vue` ──────────────────
 *
 * unbuild 没有开放「任意插件」入口，但提供了 `rollup:options` 钩子 ——
 * 拿到的是即将交给 rollup 的 options 对象，直接 push 即可。
 *
 * ⚠️ 实测确认过这条路能走通（`@vitejs/plugin-vue` 6 在纯 rollup 下可用），
 *    但**只走通了 JS**：见下一条。
 *
 * ── 2. 类型产物：关掉 unbuild 的 declaration，改跑 vue-tsc ────────────────────
 *
 * unbuild 的 dts 走 `rollup-plugin-dts`，它只认 TS，**不认识 `.vue`**。
 * 实测的失败方式很危险：它**不报错**，而是把编译后的 JS 当成 `.d.ts` 写进
 * `dist/index.d.ts`（内容是 `defineComponent({...})` 而不是类型声明）。
 * `tests/build/run.mjs` 的 B2 只校验路径存在，所以这种产物能一路绿灯地发出去。
 *
 * 所以这里 `declaration: false` 显式关掉它，由 `build:done` 调 `vue-tsc` 出真声明。
 * `packages/ui/tsconfig.json` 本来就配好了 `emitDeclarationOnly` + `outDir: ./dist`
 * —— 这是仓库原本就打算走的路径，只是之前没接上。
 *
 * `--rootDir src` 是为了让产物落在 `dist/index.d.ts` 而不是 `dist/src/index.d.ts`
 * （tsconfig 的 `rootDir` 是 `.`，因为它的 `paths` 指向 `../utils/src` 等同级包）。
 * 实测该覆盖不会触发 TS6059（paths 命中的文件只参与类型解析，不参与 emit）。
 *
 * ── 3. CSS 产物（裁决 `ui-style-output` = A）─────────────────────────────────
 *
 * 从**刚产出的** `dist/index.mjs` 里 import 样式清单，落成：
 *   - `dist/<component>/style.css` —— 按需引入
 *   - `dist/index.css`            —— 汇总
 *
 * 从产物 import 而不是从 src：与 `packages/theme/build.config.ts` 同一套路，
 * 顺带验证了「产物能被真实 import」—— 产物坏了这里会直接炸。
 *
 * ⚠️ 顺序不能反：CSS 必须在 JS 构建**之后**生成，否则 import 的还是上一轮的产物。
 *    `build:done` 天然满足这个顺序。
 */

/** 仓库根下的可执行文件。unbuild 用 jiti 加载本文件，`import.meta.dirname` 是包目录。 */
const pkgDir = import.meta.dirname ?? '.';
const bin = (name: string): string => resolve(pkgDir, '../../node_modules/.bin', name);

export default defineBuildConfig({
  // 见上「2. 类型产物」。这不是省事，是**避开一个会静默产出错误产物的默认行为**。
  declaration: false,

  /**
   * 关掉「有 warning 就退出码 1」。
   *
   * ⚠️ 这不是为了「让构建变绿」而放宽标准 —— 这里是 unbuild 的一个**构造性误报**：
   *    它在 build:prepare 阶段校验「package.json 里声明的文件是否都存在」，
   *    而 `types: ./dist/index.d.ts` 恰恰是由我们自己的 `build:done` 钩子生成的，
   *    在那个时刻还不存在。unbuild 无法知道这件事，于是每次都报
   *    `Potential missing package.json files: dist/index.d.ts`。
   *
   * 代价被下面 `build:done` 末尾的断言补上了：它会真的去读 `dist/index.d.ts`，
   * 校验存在且**内容是类型声明而不是编译后的 JS** —— 那正是关掉 unbuild dts 的原因。
   * 换句话说：这里关掉的是一个误报，换回来的是一个更准的检查。
   */
  failOnWarn: false,

  hooks: {
    /** 见上「1. SFC 编译」。 */
    'rollup:options'(_ctx, options) {
      // ⚠️ 这里必须断言一次。`@vitejs/plugin-vue` 返回的是 **Vite 8 的 `Plugin`**
      //    （内部走 rolldown 的类型），而 unbuild 的 rollup 插件表是 **rollup 的 `Plugin`**。
      //    两者在 `augmentChunkHash` 的 `this` 类型上结构性不兼容（`PluginContext`
      //    有没有 `environment` 字段的区别）。
      //
      //    运行期没有这个问题：两个生态的插件接口在实际用到的那几个钩子上是一致的，
      //    实测构建可跑通（JS 产物、SFC 编译、样式全部正常）。
      //    断言的目标是**精确的**插件表元素类型，不是 `any` —— 所以它不掩盖别的类型错误。
      options.plugins.push(vue() as unknown as (typeof options.plugins)[number]);
    },

    /** 见上「2」「3」。 */
    'build:done': async () => {
      // ---- 类型：vue-tsc ----
      //
      // 三个参数每一个都是必需的，理由如下（这是本文件最容易改坏的地方）：
      //
      // `--outDir .dts-tmp`
      //   不直接写 dist：下面的 `--rootDir` 会把产物按「仓库根」的相对路径铺开，
      //   所以先落到临时目录，再把 ui 那一棵子树搬进 dist。
      //
      // `--rootDir ../..`（= 仓库根）
      //   tsconfig 的 `paths` 指向 `../utils/src` 等同级包，那些 `.ts` 文件会进 program。
      //   若 `rootDir` 是包目录，TS 报 TS6059（兄弟包的文件不在 rootDir 下）；
      //   若用 `--rootDir src` 也一样报。只有把 rootDir 提到这些文件的公共祖先（仓库根）
      //   才不报错。代价是兄弟包的声明也被 emit 一遍 —— 我们不复制它们，只是白算。
      //
      //   替代方案「让 paths 指向兄弟包的 dist 类型」被否决：那样 ui 的类型产物就依赖
      //   兄弟包的**构建顺序**（`tests/build/run.mjs` 是按目录名排序跑的，ui 排在 utils
      //   前面），会把「构建产物是否正确」变成「构建顺序是否正确」。
      //
      // 结果：`.dts-tmp/packages/ui/src/**` → `dist/**`，
      //      得到 `dist/index.d.ts` + `dist/<component>/<X>.vue.d.ts`，
      //      与 `package.json` 的 `types: ./dist/index.d.ts` 一致。
      const tmp = resolve(pkgDir, '.dts-tmp');
      rmSync(tmp, { recursive: true, force: true });
      execFileSync(
        bin('vue-tsc'),
        ['-p', 'tsconfig.json', '--outDir', tmp, '--rootDir', resolve(pkgDir, '../..')],
        { cwd: pkgDir, stdio: 'inherit' },
      );
      cpSync(resolve(tmp, 'packages/ui/src'), resolve(pkgDir, 'dist'), {
        recursive: true,
      });
      rmSync(tmp, { recursive: true, force: true });

      // ---- 断言：类型产物真的是类型 ----
      //
      // 这条断言针对的是「关掉 unbuild dts」那个决定的反面风险：万一哪天有人把
      // `declaration` 打开，rollup-plugin-dts 会把编译后的 JS 当成 .d.ts 写出去，
      // 而 B2 只校验路径存在 —— 于是错误产物能一路绿灯发出去。
      // 判据取「含 `declare` 或 `export type` / `export interface`」这类只在声明里出现的形态；
      // 编译后的 JS 不会有它们（它只有 `defineComponent({...})`）。
      const dts = readFileSync(resolve(pkgDir, 'dist/index.d.ts'), 'utf8');
      if (!/\b(declare|export type|export interface|export \{)/.test(dts)) {
        throw new Error(
          '[ui build] dist/index.d.ts 看起来不是类型声明（缺 declare / export type / export interface）。' +
            '这通常意味着 unbuild 的 declaration 被重新打开了 —— rollup-plugin-dts 不认识 .vue，' +
            '会把编译后的 JS 当成 .d.ts 写出去。见 build.config.ts 顶部注释「2」。',
        );
      }
      process.stdout.write('  ✔ 已生成 dist/index.d.ts（vue-tsc，含 SFC 声明）\n');

      // ---- CSS：从产物取样式清单 ----
      //
      // ⚠️ 这个 import 刻意写成**非字面量**，不是笔误。
      //
      // `./dist/index.mjs` 是本次构建刚产出的文件：它没有 `.d.mts` 伴生声明
      // （vue-tsc 只 emit `.d.ts`），而且 `dist/` 被 tsconfig 排除 ——
      // 写死字面量会让 `lint:types` 报 TS7016「隐式 any」，
      // 而那正是**没跑构建时**才出现、跑过构建就消失的那种"看运气"的错误。
      //
      // 非字面量的动态 import 在类型层是 `any`，于是断言成**源码模块**的类型：
      // 「产物导出的形状与源码一致」。这是有内容的断言 —— 产物少导出/改名会在
      // 这一步炸，而不是把 `undefined is not a function` 留到运行期。
      const distEntry = './dist/index.mjs';
      const { genAllStyles, genComponentStyleMap, STATIC_PREFIX_CLS } = (await import(
        distEntry
      )) as typeof import('./src/style/index.ts');

      const map: Record<string, string> = genComponentStyleMap();
      for (const [name, css] of Object.entries(map)) {
        const file = resolve(pkgDir, 'dist', name, 'style.css');
        mkdirSync(resolve(file, '..'), { recursive: true });
        writeFileSync(file, css, 'utf8');
      }

      writeFileSync(resolve(pkgDir, 'dist/index.css'), genAllStyles(), 'utf8');

      process.stdout.write(
        `  ✔ 已生成 ${Object.keys(map).length} 份组件 CSS + dist/index.css` +
          `（前缀 ${STATIC_PREFIX_CLS.join(' / ')}）\n`,
      );
    },
  },
});
