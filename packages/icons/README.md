# @apollo-design/icons

Apollo Design 的 Vue 3 SVG 图标组件。提供 Outlined、Filled、TwoTone 图标、基础 `Icon`、图标上下文和自定义 iconfont 接入。

[图标目录](https://apollocmh.github.io/apollo-design-ui/components/icon)

## 安装

```bash
npm install @apollo-design/icons vue
```

## 使用

```vue
<script setup lang="ts">
import { CheckOutlined, HeartTwoTone } from '@apollo-design/icons';
</script>

<template>
  <span><CheckOutlined aria-hidden="true" /> 已完成</span>
  <HeartTwoTone :two-tone-color="['#0073e6', '#e6f4ff']" aria-label="收藏" />
</template>
```

图标大小继承 `font-size`，单色图标使用 `currentColor`。`class`、`style`、ARIA 属性与原生事件传到实际根元素；装饰性图标可设 `aria-hidden="true"`，独立交互图标应由带可访问名称的按钮承载。

## 样式与双色

使用 UI 组件样式时，图标基础规则已由 UI 静态 CSS 提供。单独使用本包时，可在构建阶段将 `getIconStyle()` 的结果写入项目 CSS：

```js
import { writeFileSync } from 'node:fs';
import { getIconStyle } from '@apollo-design/icons';

writeFileSync('apollo-icons.css', getIconStyle());
```

随后在应用入口导入该文件。自定义前缀时，`IconProvider` 的 `prefixCls` 与生成样式的前缀应一致。

单个图标的 `twoToneColor` 优先于 `setTwoToneColor()` 的模块级默认值。SSR 中需要请求独立配色时使用实例属性。`IconProvider` 支持 `prefixCls` 与 `rootClassName`，通过 Vue 上下文响应更新。

`Icon` 可渲染自定义 SVG 内容；`createFromIconfontCN({ scriptUrl })` 可加载受信任的 iconfont 资源。该工厂在客户端加载脚本，因此地址的可信性由应用负责。

## 图形来源

图标数据由 `@ant-design/icons-svg` 的 MIT 许可素材生成，保留其图形来源；Vue 行为和发布接口由 Apollo Design 维护。运行时不下载该数据包。刷新图形使用仓库的 `registry/tools/gen-icons.mjs`，不要直接修改生成的图标文件。

## 文档与维护

[公开导出](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/icons/src/index.ts) · [项目规范](https://github.com/apollocmh/apollo-design-ui/blob/master/AGENTS.md) · [测试要求](https://github.com/apollocmh/apollo-design-ui/blob/master/TESTING.md)
