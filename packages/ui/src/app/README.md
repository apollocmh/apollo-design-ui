# app

> **层**：L3（`packages/ui`）｜ **优先级**：P3 ｜ **复杂度**：M ｜ **antd 版本**：6.6.4
>
> 契约来源：antd `components/app/`（App.tsx 122 行 / context / useApp / style 30 行）。
> 上游是**兼容性规格**，不是代码来源。

## 1. 职责

应用根包裹：向子树提供 `message` / `notification` / `modal` 的 HookAPI（
`useApp()`），并让 `AppConfig`（message/notification 配置）沿树合并。
——它是 antd 里消掉「组件 → HookAPI → 组件」循环依赖的那层壳。

## 2. 文件布局与关键决策

```
app/
├── App.ts              # 根包裹 + context 注入 + component=false 告警
├── useApp.ts           # App.useApp 的函数形态（re-export）
├── interface.ts
├── style/index.ts      # 单规则（手写对拍）
└── demo/{basic,config}.vue
_internal/app-context.ts  # ⭐ 消环叶子模块：只含类型 + InjectionKey
```

- **消环**：antd 中 App ↔ message/notification/modal 互相引用。本仓把
  context 抽到 `_internal/app-context.ts`（**不含任何组件导入**），三方落地后
  可安全依赖，不再有循环。
- **v1 stub API**：三者未落地 ⇒ API 为 stub（调用即 dev 警告 + no-op）。
  `contextHolder` 渲染 null。三者落地后回填（PENDING-2）。

## 3. 与 antd 的差异

- **PENDING-2**：message / notification / modal 未落地 ⇒ `useApp()` 的三件套
  为 stub（调用即 dev 警告）。组件落地后按 antd 的 HookAPI 契约回填，
  App 本身的结构（context 注入 / 配置合并 / component=false 告警）不受影响。
- 样式单规则**手写对拍**（antd 源仅 30 行，SSR 提取管线对单规则组件是过度工程）。

L6 视觉 3 张（1 variant × 3 viewport）**全部 0.000% exact**。

## 4. 收口证据（G13）

- L1 6 / L4 3（基线 `app.dom.json`）/ L5 2 / L7 3 / L3 3 / demo 2 /
  L6 **3/3 0.000% exact**
- registry 11 维 done，`status: completed`
