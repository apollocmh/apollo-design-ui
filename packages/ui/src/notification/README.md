# notification

> **层**：L3（`packages/ui`）｜ **优先级**：P3 ｜ **复杂度**：M ｜ **antd 版本**：6.6.4
>
> 契约来源：antd `components/notification/`（index 264 / useNotification 283 / PurePanel 176 /
> PureList 73 / interface 126 / util 41 / hooks 25 / style 883）+ `@rc-component/notification@2.0.8`。
> 上游是**兼容性规格**，不是代码来源。

## 1. 职责

通知提醒框：命令式 API（`notification.success({ title })`）+ hooks 形态，六个方位、
自动关闭倒计时进度条、堆叠折叠、可关闭按钮与操作区。

## 2. 文件布局与关键决策

```
notification/
├── index.ts        # 命令式 API：模块级 holder + 任务队列 + 静态方法
├── useNotification.ts  # Holder（配置 → 内核 props）+ wrapAPI
├── PurePanel.ts / PureList.ts  # 静态面板/列表（_Internal*，也是 L4/L6 的静态形态）
├── icon.ts         # TypeIcon（存组件，D23）+ getCloseIcon / getCloseIconWithLabel
├── util.ts         # getPlacementOffsetStyle / getMotion / getCloseIconConfig（与 message 共用）
├── hooks/useStackConfig.ts     # stack 合并（默认 { offset: 8 }）
├── interface.ts    # ArgsProps / GlobalConfigProps / NotificationConfig / …
├── engine/         # ⭐ rc-notification 的 Vue 自建（message 那轮落地，本轮复用）
└── style/{token.ts,index.ts}
```

- **默认就堆叠**：`DEFAULT_STACK_CONFIG = { offset: 8 }`（message 是 `false`）。
- **`open()` 返回 `void`**：没有 thenable/可调用句柄（message 有）。
- **关闭图标要补 `aria-label`**：图标自带的是 `close`（小写），契约要求 locale 的 `Close`
  ⇒ `getCloseIconWithLabel`（等价于 antd 的 `cloneElement(icon, { 'aria-label': closeLabel })`）。
- **`closable: false` 与 `closeIcon: null` 都移除整个按钮**（上游 `computeClosable` 的第一条分支）。
- 复用了 Tag 那轮建的 `_internal/use-closable.ts`（其注释里就写着「Alert / Notification 将来复用」）。

## 3. 与 antd 的差异

登记于 `COMPATIBILITY.md` §9.2：**D96**（命令式 holder 用游离 div + 不实现 `holderRender` /
`warnContext`，与 message 同判）、**D98**（`useClosable` 的 vnode aria 注入路径改写为
`closeIconRender` 里 `cloneVNode`）。

L6 视觉 9 张（3 variant × 3 viewport，含 bottomRight 定位与 actions 区）**全部 0.000% exact**。

## 4. Component Token 清单

registry 数据：token 数 = 7（3 个有默认值）。

| token | 来源 |
|---|---|
| `zIndexPopup` | `zIndexPopupBase + CONTAINER_MAX_OFFSET(1000) + 50` = 2050 |
| `width` | `384` |
| `progressBg` | `linear-gradient(90deg, colorPrimaryBorderHover, colorPrimary)` |
| `colorSuccessBg` / `colorErrorBg` / `colorInfoBg` / `colorWarningBg` | 默认 `undefined` |

另有**共享派生** `prepareNotificationToken`（9 个 `notification*` 量），message 也用它。

## 5. 已知缺口

| # | 缺口 | 说明 |
|---|---|---|
| P1 | `App.useApp()` 的 notification 实例 | 同 message 的 P1（app 的 PENDING-2） |
| P2 | ConfigProvider 组件级 `classNames` / `styles` / token 覆盖 | 同 message 的 P2（staged） |
| P3 | 函数式语义槽 | D36 同判（只支持对象形态） |
| P4 | `holderRender` / `warnContext` | D30 / D96 同源 |

## 6. 收口证据（G13）

- L1+L2 21（组件）+ 10（内核）/ L3 8 / L4 4（基线 `tests/compat/baselines/notification.dom.json`）/
  L5 19 / L7(theme) 16 / demo 14（`expectCount` 钉死）/ L6 **9/9 0.000% exact**
- registry 11 维 done，`status: completed`
