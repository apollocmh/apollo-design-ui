# notification 分析（G1）

> 契约来源：antd 6.6.4 `components/notification/`（index.tsx 264 / useNotification.tsx 283 /
> PurePanel.tsx 176 / PureList.tsx 73 / interface.ts 126 / util.ts 41 / hooks/useStackConfig.ts 25
> / style 883）+ `@rc-component/notification@2.0.8`。
>
> 上游是**兼容性规格**，不是代码来源。
>
> ⭐ **内核已落地**（上一轮为 message 建的 `packages/ui/src/notification/engine/`）：
> 本轮的 delta 是「notification 自己的壳 + 语义 + 样式层」，不是内核。

## 0. 与 message 的关系（本轮的真实成本）

| 部分 | 状态 |
|---|---|
| `notification/engine/`（rc-notification 的 Vue 自建，≈20 文件） | ✅ 已落地，10 条内核用例 + message 的 L4/L6 已验证 |
| `notification/util.ts`（getPlacementOffsetStyle / getMotion / getCloseIconConfig） | ✅ 已落地 |
| `notification/hooks/useStackConfig.ts` | ✅ 已落地 |
| **notification 的组件壳**（index / useNotification / PurePanel / PureList / interface） | ❌ 本轮 |
| **notification 的样式层**（`style/{token,index}.ts`，antd 侧 883 行；产物 120 条规则 + 组件变量块） | ❌ 本轮（主要工作量） |

⇒ notification 比 message 「更轻」：message 是「内核 + 壳」，notification 只剩壳与样式。

## 1. 分层

```
antd notification/index.tsx          命令式 API（模块级 holder + taskQueue）
  └─ useNotification.tsx             Holder（配置 → 内核 props）+ wrapAPI
       ├─ 内核（本仓 engine/）
       ├─ notification/util.ts       getPlacementOffsetStyle(top, bottom) / getMotion / getCloseIconConfig
       ├─ hooks/useStackConfig.ts    stack 合并（默认 { offset: 8 }）
       ├─ _util/hooks/useClosable    closable/closeIcon 的三级合并 + aria（本轮要简化实现）
       └─ locale                     closeLabel（关闭按钮的可访问名，默认 'Close'）
  ├─ PurePanel.tsx                   静态单条（_InternalPanel*）
  └─ PureList.tsx                    静态列表（_InternalList*）
```

## 2. API 面（G2 的目标）

### 2.1 `ArgsProps`（单条）

| 字段 | 说明 |
|---|---|
| `title` / `message`（deprecated → title） | 标题；`isReactRenderable` 为假时不渲染 title |
| `description` | 描述。**有 title + description 时才包 `-notice-section`** |
| `actions` / `btn`（deprecated → actions） | 操作区 |
| `type` | `'success' \| 'info' \| 'error' \| 'warning'`（**没有 `loading`**，与 message 不同） |
| `placement` | 6 个方位之一；**单条优先于全局** |
| `duration` | `number \| false`；非正数 ⇒ `false`（不自动关） |
| `showProgress` | 显示进度条 |
| `pauseOnHover` | 悬停暂停 |
| `closable` | `boolean \| null \| { closeIcon?, disabled?, onClose? }`；**默认 true** |
| `closeIcon` | 自定义关闭图标；`null` / `false` 表示不要图标 |
| `role` | `'alert'`（默认）\| `'status'` |
| `props` | 透传到 notice 根的 div 属性 |
| `icon` / `className` / `style` / `classNames` / `styles` / `onClick` / `onClose` / `key` | 同 message |

### 2.2 `NotificationInstance`

`success` / `error` / `info` / `warning` / `open` / `destroy(key?)`。
⚠️ **与 message 的关键差异**：`open()` 返回 **`void`**（不是 `MessageType`）——
notification 没有 `wrapPromiseFn`，**没有 thenable / 可调用句柄**。

