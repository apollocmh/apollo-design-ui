# Layout 实现说明

## 1. 对应 antd 组件

- antd 6.6.4 · `es/layout/`（只读参照，H2）
- 分析产物：`docs/analysis/layout.md`（G1，先于实现存在）
- 复合组件：`Layout`（注册名 `ALayout`）+ 静态属性
  `Header / Footer / Content / Sider / _InternalSiderContext`

## 2. 与 antd 的行为差异清单

| # | 差异 | 分类 | 证据 |
|---|---|---|---|
| D5 | 无 hash / css-var 包裹类；19 个 Component Token 声明在根类 | INTENDED | L4 全 32 例 |
| D6 | 前缀 `apollo-layout` / `apollo-layout-sider`；菜单选择器用 `.apollo-menu` | INTENDED | L7 |
| — | Component Token 落 **var() 别名派生**（antd cssVar 产物是实值） | INTENDED | L7 派生断言 |
| — | demo 里的 Menu / Breadcrumb 用等价原生结构替换（未落地） | PLATFORM | demo 文件头 |
| — | `component-token` demo 用「根元素覆写 CSS 变量」替换 `ConfigProvider theme.components` | PLATFORM | demo 文件头 |
| — | `onCollapse` / `onBreakpoint` 走 attrs（Vue 里若声明 emits 会被从 attrs 摘掉，事件会漏挂） | PLATFORM | L1 折叠用例 |

## 3. .vue / .tsx 选择

- `Layout.ts` / `Sider.ts` **渲染函数**：
  - Layout 根 div 同时承担 expose ref 与 `provideLayoutContext`；
  - Sider 根 `aside` 承担 expose ref、响应式注册与 trigger 的多重判据；
  - generator 模式（`Basic` / `BasicLayout`）用工厂函数闭包传 `suffixCls` / `tagName`。

## 4. Component Token 清单（19 个）

三个字面常量（`headerBg` / `siderBg` = `#001529`、`triggerBg` = `#002140`）是 antd 的
硬编码值，其余走 var() 派生：

| token | 派生式 | antd 实测值 |
|---|---|---|
| headerHeight | `calc(controlHeight * 2)` | 64px |
| headerPadding | `0 calc(controlHeightLG * 1.25)` | 0 50px |
| footerPadding | `controlHeightSM calc(controlHeightLG * 1.25)` | 24px 50px |
| triggerHeight | `calc(controlHeightLG + marginXXS * 2)` | 48px |
| zeroTriggerWidth / Height | `controlHeightLG` | 40px |
| bodyBg / colorBgBody / footerBg | `colorBgLayout` | #f5f5f5 |
| headerColor | `colorText` | rgba(0,0,0,0.88) |
| triggerColor | `colorTextLightSolid` | #fff |
| lightSiderBg / lightTriggerBg | `colorBgContainer` | #ffffff |
| lightTriggerColor | `colorText` | rgba(0,0,0,0.88) |

## 5. 已知缺口

- `Layout.Sider` 与 Menu 的联动（`siderCollapsed` 决定 inline-collapsed）：Menu 未落地，
  `SiderContext` 已就绪（`_InternalSiderContext` 导出）。
- `usePanelRef`（Watermark 的面板注册）尚未被任何面板组件使用。

## 6. 关键判据速查

- **hasSider 三源**：显式 boolean > 已注册 sider 数 > children 里有 `type === Sider`
  （第三条必须首帧成立 —— SSR 契约）。
- **Basic 的前缀**：`customizePrefixCls || prefixWithSuffixCls`（传了 prefixCls 就不拼 suffix）。
- **Layout 类序**：`prefixCls → -has-sider → -rtl → contextClassName → className → rootClassName`；
  Header/Footer/Content **没有** contextClassName / rootClassName。
- **style**：`{...contextStyle, ...style}`（用户覆盖 context）。
- **Sider 类序**：`prefixCls → -${theme} → 状态类 → className → context → 语义 root`。
- **Sider style**：`{...mergedStyles.root, ...divStyle}`（divStyle 覆盖语义 root）。
- **siderWidth**：数字补 px，字符串原样（`50%` → `50%`）。
- **trigger**：`collapsedWidth` 解析为 0 ⇒ `<span>` 零宽触发器（`-left` / `-right`）；
  否则 `<div class="-trigger">`；`trigger === null` ⇒ 都不渲染。
- **响应式**：挂载时立即以 `mql.matches` 调一次 `onBreakpoint`；不匹配时以
  `'responsive'` 触发折叠（依赖数组只有 breakpoint）。
