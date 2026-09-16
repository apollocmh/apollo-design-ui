import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

/**
 * Vitest 多 project 配置。
 *
 * 对应 TESTING.md 的七层测试架构：
 *   unit          L1 Unit + L2 Interaction（组件与包的行为测试）
 *   dom-contract  L4 DOM 契约（与 React 基线比对）
 *   a11y          L5 无障碍（axe 自动扫描 + 键盘断言）
 *   types         L3 类型测试（*.test-d.ts）
 *   theme         L1/L2 的主题矩阵（light / dark / compact / token-override）
 *
 * 不在本文件的：
 *   L6 Visual Regression → tests/visual/run.mjs（Playwright，需要真实浏览器）
 *   L7 Build Test        → tests/build/run.mjs（node 脚本，校验产物）
 *
 * 为什么要拆 project 而不是一个大 suite：
 *   不同层的失败含义完全不同。DOM 契约失败说明结构漂移，a11y 失败说明可达性退化，
 *   类型失败说明 API 面变了。分开跑能让 CI 报告直接指向问题性质，也让本地开发可以只跑关心的层。
 */

const r = (p: string) => resolve(__dirname, p);

const alias = {
  '@apollo-design/utils': r('packages/utils/src'),
  '@apollo-design/theme': r('packages/theme/src'),
  '@apollo-design/icons': r('packages/icons/src'),
  '@apollo-design/motion': r('packages/motion/src'),
  '@apollo-design/portal': r('packages/portal/src'),
  '@apollo-design/position': r('packages/position/src'),
  '@apollo-design/overlay': r('packages/overlay/src'),
  '@apollo-design/a11y': r('packages/a11y/src'),
  '@apollo-design/virtual-list': r('packages/virtual-list/src'),
  '@apollo-design/form-core': r('packages/form-core/src'),
  '@apollo-design/picker': r('packages/picker/src'),
  '@apollo-design/locale': r('packages/locale/src'),
  '@apollo-design/test-utils': r('packages/test-utils/src'),
  '@apollo-design/ui': r('packages/ui/src'),
};

const shared = {
  plugins: [vue()],
  resolve: { alias },
  test: {
    globals: true,
    environment: 'jsdom',
    // 确定性要求（TESTING.md T5/T6）：
    //   - 禁用动画，避免等待动画结束的不确定时序
    //   - 固定时区与 locale，避免日期断言漂移
    //   - 固定 DPR，避免视觉相关的计算差异
    env: {
      TZ: 'UTC',
      LANG: 'en_US.UTF-8',
      APOLLO_MOTION: 'false',
    },
    setupFiles: [r('vitest.setup.ts')],
    environmentOptions: {
      jsdom: { url: 'http://localhost' },
    },
    pool: 'threads',
    server: {
      deps: {
        inline: [/@ant-design/, /@vueuse/],
      },
    },
  },
};

