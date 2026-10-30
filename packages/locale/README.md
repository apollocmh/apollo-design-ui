> 规范范围：本文件保留实现说明与历史对照证据；上游同构、旧阶段与历史 Gate 要求不再生效。现行规则见 [项目规范](../../AGENTS.md)，公共行为以 Apollo 组件 API 文档与测试契约为准。

# @apollo-design/locale

> **层**：L2 ｜ **风险**：low
>
> 本文档声明本包的**职责边界**。边界之外的事情不做 —— 如果发现需要做，说明架构需要调整，
> 应当先修改 `ARCHITECTURE.md` 并记录 ADR。

---

## 职责

国际化数据包：73 个语言包 + Locale 类型 + 各组件 locale 分片。**由脚本从 antd 的 locale 源生成**（与 icons 同一套路），不手工维护；Apollo 扩展由 `registry/source/locale-apollo-overrides.json` 合入生成，原始上游快照保持独立。

## 替代的 Ant Design 依赖

- `antd/locale/*`

## 公开 API

- Locale 类型及已声明的组件分片类型；语言数据保留来源字段，并包含明确的 Apollo 扩展。
- 73 个语言包：zh_CN / en_US / ja_JP / ...（导出名保留 antd 的下划线原名，便于只改包名迁移）
- 各组件 locale 分片：DatePicker / Pagination / Table / Form / Upload / ...
- useLocale(name, defaultLocale?) —— 取某组件的 locale，返回 `[ComputedRef<分片>, ComputedRef<string | undefined>]`（浅合并，context 侧赢）；脚本中读取 `.value`，动态语言同步更新。
- LocaleProvider（已废弃）+ ANT_MARK —— 接收 `locale?: Partial<Locale>`，通过默认插槽提供无宿主的语言上下文；保留原有标记与开发告警。
- useConfirmLocale(source) —— 在 Provider 的 setup 中绑定当前 Modal 分片。客户端挂载顺序决定静态服务来源优先级，替换、深更新、撤除和重新提供保留该实例的位置；卸载释放自身来源，SSR 不注册。
- changeConfirmLocale / getConfirmLocale —— 无组件上下文的 Modal 静态服务使用的全局语言来源；注册返回清理函数，后注册来源覆盖同名字段。无参调用清空全部来源并恢复英文，旧清理函数不会复活已清除的数据。

普通组件通过 `useLocale` 沿当前 Vue 父链读取语言；兄弟、嵌套应用和 SSR 请求的上下文各自独立。`getConfirmLocale()` 读取显式全局静态服务的当前快照，不携带应用身份；需要应用上下文时使用组件或对应的上下文服务。

`LocaleProvider` 默认 `{}` 是一个明确的英文回退边界，语言码为 `en`，不继承父语言。它不拥有 DOM 宿主，因此忽略 attrs；class、style 和原生监听器应放在插槽内的实际元素。默认插槽支持完整 Vue 内容并在每次渲染中读取，没有业务 Emits、v-model 或 Expose 方法。

## 明确不做（边界）

- 不管理应用选择的语言；通过 ConfigProvider / LocaleProvider 接收当前语言并响应更新。
- ❌ 不含有视觉语义的 UI 组件实现
- ❌ 不手工编辑生成产物 —— 改源头或改生成脚本
- ❌ 不做语言包公共子路径入口（antd 的 `antd/locale/zh_CN`）；从包根具名导入。

## 必须遵守的契约

- Locale 保留已声明的组件分片；Apollo 扩展 `global.clear?: string` 作为输入清除按钮文案。en_US 为 `Clear input`，zh_CN 为 `清空输入`；其他语言缺省时由 useLocale 回退到英文。
- 生成管线必须可重跑且幂等
- 语言数据按生成源验证；分片的公开可选性保持真实，未提供字段由 `useLocale` 的默认分片补齐，不凭空补译文本。

## 依赖

### 运行时依赖

（无；Vue 由 peer 依赖提供。）

### peer 依赖

| `vue` | `catalog:` |

### 构建期 / 测试依赖（devDependencies，**不会**进入用户的依赖树）

`@apollo-design/test-utils`，仅用于开发与测试。

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

本包由 `registry/tools/gen-locale.mjs` 从 antd 6.6.4 的 **ESM 产物**（`es/locale/*.js`）求值后生成到 `src/locales/`。生成数据变化需核对来源与差异。rc 的 locale 数据固化在 `registry/source/locale-rc/`（带 provenance + sha256）。

## 测试

```bash
pnpm exec vitest run --project unit packages/locale/src/__tests__
```

测试要求见 [`TESTING.md`](../../TESTING.md)。
相关严格类型检查由集成人合并执行；最终覆盖率、发布产物与消费者验证按冻结版本统一验收，阈值以 `vitest.config.ts` 为准。

`useLocaleReactive` 已于 2026-10-29 移除，原有调用统一迁移至 `useLocale`。底层 localeContextKey 可接收响应式来源。历史消费链交付见[ConfigProvider 迁移](../../docs/migrations/config-provider-contracts.md)，当前静态来源顺序及重置修复见[Locale 契约](../../docs/foundation/locale-contract.md)。历史结果不代表当前冻结版本的最终验收。
