# Breadcrumb / Item / Separator 契约迁移

适用于尚未发布的 `0.0.0` 开发版。按 ADR0006/0007 直接修正 Vue 内容、原生 DOM 归属和响应性；无兼容层、无弃用期。组件名、items、routes 废弃通道、itemRender 对象槽、三语义区域和 7 个 Token 的名称保留。

## 原生 attrs 与稳定内容

旧 `BreadcrumbItem.className` 改为 Vue `class`；旧 style prop 的无效行为改为原生 style，支持字符串/对象/数组。Item 的 id、ARIA/data attrs、class/style 和原生监听器现在落所属 li，@click 接收一次 MouseEvent。数据项里的 className 仍是数据字段，与原生组件 attrs 区分；其 style 现在实际应用到默认内容。

```vue
<Breadcrumb aria-label="Document path">
  <BreadcrumbItem class="home" style="padding: 2px" href="#home" @click="onNativeClick">
    <strong>Home</strong>
  </BreadcrumbItem>
  <BreadcrumbItem aria-current="page">Current page</BreadcrumbItem>
</Breadcrumb>
```

内容拥有稳定的 span 宿主，菜单按钮是内容的兄弟；在菜单或图标条件变化时，原有输入/链接不会因换树而重挂。数据项 onClick 且没有 href 时，默认内容使用原生 button。自定义 #itemRender 继续拥有自身内容 attrs、链接与监听器；不从 route 静默注入到用户槽。

## 内容与当前值

- 提供 `items=[]` 保持空列表，不再意外消费默认槽；items/routes 都未提供时才使用原生组合。
- #separator、#dropdownIcon 取代需要手写 VNode 的模板内容配置；原有静态内容 prop 仍支持。槽存在则优先，包括有意为空，移除槽恢复本地 prop → 当前 Provider → 默认值。Item 同样支持相应槽。
- Separator 显式空槽保留空内容，不再回退 `/`。装饰 aria-hidden 固定为 true；前缀随所属 Breadcrumb 当前 prefixCls 更新。
- 函数式 classNames/styles 读取当前解析 props；Provider 替换、移除配置立即更新。
- 字符串 params 按完整字面名称替换所有出现位置；0 和空字符串有效，缺失/空值保留占位符。VNode/Fragment/数组原有完整内容保持正常，不对内部文字递归替换。path 存在时仍覆盖 href，并累计此前 path。

```vue
<Breadcrumb :items="items" :params="{ id: 0 }">
  <template #separator><span>›</span></template>
  <template #dropdownIcon><span>⌄</span></template>
  <template #itemRender="{ route, href }"><a :href="href">{{ route.title }}</a></template>
</Breadcrumb>
```

旧四参数 itemRender 函数 prop 已在前轮直接迁移；本轮不恢复任何函数兼容入口。

## 菜单与主题

原不可聚焦的 span 触发器改为具有名称的原生按钮，和导航链接独立。按钮最小 24×24 CSS px 满足 WCAG 2.2 的目标尺寸，支持 Enter/Space/ArrowDown；键盘打开后焦点进入菜单。Escape 请求关闭；已接受且焦点仍属菜单时返回按钮，受控拒绝和外部焦点保持原位。hover/click 的默认目标为箭头按钮；通过 dropdownProps.open/onOpenChange 控制开合。

菜单项显式 href 生效并优先于 path；没有父 href 时 path 直接使用，不再产生 `undefined/...`。Menu 的 disabled、图标、额外内容与业务事件在类型和运行时同时传递。

7 Token 保持名称，通过当前 Provider 的 components.Breadcrumb 与 CSS 变量生效。正文 itemColor/linkColor 默认来源从 colorTextDescription 改为 colorTextSecondary，修复默认/紧凑下普通文字对比度不足；separatorColor 仍是装饰描述色。暗色、紧凑、嵌套、SSR/水合和主题替换使用当前来源；原生根 style 保留最高覆盖优先级。

`component-token` 原 Demo 的固定蓝色/紫色在暗色及暗色紧凑主题下对比度仅为 2.99/1.86。示例仍通过根组件变量自定义视觉，但颜色值改为当前 `colorTextSecondary` / `colorText` 语义变量；四主题真实浏览器 axe 保留为回归，不以改变背景或豁免对比度通过。

## 参考差异与验收边界

原 30 个 React DOM 场景、参考 HTML/PNG 保留。稳定宿主、所属前缀、有效 style、完整参数和原生菜单按钮导致的有限差异记录在 `breadcrumb/__tests__/contract-differences.json`，仍逐条精确匹配，未放宽阈值。当前功能/浏览器/SSR 证据与共享阻塞见 [审计记录](../audit/2026-10-28-breadcrumb-contract-audit.md)。源码局部通过不代表最终同一提交的发布产物、Docs 或 Apollo 视觉验收通过。
