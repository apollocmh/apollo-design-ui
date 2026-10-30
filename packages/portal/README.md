> 规范范围：本文件保留实现说明与历史对照证据；上游同构、旧阶段与历史 Gate 要求不再生效。现行规则见 [项目规范](../../AGENTS.md)，公共行为以 Apollo 组件 API 文档与测试契约为准。

# @apollo-design/portal

> **层**：L1 ｜ **风险**：medium
>
> 本文档声明本包的**职责边界**。边界之外的事情不做 —— 如果发现需要做，说明架构需要调整，
> 应当先修改 `ARCHITECTURE.md` 并记录 ADR。

---

## 职责

基于 Vue Teleport 的挂载与层级管理。替代 @rc-component/portal 及 rc-dialog 的挂载部分。

## 替代的 Ant Design 依赖

- `@rc-component/portal`
- `@rc-component/dialog（挂载部分）`

## 公开 API

- Portal 组件（Teleport 封装，支持 SSR 安全延迟挂载）
- 容器管理：`resolveContainer` / `usePortalContainer` / `usePortalOrder` / `PORTAL_ORDER_KEY`
- 层级：`computeZIndex` / `shouldWarnZIndex` / `useZIndex` / `ZINDEX_KEY` 及偏移常量
- 队列纯函数：`enqueueAppend` / `flushAppendQueue`；测试开关：`portalInlineMock` / `resetPortalInlineMock`
- **全局副作用**（2026-09-26 为 drawer 补入，modal 同用）：
  - `useScrollLocker(lock)` + Portal 的 `autoLock` prop —— 锁 `html body` 滚动，
    body 溢出且实测滚动条宽度大于0时补 `width: calc(100% - Npx)`，覆盖式滚动条不改宽度；
  - `useEscKeyDown(open, onEsc)` + Portal 的 `onEsc` prop —— ESC **层栈**，
    回调拿到 `{ top, event }`（`top` = 自己是不是最上层），带 IME 保护
    （`compositionend` 后 200ms 内的 ESC 忽略）。
  Portal副作用跟随实际容器的ownerDocument/defaultView；iframe相互隔离，ShadowRoot使用其所属文档，inline使用Teleport源锚点。稳定resolver、原生容器或源节点搬迁后迁移锁与监听；关闭/卸载释放。Escape保留子控件preventDefault优先，分发时固定原始top，不因关闭顶层而在同一事件提升下一层。独立composable仍默认当前全局文档/窗口，公开签名保持不变。

  ```vue
  <script setup lang="ts">
  import { Portal } from '@apollo-design/portal';
  import { ref } from 'vue';
  const opened = ref(true);
  const frame = ref<HTMLIFrameElement>();
  </script>
  <template>
    <iframe ref="frame" title="Preview document" />
    <Portal :open="opened" :auto-lock="true"
      :get-container="() => frame?.contentDocument?.body"
      :on-esc="({ top }) => { if (top) opened = false; }">
      <input aria-label="Frame draft" />
    </Portal>
  </template>
  ```

  生产包浏览器验证：`node tests/browser/portal-owner.mjs`（真实iframe、开/闭ShadowRoot、原生滚轮、搬迁、IME、窗口层栈、重开和卸载）。这不代表焦点陷阱或Image整体已验收。

## 当前销毁策略与搬迁焦点

Portal 的 autoDestroy 随 prop 更新；usePortalContainer 的对应选项支持 Vue getter/ref。关闭后切换销毁策略会按当前值处理已挂载内容。

反复切换容器时，本包保持自身编辑器的节点、草稿、选择和焦点，尊重已选外部焦点、非活动文档和普通更新中的主动 blur。具体边界与复现见 [Avatar关联审计](../../docs/audit/2026-10-27-avatar-contract-audit.md)；通用焦点陷阱与对话框层级管理仍在 utils/a11y。

默认容器即使被原生 DOM 操作搬入 ShadowRoot，关闭或卸载仍移除自身容器；重开复用该容器。显式外部容器由调用者拥有，Portal 只清理自己的内容与副作用。

## 视觉层级与数值上下文

`useZIndex` 保留 `ComputedRef<number | undefined>` 返回值和 `ZINDEX_KEY` 的 `ComputedRef<number>` 契约。顶层组件未显式指定时，返回 `undefined` 以使用其 CSS；拥有独立视觉 Token 的 consumer 应把当前 Token 作为顶层 `customZIndex`，嵌套时交给父层级加自身 offset。`zIndexPopupBase` 选项可用属性 getter 读取当前主题，父层级 `0` 是合法值。

开发告警相对实际祖先的有效基准计算。合法的祖先 Token 或显式层级不会让普通子浮层误报；真正超过该基准加 1100 的嵌套仍告警。外部通过公开 `ZINDEX_KEY` 重设数值上下文时，不继承已被替换的内部诊断基准。

UI 消费者将数值和数字字符串接入该上下文。非数值 CSS 表达式保留原样；其自动后代层级仍是明确延期的边界，不通过 CSS 解析或 DOM 读取推导。

## 明确不做（边界）

- ❌ 不实现浮层定位（那是 @apollo-design/position 的职责）
- ❌ 不实现焦点陷阱（实现在 @apollo-design/utils，由 @apollo-design/a11y 再导出）
- ❌ 不实现触发时机与显隐延迟（那是 @apollo-design/overlay 的职责）

## 必须遵守的契约

- SSR 下不创建 DOM 或提前调用内容槽；需要首屏打开时在 `onMounted` 后设置 `open`
- `getContainer` 支持内联、选择器、resolver、Element 和 ShadowRoot，保留未就绪态
- 浮层的数值上下文与实际视觉基准一致，嵌套叠加当前组件 offset
- 默认嵌套 Portal 的祖先容器先入 DOM，子容器随后挂载

## 依赖

### 运行时依赖

| `@apollo-design/utils` | `workspace:*` |

### peer 依赖

| `vue` | `catalog:` |

### 构建期 / 测试依赖（devDependencies，**不会**进入用户的依赖树）

（无）

## 依赖约束（ARCHITECTURE.md §3.1）

- **R1 单向**：只能依赖同层或更低层
- **R2 无环**：不得与其他包循环依赖
- **R3 地基纯净**（仅 L0）：不得包含任何组件视觉语义
- **R4 引擎无视觉**（仅 L2）：不得定义颜色/圆角/阴影，不得产出 CSS
- **R6 显式声明**：跨包导入必须在本文件的 `dependencies` 中声明（`.npmrc` 已设 `hoist=false`）
- **R7 零 Ant Design 运行时依赖**：发布包的 `dependencies` 不得出现任何 `@ant-design/*`。
  Ant Design 生态包只允许出现在三处 —— ① 构建期数据源（`registry/tools/gen-*.mjs`）
  ② 测试 Oracle（`*.oracle.test.ts`）③ `devDependencies`。由 `registry:validate` 的 **E19** 强制。

本包的依赖已通过 `registry/tools/scaffold-packages.mjs` 的分层校验。


## 测试

```bash
pnpm --filter @apollo-design/portal test
pnpm --filter @apollo-design/portal lint
node packages/portal/src/__tests__/native-browser.mjs
```

测试要求见 [`TESTING.md`](../../TESTING.md)。
覆盖率下限为 语句 95% / 分支 90% / 函数 95%（L1 档位，见 `vitest.config.ts` 的 `coverage.thresholds`）。
