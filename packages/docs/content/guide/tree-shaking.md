---
title:
  zh-CN: 按需使用
  en-US: Tree Shaking
order: 3
---

## zh-CN

`@apollo-design/ui` 以 **ESM + preserveModules** 构建：产物保留模块结构，打包器可以按命名导入做 tree-shaking，不会把整个组件库打进产物。

```ts
// 只会打包你用到的组件
import { Button, Space, Table } from '@apollo-design/ui';
```

### 样式怎么办

组件样式**不是** CSS-in-JS，也不需要每个组件单独引一份 CSS：各组件在运行时通过内部的样式注册表（`COMPONENT_STYLES`）挂载自己的样式规则，随组件模块一起被 tree-shaking —— 用到哪个组件，哪个组件的样式才会进入产物。

如果你的场景是「全部组件都用」（如中后台整体接入），直接全量引入更简单：

```ts
import '@apollo-design/ui/style.css';
```

### 校验

仓库的构建门禁（L7）包含按入口的体积预算与模块结构检查（`tests/build/`），tree-shaking 行为有回归用例钉住，不靠口头承诺。

## en-US

`@apollo-design/ui` is built with **ESM + preserveModules**: bundlers can tree-shake via named imports. Component styles are registered at runtime by an internal style registry and are tree-shaken together with the component modules. For full-app usage, import `@apollo-design/ui/style.css` once instead.
