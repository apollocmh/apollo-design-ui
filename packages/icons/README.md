> 规范范围：本文件保留实现说明与历史对照证据；上游同构、旧阶段与历史 Gate 要求不再生效。现行规则见 [项目规范](../../AGENTS.md)，公共行为以 Apollo 组件 API 文档与测试契约为准。

# @apollo-design/icons

> **层**：L0 ｜ **风险**：low
>
> 本文档声明本包的**职责边界**。边界之外的事情不做 —— 如果发现需要做，说明架构需要调整，
> 应当先修改 `ARCHITECTURE.md` 并记录 ADR。

---

## 职责

Vue 图标组件集。以 @ant-design/icons-svg 为构建期 SVG 数据源，公开行为按 Apollo 的 Vue 契约定义；保留原始图形与历史参考证据。

## 替代的 Ant Design 依赖

- `@ant-design/icons`

## 公开 API

- 全部图标组件（PascalCase 命名，与 @ant-design/icons 一致）
- 基础组件：Icon / createIcon / IconProvider；IconProvider.value 只接受实际消费的 `prefixCls`、`rootClassName`。
- 工具：setTwoToneColor / getTwoToneColor / createFromIconfontCN
- 样式：getIconStyle(iconPrefixCls) —— 供 ui 的静态样式层消费

## 明确不做（边界）

- ❌ 不手写 SVG path（必须由 gen-icons.mjs 从 @ant-design/icons-svg **固化**成字面量）
- ❌ 运行时不 import @ant-design/icons-svg —— 图标数据已随包发布（R7）
- ❌ 不做运行时 <style> 注入（图标基础样式由 getIconStyle 交给 ui 的零运行时样式层）

## 必须遵守的契约

- 图标名与 @ant-design/icons 完全一致（Outlined / Filled / TwoTone 三种主题）
- 图标尺寸继承 font-size，颜色继承 currentColor
- TwoTone 图标支持双色定制；非 TwoTone 图标忽略 twoToneColor（与 antd 一致）
- 当前 Vue 行为以公开类型和行为测试共同描述；tests/compat/baselines/icons.dom.json 保留原始参考，不能固化上游缺陷。

## 当前 Vue 用法

```vue
<script setup lang="ts">
import { AccountBookTwoTone, IconProvider, setTwoToneColor } from '@apollo-design/icons';

const updatePalette = () => setTwoToneColor(['#eb2f96', '#fff1f0']);
</script>

<template>
  <IconProvider :value="{ prefixCls: 'apollo-icon', rootClassName: 'my-icons' }">
    <AccountBookTwoTone />
  </IconProvider>
  <button type="button" @click="updatePalette">Change icon colors</button>
</template>
```

`class`、`style`、`tabindex`、ARIA 属性与原生事件落到实际根 span；原生 `tabindex` 优先于内部焦点兜底。没有组件模型、所属业务事件或额外 Expose，事件保持 Vue DOM 监听语义。`IconProvider` 只提供上下文，不把自身 attrs 分配给内容节点。

`Icon`、`IconProvider` 与 `createFromIconfontCN()` 返回的组件声明完整同步默认槽。空默认槽同样表达用户意图：传给自定义 SVG 组件，或覆盖 iconfont 的 `type` 内容，不回退到旧内容。Iconfont 构造器显式声明实际支持的基础 Icon props，工厂 `extraCommonProps` 提供默认值，实例显式配置优先。

双色 setter 会更新已挂载的图标，单个图标的 `twoToneColor` 仍优先。全局 setter 的作用域仍是当前模块；SSR 请求有独立配色时使用实例 prop，不改写共享全局来源。

`createFromIconfontCN({ scriptUrl })` 是立即加载资源的工厂服务，SSR 下不访问 DOM。URL 数组按既有倒序优先级串行处理；重复及在途资源共享，错误不会卡住后续地址，也不自动重试。共享资源不随单个图标卸载而删除。

基础 CSS 通过 `getIconStyle()` → UI 的 `BASE_CSS` → 单组件与汇总静态产物消费，不在挂载时插入样式。单独使用本包或采用自定义 `prefixCls` 时，在构建时将相应 `getIconStyle(prefixCls)` 文本写入项目 CSS 并引入。

## 依赖

### 运行时依赖

| `@apollo-design/utils` | `workspace:*` |

### peer 依赖

| `vue` | `catalog:` |

### 构建期 / 测试依赖（devDependencies，**不会**进入用户的依赖树）

| `@ant-design/icons-svg` | `catalog:` |
| `@ant-design/colors` | `catalog:` |

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

## 构建说明

848 个图标组件由 `registry/tools/gen-icons.mjs` 从 `@ant-design/icons-svg` 生成到 `src/icons/`，**该目录是生成物、不入 review**（与 locale 的 `src/generated/` 同规）。

```bash
node registry/tools/gen-icons.mjs          # 生成/刷新
node registry/tools/gen-icons.mjs --check  # 只比对，不写入（门禁用）
```

要改图标行为，改 `src/create-icon.ts` / `src/render.ts`，**不要改 `src/icons/` 下的任何文件** —— 下次生成会被覆盖。

## 测试

```bash
pnpm --filter @apollo-design/icons test
pnpm --filter @apollo-design/icons lint
```

测试要求见 [`TESTING.md`](../../TESTING.md)。
**覆盖率豁免**：本包是**生成物**（848 个图标来自 `@ant-design/icons-svg`），对生成代码要求行覆盖率没有意义 —— `vitest.config.ts` 的 `coverage.thresholds` 档位里**不含** `icons`（与 `locale` 同规，依据 `ARCHITECTURE.md` §7）。
行为测试的落点在 9 个手写文件（`render` / `create-icon` / `icon` / `icon-font` / `two-tone-color` / `context` / `class-names` / `style` / `index`）上。


2026-10-29 ConfigProvider 关联修复移除了无消费者的 IconContextProps.csp / layer / zeroRuntime；它们没有静态 SVG 行为。value 的组件 props 与导出类型使用同一精确接口，前缀变化保持响应式。见[迁移记录](../../docs/migrations/config-provider-contracts.md)。该历史专项仅覆盖上下文链，其证据不冒充本轮或最终整包验收。
