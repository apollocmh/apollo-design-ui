---
title:
  zh-CN: 按需使用
  en-US: Tree Shaking
order: 3
---

## zh-CN

`@apollo-design/ui` 以 **ESM + preserveModules** 构建：产物保留模块结构，打包器可以按命名导入做 tree-shaking，不会把整个组件库打进产物。

```ts
// 打包这些组件及其实际 JS 依赖
import { Button, Space, Table } from '@apollo-design/ui';
```

### 样式怎么办

组件样式是独立的静态 CSS，需要显式引入。JS 的 tree-shaking 与 CSS 的选择分别控制；组件挂载不会通过注册表注入样式。

```ts
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/button/style.css';
import '@apollo-design/ui/space/style.css';
import '@apollo-design/ui/table/style.css';
```

每个样式入口在构建时组合实现内部所需的依赖，并保持全量 CSS 中的相对层叠顺序。用户插槽中的自选组件仍需自行引入样式。`COMPONENT_STYLES` 是构建期清单，生成样式文件；它不会在组件运行时挂载 CSS。

如果你的场景是「全部组件都用」（如中后台整体接入），直接全量引入更简单：

```ts
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/style.css';
```

### 校验

仓库的构建门禁（L7）包含按入口的体积预算与模块结构检查（`tests/build/`），tree-shaking 行为有回归用例钉住，不靠口头承诺。

## en-US

`@apollo-design/ui` uses **ESM + preserveModules**, so named imports can be tree-shaken with their actual JS dependencies. CSS is separate: import `theme/tokens.css` followed by `ui/<component>/style.css`, or use the aggregate `ui/style.css`.

Individual stylesheets include implementation-owned dependencies in aggregate cascade order. Components supplied through your slots still need their own CSS. `COMPONENT_STYLES` generates files at build time; mounting a component does not inject styles at runtime.
