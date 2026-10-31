> 规范范围：本文件保留实现说明与历史对照证据；上游同构、旧阶段与历史 Gate 要求不再生效。现行规则见 [项目规范](../../../../AGENTS.md)，公共行为以 Apollo 组件 API 文档与测试契约为准。

> 历史实施记录：原勾选、当时结果和缺口保留。2026-10-30 起，本文的 G0–G14 / 逐组件 G13 全仓收口与旧 Registry 进度规则由仓库 `WORKFLOW.md`、`TESTING.md` 两阶段流程替代；当前任务状态只读 `registry/vue-native-audit.json`，不据本文重复派发或重跑已有效验证。

# message

## 当前 Vue 实现（2026-10-31）

共享 Notice 使用 typed emits；命令式 Args 的业务订阅保留。Holder factory 继续零参返回 VNode，setup 早期命令排队，owner 卸载释放队列、计时器及观察器。当前 Provider/语义对象替换和撤除、动态主题与容器配置均由实际渲染读取。PurePanel 使用原生 attrs、具名槽和 owned emits；单条配置不再声明未消费的 list/listContent。PureList 保留列表语义。

Message 的所有同 key 句柄在真实终止时 resolve true，手动关闭/destroy/淘汰/卸载不额外触发 public onClose。Notification 保留按钮和超时调用最新订阅的边界。原有稳定 ref、ResizeObserver 与 MotionList 白名单/deadline 成果保留，见 [2026-10-22 历史证据](../../../../docs/audit/2026-10-22-menu-notification-motion-remediation.md)。本轮行为与迁移详见双语 API 和 native-contracts 回归。

以下原阶段对照、缺口及全矩阵数字是历史记录；App 真实 API、组件级配置与 Token 覆盖已由后续实现及本轮相关消费者验证取代，不表示本轮重新执行历史矩阵。对象语义配置是当前契约。

> **层**：L3（`packages/ui`）｜ **优先级**：P3 ｜ **复杂度**：M ｜ **antd 版本**：6.6.4
>
> 契约来源：antd `components/message/`（index 346 / useMessage 308 / PurePanel 120 /
> PureList 68 / interface 113 / util 28 / style 207）+ `@rc-component/notification@2.0.8`
> （es ≈ 907 行）+ antd `components/notification/` 的共享样式层。
> 上游是**兼容性规格**，不是代码来源。

## 1. 职责

全局提示：命令式 API（`message.success(...)`）+ hooks 形态（`useMessage()`），
顶部居中的 portal 浮层，支持计时自动关闭、堆叠折叠、语义槽自定义。

## 2. 文件布局与关键决策

```
message/
├── index.ts        # 命令式 API：模块级 holder + 任务队列 + 静态方法
├── useMessage.ts   # Holder（配置 → 内核 props）+ wrapAPI（MessageInstance）
├── PurePanel.ts    # 静态单条面板（_InternalPanel*，也是 L4/L6 的静态形态）
├── PureList.ts     # 静态列表（_InternalList*）
├── icon.ts         # TypeIcon：存**组件**而非模块级 VNode（D23）
├── util.ts         # getMotion / wrapPromiseFn（可调用 + thenable）
├── interface.ts    # ArgsProps / ConfigOptions / MessageType / TypeOpen / …
└── style/{token.ts,index.ts}
```

- **Holder → 内核的配置必须传 getter**（Issue #45）：`useNotification()` 在 setup 期
  把根配置**解构成常量** ⇒ `duration` / `maxCount` / `pauseOnHover` / `stack`
  传裸值会被钉死，holder 建好之后再 `message.config({ maxCount })` 就传不进内核。
  现在这四个（连同本来就走 getter 的 `style` / `className` / `motion` / `getContainer`）
  统一传 getter，内核侧 `toValue` 求值（类型 `ConfigValue<T>` 见
  `notification/engine/interface.ts`）。
- **内核复用**：命令式 API 与浮层结构来自 `notification/engine/`（rc-notification 的
  Vue 自建，见 `notification/README.md`）；message 只做配置翻译 + 图标/语义槽 + 入口。
  antd 也是这样分层的（message 完全建立在 rc-notification 上）。
- **模块级单例**：`message.success()` 没有组件实例 ⇒ holder/队列/默认配置挂在模块上；
  测试用 `actDestroy()` 复位。
  ⚠️ `actDestroy()` 必须**先卸载根应用**（Issue #43）：`createApp(GlobalHolder).mount(container)`
  建的是真 Vue app，只重置模块变量会留下一个仍在运行的 app（watch 还在、Teleport 到
  `document.body` 的 notice 不会消失）⇒ 要在 `GlobalMessage` 上留 `app` 引用并 `unmount()`。
  ✅ 同族已修：`notification/index.ts` 的 `actDestroy()` 同样加了 `unmount()`（Issue #44）。
- **holder 挂在游离 div 上**（React 用 `DocumentFragment`）：两者都不进 document。
- **`config()` 是合并语义**；`getContainer` 在调用 `config()` 时求值一次并缓存。

## 3. 与 antd 的差异

登记于 `COMPATIBILITY.md` §9.2：**D96**（命令式 holder 用游离 div 承载 + 不实现
`holderRender` / `warnContext`，D30 同源）、**D97**（自动 key 字面量是
`apollo-message-N`，D45 同判）。

L6 视觉 9 张（3 variant × 3 viewport）**全部 0.000% exact**。

## 4. Component Token 清单

registry 数据：token 数 = 3。

| token | 来源 |
|---|---|
| `zIndexPopup` | `zIndexPopupBase + CONTAINER_MAX_OFFSET(1000) + 10` = 2010 |
| `contentBg` | `colorBgElevated` |
| `contentPadding` | `(controlHeightLG − fontSize × lineHeight) / 2` px + `paddingSM` px = `9px 12px` |

## 5. 历史缺口记录

| # | 缺口 | 说明 |
|---|---|---|
| P1 | `App.useApp()` 的 message 实例 | app 的 PENDING-2：当前返回 stub，message 落地后应回填真实例 |
| P2 | ConfigProvider 的组件级 `classNames` / `styles` / token 覆盖 | 与 image 的 P5 同判（staged）；`useComponentConfig('message')` 已接好，等 context 落地 |
| P3 | 函数式语义槽 | D36 同判（只支持对象形态） |
| P4 | `holderRender` / `warnContext` | D30：React 特有 / 未落地（D96 已登记） |

## 6. 历史收口证据（G13，非本轮复验）

- L1+L2 20 / L3 8 / L4 4（基线 `tests/compat/baselines/message.dom.json`）/ L5 16 /
  L7(theme) 11 / demo 11（`expectCount` 钉死）/ L6 **9/9 0.000% exact**
- registry 11 维 done，`status: completed`