### 2.3 `GlobalConfigProps`（`config()`）与 `NotificationConfig`（`useNotification()`）

- 共有：`top` / `bottom` / `duration` / `showProgress` / `pauseOnHover` / `prefixCls` /
  `getContainer` / `placement` / `closeIcon` / `closable` / `rtl` / `maxCount` / `props` /
  `stack` / `classNames` / `styles`。
- ⚠️ `getGlobalContext()` 只转发 **7 个键**给 holder：
  `getContainer / rtl / maxCount / top / bottom / showProgress / pauseOnHover`
  （与 message 同判；`prefixCls` 另由 `defaultGlobalConfig.prefixCls` 读，见 message 的 D96 注释）。

### 2.4 语义槽（**11 个**，比 message 多 5 个）

```
list / listContent（列表级）
wrapper / root / title / description / actions / icon / section / close / progress（单条级）
```

## 3. 渲染树（L4 的目标）

与 message 同一套内核结构，差别在 notice 内部：

```html
<div class="{p}-notice [{p}-notice-{type}] [{p}-notice-closable]" role="alert"
     data-notification-index="N" style="--notification-index:N; --notification-y:…px">
  <div class="{p}-notice-wrapper">                  <!-- 有 icon 才包 -->
    <div class="{p}-notice-icon [{p}-notice-icon-{type}]">{icon}</div>
    <div class="{p}-notice-section">                <!-- title + description 同时存在才包 -->
      <div class="{p}-notice-title">{title}</div>
      <div class="{p}-notice-description">{description}</div>
    </div>
  </div>
  <div class="{p}-notice-actions">{actions}</div>
  <button class="{p}-notice-close" aria-label="{closeLabel}">
    <span class="{p}-close-icon">…</span>           <!-- CloseOutlined，带 {p}-close-icon 类 -->
  </button>
  <progress class="{p}-notice-progress" max="100" value="…">   <!-- showProgress && duration>0 -->
</div>
```

6 个 placement：list 根额外带 `{p}-{placement}`（`top` / `topLeft` / `topRight` /
`bottom` / `bottomLeft` / `bottomRight`）。

## 4. 行为契约（L1/L2 的判据）

1. **`DEFAULT_DURATION = 4.5`**（message 是 3）、**`DEFAULT_PLACEMENT = 'topRight'`**、
   **`DEFAULT_STACK_CONFIG = { offset: 8 }`** —— ⚠️ notification **默认就堆叠**（message 默认 false）。
2. **`duration` 归一化**：`isNumber(duration) && duration > 0 ? duration : false`
   ⇒ `0` / `false` / `null` ⇒ 不自动关。
3. **`closable` 默认 `true`**，关闭按钮默认图标是 `CloseOutlined`，且**带 `{p}-close-icon` 类**；
   `closeIcon === null | false` ⇒ 只要按钮不要图标。
4. **`closeLabel`** 来自 locale（`global.close`，默认 `'Close'`）⇒ 关闭按钮的 `aria-label`。
5. **`role` 默认 `'alert'`**，可传 `'status'`。
6. **deprecated**：`message` ⇒ `title`、`btn` ⇒ `actions`（dev 告警；本仓遵循「同款告警保留」的既有判据）。
7. **`placement` 优先级**：单条 `placement` > 全局 `notificationConfig.placement` > `'topRight'`
   （`originOpen({ placement: …, ...restConfig })` —— restConfig 在后 ⇒ 覆盖前者）。
8. **`getCloseIconConfig` 优先级**：单条 `closeIcon` → `notificationConfig.closeIcon` →
   context 的 `closeIcon`。
9. **类型图标**：`icon || (type ? TypeIcon[type] : null)`；`-notice-icon-{type}` 类**只在没有自定义 icon 时**叠加（message 是恒叠加 —— 这是两者的差异点）。
10. **`open()` 返回 void**；`destroy(key)` 不传 key 则清空。
11. 命令式路径与 message 同：模块级单例 + 任务队列 + 就绪后回放；**游离 div** 承载 holder（D96）。

