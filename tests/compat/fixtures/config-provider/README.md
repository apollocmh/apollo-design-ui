# tests/compat/fixtures/config-provider

ConfigProvider 本体**不产 DOM**（它的渲染树是 Context.Provider，不引入任何元素；Vue 侧渲染函数直接返回 children），所以 L4 DOM 契约的覆盖路径与普通组件不同：

- **普通组件**：fixture 描述一个 props 组合 → 生成 antd React HTML 基线 → `semantic.test.ts` 用 `domContractTest` 逐节点比对。
- **ConfigProvider**：fixture 仍按规格创建（schema 一致），但断言面**移到下游**：在 `packages/ui/src/config-provider/__tests__/semantic.test.ts` 里挂探针组件读 context 而非 DOM，比对「ConfigProvider 对下游 Empty 的影响」（className、direction、size、disabled、renderEmpty 路径）。

这是有意的：`ConfigProvider` 的价值完全在它**对下游做了什么**，把它当普通组件去比 DOM 形态，比的是空。比的是「不产 DOM」+「下游传导正确」。

## 当前 fixture

| id | 覆盖 |
|---|---|
| `config-provider/basic` | 无任何 prop 时下游只拿到默认 context（getPrefixCls / iconPrefixCls / direction 等）；不引入额外 DOM。 |

更多 fixture（`with-theme` / `with-locale` / `nested-inherit` 等）待 ConfigProvider 的下游消费方（Button / Input 等）落地后，按消费方的 `semantic.test.ts` 配套补。