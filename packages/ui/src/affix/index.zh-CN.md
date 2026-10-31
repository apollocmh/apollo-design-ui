---
category: 其他
title: Affix
subtitle: 固钉
---

# Affix 固钉

滚动到指定偏移后，将内容固定到窗口或实际滚动容器的可视边缘。默认插槽承载完整 Vue 内容。

```vue
<Affix :offset-top="16" :target="() => scrollArea" @change="onAffixed">
  <button>固定工具栏</button>
</Affix>
```

## API

| Prop | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| offsetTop | 顶部固钉偏移 | number | 两种偏移都未传时为 0 |
| offsetBottom | 底部固钉偏移；两个条件同时命中时顶部优先，顶部未命中时仍可命中底部 | number | — |
| target | 返回实际滚动元素或 Window；未传依次使用 Provider.getTargetContainer、window | () => HTMLElement \| Window \| null \| undefined | — |
| prefixCls | 当前组件类名前缀 | string | apollo-affix |

`target` 返回 null/undefined 表示尚未就绪，释放旧目标监听并撤除固钉状态，不退回 window。响应式 ref 就绪或替换后自动同步；非响应式目标变化可调用已有 `updatePosition()` 重新读取。

| 事件 | 载荷 | 时机 |
| --- | --- | --- |
| change | affixed: boolean | 实际固钉状态翻转时；同一状态的滚动不重复通知 |

| 插槽 | 说明 |
| --- | --- |
| default | 固钉内容，保留完整 VNodeChild 和节点身份 |

| AffixRef | 说明 |
| --- | --- |
| updatePosition(): void | 合并到下一帧重新测量当前目标和内容 |

没有新增实例方法。模板 ref 可声明为 `ref<AffixRef | null>(null)`。

## 原生属性与当前配置

根是外层占位测量 div，原生 class/style、id、data、ARIA 和监听器只落此处。class/style 使用 Vue 的字符串、数组和对象合并，调用者样式覆盖 `ConfigProvider.components.affix.style`；这些字段不另声明成组件 Props。固钉层与占位层是内部定位节点。

`getPrefixCls`、组件配置和主题读取当前 Provider。唯一组件 Token 是 `zIndexPopup`，默认由 `zIndexBase + 10` 派生；替换、撤除和显式 0 均作用于实际固钉层。

```vue
<ConfigProvider :theme="{ components: { Affix: { zIndexPopup: 20 } } }">
  <Affix :offset-top="0">工具栏</Affix>
</ConfigProvider>
```

## 几何与资源

保留顶部/底部的亚像素比较与外层布局测量基准。顶部条件优先于底部条件，并非删除另一个条件。固定宽度跟随外层可用宽度；内容保留自然高度，其真实尺寸通过已有 ResizeObserver 同步占位，支持增长和缩小，不重挂内部输入。

只在挂载后测量和绑定。当前目标的滚动事件保持逐帧合并与同位置快路径；内容/容器的尺寸通知走完整测量。换目标、目标变为空和卸载释放监听、观察及待执行帧，SSR 不调度这些副作用。没有为无尺寸/滚动/显式更新信号的任意位置重排增加观察或轮询。

## Demo

basic、offset-bottom、on-change、target、update-position；原有几何与 s54 监听幂等回归保留。统一九维与发布验收另行执行。
