# V3 Phase 3 · 文档站自举清单与证据

> 证据：`screenshots-p3/`、`metrics-p3.json`、`metrics-p3.md`
> 目标：站点 chrome 的常规可点击控件使用 Apollo primitives；解释保留的原生语义元素。

## 1. 已自举

| 位置 | 控件 | 使用的 Apollo 组件 |
|---|---|---|
| 顶栏 | 移动端菜单 / 搜索 / 语言 / 主题 / GitHub | `Button`（text / circle + `#icon`）+ `@apollo-design/icons` |
| 顶栏搜索触发 | 搜索按钮（保留 `/` kbd） | `Button type="default"` + `SearchOutlined` |
| 主题图标 | 亮 / 暗 / 跟随系统 | `SunOutlined` / `MoonOutlined` / `DesktopOutlined` |
| Demo 工具栏 | 展开代码 / 复制 / 重置 / 新窗口 / GitHub | `Button type="text" size="small"`；外链两项为 icon-only + `Tooltip` |
| Demo 模式 | 自动布局 / 单列 | `Segmented` |
| 首页 CTA | 快速开始 / 组件总览 / GitHub | `Button`（RouterLink custom + `href`/`navigate` 保留链接语义） |
| Demo 错误态 | 重试 | `Button` |
| 图标页 / 搜索面板 | 搜索框、筛选、重试 | `Input` / `Button`（已有） |

## 2. 保留原生元素（逐项理由）

| 位置 | 元素 | 理由 |
|---|---|---|
| `SearchModal` 结果项 | `<button role="option">` | listbox / `aria-activedescendant` 的语义选项必须保持原生按钮行为；改成 `Button` 会引入嵌套可聚焦控件并破坏键盘导航 |
| `DemoSource` 文件 tabs | `<button role="tab">` | 语义 tablist；迁移到 `Tabs` 会多出一层 content 容器，源码面板结构与测试锚点会变；当前实现已用站点 token 统一外观 |
| `IconTile` | `<button>` | 图标网格的整块点击目标 + 复制反馈；`Button` 的尺寸/内边距会破坏 120 个图块的网格密度 |
| 导航 / 目录 / Markdown 表格 / 代码块 | `a` / `nav` / `table` / `pre` | 语义 HTML，不是“自绘按钮” |

## 3. 统计

在 `packages/docs/src`：

- 原生 `<button>`：**3 处**（上表 1–3）；
- Apollo `<Button>`：**18 处**；
- 唯一引用的 `--apollo-*` 变量：**17 个**；`--site-*` 变量：**22 个**（布局 + 语义别名）。
- `grep "<button"` 从改前的 8 处降为 3 处；顶栏 / 工具栏 / 模式切换 / 首页 CTA 全部走库控件。

## 4. 验证

- `vue-tsc --noEmit`：0 errors。
- `packages/docs` 单测：13 files / 150 tests passed。
- P3 浏览器探针：`.demo-toolbar .apollo-btn` = 100（20 demos × 5），顶栏 5 个控件全部为 `.apollo-btn`
  （GitHub 是 `Button href` 渲染的 `<a>`）；`.apollo-segmented` 存在；旧 `.demos-mode-btn` = 0；
  390 下 GitHub 顶栏入口 `display:none`，页面 `scrollWidth = 390`。
- 截图：`screenshots-p3/apollo/button-1440-screen.png`。
