import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

/**
 * 文档站自有测试配置（与仓库根 vitest.config.ts 的 projects 无关）。
 *
 * 根配置里 unit project 的 include 也匹配本目录的用例，因此根 `pnpm test`
 * 同样会跑到这里 —— 两边环境一致（jsdom + vue 插件 + @apollo-design 别名），
 * 所以同一份用例在两处都能跑。
 *
 * 与仓库根的两点不同，都是**收紧**而非放宽：
 *   - 不 mock `@apollo-design/motion`：文档站要验证的是「示例能真实渲染」，
 *     关闭动效反而会掩盖示例自身的问题。
 *   - 不注册 ResizeObserver/MutationObserver 单例桩：那是组件库的契约测试设施，
 *     文档站关心的是「示例在这里跑起来了」，不需要复现组件库那套可观测契约。
 */
const r = (p: string) => resolve(import.meta.dirname, p);

export default defineConfig({
  // `includeAbsolute: false`：`/logo.svg` 是 public 绝对路径，不需要被编译成
  // 资源 import。Windows 上把它转成 `file:///logo.svg` 后 `fileURLToPath`
  // 会因缺少盘符直接抛错（macOS/Linux 不会）⇒ 测试在 Windows 上整片加载失败。
  plugins: [vue({ template: { transformAssetUrls: { includeAbsolute: false } } })],
  resolve: {
    alias: {
      '@apollo-design/utils': r('../utils/src'),
      '@apollo-design/theme': r('../theme/src'),
      '@apollo-design/icons': r('../icons/src'),
      '@apollo-design/motion': r('../motion/src'),
      '@apollo-design/portal': r('../portal/src'),
      '@apollo-design/position': r('../position/src'),
      '@apollo-design/overlay': r('../overlay/src'),
      '@apollo-design/a11y': r('../a11y/src'),
      '@apollo-design/virtual-list': r('../virtual-list/src'),
      '@apollo-design/form-core': r('../form-core/src'),
      '@apollo-design/picker': r('../picker/src'),
      '@apollo-design/locale': r('../locale/src'),
      '@apollo-design/ui': r('../ui/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    setupFiles: [r('tests/setup.ts')],
    environmentOptions: {
      jsdom: { url: 'http://localhost/apollo-design-ui/' },
    },
    env: {
      TZ: 'UTC',
      LANG: 'en_US.UTF-8',
    },
    // 内容管线要读 742 个 demo + 72 篇文档，单文件超时给足
    testTimeout: 30000,
    pool: 'threads',
  },
});
