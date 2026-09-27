# Collapse 实现说明

## 1. 对应 antd 组件

- antd 6.6.4 · `es/collapse/`（Collapse 90 + CollapsePanel 31 + style 289，只读参照，H2）
- 引擎判据 `@rc-component/collapse@1.2.0`（es/ 619 行：Collapse 状态机 / useItems /
  Panel / PanelContent 逐行对拍）——H5 禁 rc，registry strategy=in-ui ⇒
  `packages/ui/src/collapse/engine/`
- 动效：`@apollo-design/motion` 的 `CSSMotion` + `initCollapseMotion` preset
  （alert 同范式；rc 的 `@rc-component/motion` 替换已完成）
- 复用基建：`useOrientation` 无关；`useMergeSemantic`/`semanticRootStyle`、
  icons 的 RightOutlined

## 2. 与 antd 的行为差异清单

同步到 `COMPATIBILITY.md` §9.1 / §9.2。

| # | 差异 | 分类 | 证据 |
|---|---|---|---|
| D65 | `onChange` ⇒ `change` emit（C19）；deprecated×3（destroyInactivePanel / expandIconPosition / Panel 的 disabled）逐条告警 | INTENDED | L1 |
| — | `ref` ⇒ `expose({ nativeElement })` | INTENDED | L1 |
| — | expandIcon 回调参数含 `collapsible`（rc 传完整 panelProps ⇒ aria-label/aria-hidden 分支依赖它） | — | L1/a11y |
| — | `Collapse.Panel` 的 `header` 收窄 string + `#header` 插槽；`extra` / `children` 由 VNode prop 改为 `#extra` / 默认插槽（children 形态为 deprecated 薄壳） | PLATFORM | L4 children-deprecated 用例 |

## 3. 引擎（engine/）

| 文件 | 上游来源 | 钉什么 |
|---|---|---|
| `engine/index.ts` | rc `Collapse.js` + `hooks/useItems.js` | getActiveKeysArray（string 化三态）、buildPanelInfos（key=`String(key??index)` / collapsible·destroyOnHidden 覆盖链 / **disabled 吞点击含全局 toggle**） |

## 4. Component Token 清单（10 个）

`headerPadding` / `headerPaddingSM` / `headerPaddingLG`（padding 组合串，含固定
16px ⇒ 构建期解析值 D50）/ `headerBg`(colorFillAlter ⇒ var()) / `contentPadding` /
`contentPaddingSM` / `contentPaddingLG` / `contentBg`(colorBgContainer ⇒ var()) /
`borderlessContentPadding` / `borderlessContentBg`(transparent)。
派生：`collapsePanelBorderRadius = borderRadiusLG`（构建期解析值）。
另含 genCollapseMotion 的 `{root}-motion-collapse` CSS（height/opacity !important）。

## 5. 测试矩阵

| 层 | 文件 | 条数 | 钉什么 |
|---|---|---|---|
| L1/L2 | `__tests__/index.test.ts` | 16 | 状态机（受控/非受控/accordion/string 化）、collapsible 四态落点、惰性渲染、deprecated×2、expandIcon 定制 + -arrow 类、attrs、ref |
| L3 | `__tests__/type.test-d.ts` | 12 | collapsible/placement 字面量、activeKey 联合、onChange string[]、items 字段面、五语义槽 |
| L4 | `__tests__/semantic.test.ts` | 12 | items/accordion/变体/rtl/semantic/collapsible-disabled/children-deprecated |
| L5 | `__tests__/a11y.test.ts` | 4 demo | axe 0 violation |
| L6 | `tests/visual/render/cases/{react,vue}/collapse.*` | 3×3 | basic / accordion / borderless |
| L7 | `__tests__/theme.test.ts` | 12 | Token 落地形态 + 五段样式 |
| — | `tests/compat/fixtures/collapse/*.json` | 3 | basic / accordion / variants |

## 6. 已知边界

- motion 离场是异步的 ⇒ L1 断 aria-expanded 即时态；卸载时间线由 motion 包覆盖。
- `items` 的 `onItemClick`（rc 字段）在 disabled 时被吞（与全局 toggle 同一护栏）。