## 5. Token / 样式

**Component Token 3 个**（`prepareComponentToken`）：

| token | 值 |
|---|---|
| `zIndexPopup` | `zIndexPopupBase + CONTAINER_MAX_OFFSET + 50` = **2050**（⚠️ message 是 `+10`） |
| `width` | `384` |
| `progressBg` | `linear-gradient(90deg, ${colorPrimaryBorderHover}, ${colorPrimary})` |

另有 4 个可选容器背景色（`colorSuccessBg` / `colorErrorBg` / `colorInfoBg` / `colorWarningBg`），
默认 `undefined`（上游为修 issue 55649/56055 加的）。

`prepareNotificationToken`（**共享**，message 也用它）：派生 `notificationBg`、
`notificationPadding`（`paddingMD paddingContentHorizontalLG`）、
`notificationPaddingVertical/Horizontal`、`notificationIconSize`（`fontSizeLG × lineHeightLG`）、
`notificationCloseButtonSize`（`controlHeightLG × 0.55`）、`notificationMarginBottom`、
`notificationMarginEdge`、`notificationProgressHeight: 2`、`notificationMotionOffset: 64`。

样式本体：`sharedGenerateStyle(token, { listWidthKey: 'width' })` =
列表样式 + 条目样式（`genNotificationStyle`）+ **定位样式**（`placement.ts`，6 个方位）。
本仓产物：**120 条规则 + 组件变量块**（`/tmp/notif-rules.css`、`/tmp/notif-decls.txt`）。

## 6. 依赖缺口

| # | 缺口 | 说明 |
|---|---|---|
| P1 | `useClosable` 的三级合并（props / context / fallback + `closeIconRender` + aria） | antd 的 `_util/hooks/useClosable.tsx` 面较大；本轮做**简化但可观测一致**的实现，并登记差异 |
| P2 | locale 的 `close` 文案 | 用 `@apollo-design/locale` 的 `global.close`（需确认存在） |
| P3 | `App.useApp()` 的 notification 实例 | 同 message 的 P1（app 的 PENDING-2） |
| P4 | ConfigProvider 组件级 `classNames` / `styles` / token 覆盖 | 同 message 的 P2（staged） |
| P5 | `holderRender` / `warnContext` | D30 / D96 同源 |

## 7. 实现顺序

1. `interface.ts`（G2）：ArgsProps / NotificationInstance / GlobalConfigProps /
   NotificationConfig / 11 槽语义类型 / placement 联合
2. `style/token.ts`（G3）：3 token + `prepareNotificationToken`（共享层）
3. `style/index.ts`（G4）：120 条规则机械转换 + 声明块（根形态：`.{p}` 与 `{p}-notice-pure-panel`）
4. `PurePanel.ts` / `PureList.ts` / `icon.ts`（TypeIcon + getCloseIcon）
5. `useNotification.ts`（Holder + wrapAPI）
6. `index.ts`（命令式 API + 队列）
7. demo（对齐 antd 的可见 demo）→ 五层测试 → 文档 → registry → 收口

## 8. 风险预登记

- **L6 务必走静态面板**（PITFALLS 177）：命令式路径 portal + 自动消失。
- **`showProgress` 的 `<progress>` 在 jsdom/浏览器里样式差异大** —— 视觉用例要么不给 `showProgress`，
  要么与 antd 用同一组参数（两侧同款）。
- **`placement` 的定位样式在 6 个方位各不相同**（`placement.ts` 235 行）⇒ 视觉用例要覆盖至少
  `topRight` 与 `bottomRight` 两个方位。
- **notification 默认堆叠**（`{ offset: 8 }`）⇒ 视觉用例的多条形态会触发堆叠几何（gap 那条坑已修）。
- **关闭按钮的 `aria-label`**（closeLabel）是 L5 的可访问名断言点，别漏。
