# Grid / Row / Col 实现说明

当前契约见 [中文 API](index.zh-CN.md) / [English API](index.en-US.md)。完整源码审计见 [2026-10-28 报告](../../../../docs/audit/2026-10-28-grid-contract-audit.md)，行为与类型修正见 [迁移说明](../../../../docs/migrations/grid-contracts.md)。

## 当前结构

- Row/Col 是两个 Vue SFC，原生默认槽与稳定 div 根；attrs 每次 render 现读，通过 Vue normalizeStyle 合并字符串、对象和数组。
- Row 通过 typed provide/inject 的 computed gutter/wrap 给后代 Col；最近的 Row 隔离嵌套几何。
- ConfigProvider row/col 的 className/style、direction 和前缀动态消费。原生 dir/style 可覆盖当前默认值。
- useBreakpoint 在挂载后观察，SSR 保留默认值。共享 observer 按当前查询集合隔离，scope 清理与显式释放均幂等；useGutter 和 parseFlex 保持可独立验证的几何逻辑。
- 静态 CSS 提供 24 栏、六种主轴对齐、四种交叉轴对齐、逻辑偏移、响应式 flex 变量和 Form 的 `--apollo-grid-display` 覆盖钩子。
- Row/Col 无组件 Token，字体消费全局主题变量。Col media query 固定默认阈值；运行时 screen Token 不重写静态 CSS。自定义类前缀需要相应静态样式。
- 13 个实际 Demo 使用主题可读配色，playground 使用原生 range；全部 Demo 保留成对 `.vue` / `.md`。

## 历史参考

最初实现参考 antd 6.6.4 的 grid 目录，来源与早期差分说明保留在 `docs/analysis/grid.md`、本目录 PLAN 和既有 DOM/视觉参考证据。旧“逐字同构”“无 BUG”或“Form 尚未接线”等描述不作为当前规范；Form display 钩子已经接线。原 React fixture/PNG 没有变更，也没有复制为 Apollo 已验收基线。

源码、发布产物、Docs 和正式 Apollo 视觉分别验收；以审计报告的已验证/未验证边界为准。
