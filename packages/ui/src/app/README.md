> 规范范围：本文件保留实现说明与历史对照证据；上游同构、旧阶段与历史 Gate 要求不再生效。现行规则见 [项目规范](../../../../AGENTS.md)，公共行为以 Apollo 组件 API 文档与测试契约为准。

> 历史实施记录：原勾选、当时结果和缺口保留。2026-10-30 起，本文的 G0–G14 / 逐组件 G13 全仓收口与旧 Registry 进度规则由仓库 `WORKFLOW.md`、`TESTING.md` 两阶段流程替代；当前任务状态只读 `registry/vue-native-audit.json`，不据本文重复派发或重跑已有效验证。

# app

## 当前 Vue 契约（2026-10-31）

保留 Issue #40 的真实服务接线及 #41 的恒定配置引用。AppConfig 和 UseAppProps 使用实际 hook 类型，静态 App.useApp 与具名方法保持同一精确签名；无 provider 明确失败。App 使用 typed 默认槽及原生宿主 attrs，当前 Provider 的 className/style 与局部样式合并，component=false 的开发诊断不再引用 React。

配置对象由 shallowReactive 保持稳定注入，父级更新、本地替换和撤回均可传到真实 holder；服务 holder 不随 div/section/false/main 宿主切换而重挂。App 无所属事件、模型、命令式 ref 方法或自有 Token，全局主题别名继续由现有 Provider 作用域提供。公共契约与迁移见双语 API，新增核心组合用例保留实际 Teleport、焦点与资源清理断言。

下面的旧阶段数字与对照说明是历史记录，不表示本轮重跑历史完整矩阵。

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
- **HookAPI 已接线**（Issue #40，PENDING-2 关闭）：`useApp()` 的三件套来自
  `useMessage()` / `useNotification()` / `Modal.useModal()`，各自的 `contextHolder`
  与 `<Component>` **同级**渲染（antd `App.tsx` 同构）⇒ 每个 App 实例自带一套
  通知容器（嵌套隔离、随 App 卸载销毁、能吃 AppConfig 与 ConfigProvider 的配置）。
  ⚠️ 配置必须传 **getter**（`() => mergedAppConfig.value.message`），传裸值会钉死首帧。

## 3. 与 antd 的差异

- **appConfig 必须引用恒定**（Issue #41）：`provide(appConfigContextKey, mergedAppConfig.value)`
  是 setup 期**快照** ⇒ 之后改 `message` / `notification` props，已注入的子孙拿不到新值。
  与 `ConfigProvider` 的 `config` 同范式：provide 一个 **reactive 对象**、内容用
  `watchEffect` 打补丁（`inject` 只在 setup 解析一次 ⇒ 引用恒定是硬约束）。
- ~~**PENDING-2**：`useApp()` 的三件套为 stub~~ → ✅ **2026-10-14 已关闭**（Issue #40）：
  三者都由各自 hook 提供，App 本身的结构（context 注入 / 配置合并 /
  component=false 告警）未变。
  ⚠️ 接线后 App 的渲染根变成 **Fragment**（holder + `<Component>`）⇒ 测试里别再用
  `wrapper.element` 当根，要用 `.apollo-app`。
- 样式单规则**手写对拍**（antd 源仅 30 行，SSR 提取管线对单规则组件是过度工程）。

L6 视觉 3 张（1 variant × 3 viewport）**全部 0.000% exact**。

## 4. 历史收口证据（G13，非本轮复验）

- L1 6 / L4 3（基线 `app.dom.json`）/ L5 2 / L7 3 / L3 3 / demo 2 /
  L6 **3/3 0.000% exact**
- registry 11 维 done，`status: completed`
