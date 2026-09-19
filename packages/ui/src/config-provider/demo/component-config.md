---
order: 3
title:
  zh-CN: 组件级配置
  en-US: Component config
---

已落地的组件（`empty` / `divider` / `spin` / `form`）有**精确类型**的 prop；
其余组件走 `components` 弱类型逃生口：

```vue
<ConfigProvider :components="{ button: { className: 'my-btn' } }">
  …
</ConfigProvider>
```

这是**渐进式类型形态**（差异 D25）：antd 的 `ConfigProviderProps` 声明了 56 个
组件配置 prop 并 import 全部组件的类型，本仓只有 4 个组件落地，照搬会编译失败。
每落地一个新组件，就把它从 `components` 提升成精确 prop。

合并规则（与 antd 一致）：

- 嵌套的 `ConfigProvider` **逐组件名**合并 —— 内层只给一部分配置时，外层的其它组件配置不会丢
- 同名组件配置是**整体替换**，不是深合并
- 组件自己的 prop 优先级最高