export default defineConfig({
  ...shared,
  test: {
    ...shared.test,
    // ⚠️ Vitest 5 起，内联 project 默认**继承**声明它的配置文件（plugins / resolve / env 等）。
    //    所以每个 project 只写自己**不同**的部分，不要重复展开 `shared`，
    //    否则 `vite:vue` 插件会被应用多次（Vitest 会告警，且可能造成重复转换）。
    projects: [
      {
        test: {
          name: 'unit',
          include: [
            'packages/*/src/**/__tests__/**/*.test.ts',
            'packages/*/src/**/__tests__/**/*.test.tsx',
            'packages/*/tests/**/*.test.ts',
          ],
          // 这些由专门的 project 负责
          exclude: [
            '**/node_modules/**',
            '**/*.test-d.ts',
            '**/a11y.test.ts',
            '**/semantic.test.ts',
            '**/theme.test.ts',
          ],
        },
      },
      {
        test: {
          name: 'dom-contract',
          include: ['packages/*/src/**/__tests__/semantic.test.ts'],
        },
      },
      {
        test: {
          name: 'a11y',
          include: ['packages/*/src/**/__tests__/a11y.test.ts'],
        },
      },
      {
        test: {
          name: 'theme',
          include: ['packages/*/src/**/__tests__/theme.test.ts'],
        },
      },
      // ⚠️ 注意：a11y 与 theme 两层在第一个组件（packages/ui/src/<component>）落地前
      //    没有任何匹配文件，而 vitest 把「零匹配」当失败 —— 会让 `pnpm test` 从第一天起
      //    就是红的。那不是「测试失败」，而是「还没有可测的组件」。
      //    因此 package.json 的 test:a11y / test:theme 带了 --passWithNoTests。
      //    passWithNoTests 是**根级**选项，写进上面的 project 配置不生效（已实测）。
      //    一旦有组件接入这两层测试，应当把该标志删掉，让它们恢复为硬门禁。
      {
        test: {
          name: 'types',
          include: ['packages/*/src/**/__tests__/*.test-d.ts'],
          typecheck: {
            enabled: true,
            include: ['packages/*/src/**/__tests__/*.test-d.ts'],
            // 类型测试必须包含负例（TESTING.md T7）：
            // 负例通过 @ts-expect-error 断言「此处应当报错」。
            // 若 TS 不再报错，@ts-expect-error 本身会变成错误 —— 这是允许使用它的唯一场景。
            ignoreSourceErrors: false,
          },
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      // 覆盖率下限（TESTING.md §11）
      thresholds: {
        // foundation 包要求更高。
        // 注意：icons 与 locale 是**生成产物**（分别来自 icons-svg 与 antd locale 源），
        // 对它们要求行覆盖率没有意义，因此不在本档位内。
        'packages/{utils,theme,motion,portal,position,overlay,a11y,virtual-list,form-core,picker}/src/**':
          {
            statements: 95,
            branches: 90,
            functions: 95,
          },
        'packages/ui/src/**': {
          statements: 90,
          branches: 85,
          functions: 90,
        },
      },
      exclude: [
        '**/__tests__/**',
        '**/demo/**',
        '**/*.test-d.ts',
        '**/dist/**',
        '**/node_modules/**',

        // ⚠️ 生成产物目录 —— 必须在**采集层**排除，不能只靠上面 thresholds 不列它。
        //
        // 背景（2026-09-16 实测）：`ARCHITECTURE.md` §7 写的是「`icons` 与 `locale` 是
        // 生成物，豁免覆盖率要求」，上面 thresholds 也刻意没有列 `icons`。但那只关掉了
        // **阈值校验**，没有关掉**采集**：`coverage.all` 默认为 true，vitest 会把
        // `packages/icons/src/icons/` 下 849 个生成模块全部插桩并计入报告。
        //
        // 后果有两条，都不是小事：
        //   1. `registry/tools/foundation-status.mjs --verify` 的 `coverageFor('icons')`
        //      是按 `packages/icons/src/` 前缀聚合的，于是**生成文件被算进 icons 的
        //      覆盖率**，把 functions 从手写代码的 100% 拉到 91.18%，`met` 永远为 false
        //      —— 文档说豁免、工具说不达标，两者直接矛盾，且谁都无法靠补测试解决。
        //   2. 849 个模块的插桩是本仓库覆盖率内存占用的绝对主项。实测同一台机器上
        //      `--coverage` 反复被 SIGKILL（exit 137），而不带 `--coverage` 时
        //      icons 的 95 个用例稳定通过。排除后覆盖率跑得又快又稳。
        //
        // 为什么这是**收紧**而不是放宽（H8）：
        //   排除的是**生成的数据模块**，不是手写逻辑。`packages/icons/src/*.ts`
        //   这 9 个手写文件仍然按 95 / 90 / 95 的 foundation 档位要求，一个都不少。
        //   生成物本身由另外两条更强的机制保证：
        //     - `registry/tools/gen-icons.mjs --check`：幂等 + 848 个图标与
        //       `@ant-design/icons-svg` 逐一对齐
        //     - L4 DOM 契约：848 个图标全部与 React 基线逐属性比对
        //   即：生成物靠「与上游逐位一致」保证，手写代码靠覆盖率保证。
        'packages/icons/src/icons/**',
      ],
    },
  },
});
