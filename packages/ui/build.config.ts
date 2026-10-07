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

      // ---- A：保留模块结构（裁决 `ui-tree-shaking` 的 A 项，2026-10-07）----
      //
      // 🚨 单文件产物下，消费方打包器只能**整模块**丢弃。实测（2026-10-07）：
      //    `@apollo-design/ui` 引**任意一个**组件都要 **1272.9 KB = 全量的 63%**，
      //    且「引 Button」与「引 Empty」字节数**完全相同** ⇒ 「按需引入」事实上不存在。
      //    判据（同一次实测）：`import '@apollo-design/ui'`（裸副作用）⇒ **0 KB**，
      //    `import { X }` 只 re-export 不使用 ⇒ **0 KB** —— 说明包元数据与摇树机制都正常，
      //    限制因素**只是**「整个库是一个模块」。
      //
      // 打开后：`dist/index.mjs` 降级为 re-export barrel，每个源模块各出一个文件。
      // 公开入口不变（`exports["."]` 仍指 `dist/index.mjs`）。
      //
      // ⚠️ 与 `dist/<component>/*.d.ts` 的关系：vue-tsc 本来就按源结构 emit 声明
      //    （见下面「2. 类型产物」），所以这一步只是让 **JS 布局与已有的类型布局对齐**。
      const srcDir = resolve(pkgDir, 'src');

      // ⚠️ 参数类型**必须**是 `OutputOptions` 本身，不能写成 `Record<string, unknown>`。
      //    2026-10-07 修：原实现用 `Record<string, unknown>`，`options.output.map(withPreserveModules)`
      //    直接报 TS2345 —— `OutputOptions` 没有 string 索引签名，赋不进 `Record<string, unknown>`。
      //    ⚠️ 这个错误**只有 `pnpm run test:types` 抓得到**：`vue-tsc --noEmit` 不看 build.config.ts，
      //    而 vitest 的 `types` project 会把它当源文件收进去（实测报在
      //    `packages/ui/build.config.ts:106:45`，且它算 **unhandled error** ⇒ 测试全绿但 exit=1）。
      //    这里从 `options.output` 反推元素类型，避免依赖 rollup 能否被本包直接解析（pnpm 严格布局）。
      //    ⚠️ 必须**显式分发**：直接写 `NonNullable<X> extends Array<infer U> ? U : X` 是错的 ——
      //       `NonNullable<X>` 不是裸类型参数、不分发，`OutputOptions | OutputOptions[]` 整体
      //       判为「不可赋给 Array」⇒ 走 false 分支 ⇒ OutputOption 仍是那个联合 ⇒
      //       `.map()` 产出 `(OutputOptions | OutputOptions[])[]` 又报错（实测 2026-10-07）。
      type ElementOf<T> = T extends Array<infer U> ? U : T;
      type OutputOption = ElementOf<NonNullable<typeof options.output>>;
      const withPreserveModules = (output: OutputOption): OutputOption => ({
        ...output,
        preserveModules: true,
        preserveModulesRoot: srcDir,
      });
      if (Array.isArray(options.output)) {
        options.output = options.output.map(withPreserveModules);
      } else if (options.output) {
        options.output = withPreserveModules(options.output);
      }
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
