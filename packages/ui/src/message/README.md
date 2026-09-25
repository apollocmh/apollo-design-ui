# message

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

- **内核复用**：命令式 API 与浮层结构来自 `notification/engine/`（rc-notification 的
  Vue 自建，见 `notification/README.md`）；message 只做配置翻译 + 图标/语义槽 + 入口。
  antd 也是这样分层的（message 完全建立在 rc-notification 上）。
- **模块级单例**：`message.success()` 没有组件实例 ⇒ holder/队列/默认配置挂在模块上；
  测试用 `actDestroy()` 复位。
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

## 5. 已知缺口

| # | 缺口 | 说明 |
|---|---|---|
| P1 | `App.useApp()` 的 message 实例 | app 的 PENDING-2：当前返回 stub，message 落地后应回填真实例 |
| P2 | ConfigProvider 的组件级 `classNames` / `styles` / token 覆盖 | 与 image 的 P5 同判（staged）；`useComponentConfig('message')` 已接好，等 context 落地 |
| P3 | 函数式语义槽 | D36 同判（只支持对象形态） |
| P4 | `holderRender` / `warnContext` | D30：React 特有 / 未落地（D96 已登记） |

## 6. 收口证据（G13）

- L1+L2 20 / L3 8 / L4 4（基线 `tests/compat/baselines/message.dom.json`）/ L5 16 /
  L7(theme) 11 / demo 11（`expectCount` 钉死）/ L6 **9/9 0.000% exact**
- registry 11 维 done，`status: completed`
