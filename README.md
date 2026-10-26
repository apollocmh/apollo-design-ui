# Apollo Design

**独立发展的 Vue 3 原生 UI 组件库。** Apollo Design 使用 TypeScript、Composition API 和静态 CSS，为业务应用提供一致的交互、主题和组件组合方式。

- 表单与数据录入、表格与数据展示、布局导航、浮层反馈等组件；按需导入的 ESM 入口与类型声明。
- Vue 的 props / emits / slots / v-model，支持组合式使用与命令式组件服务。
- CSS 变量与设计令牌、默认 / 暗色 / 紧凑算法、局部主题和多语言。
- 关注键盘操作、焦点管理、语义与无障碍；持续进行组件回归和消费端验证。

组件的可用范围以组件文档为准，尚未解决的缺陷见 [已知问题](docs/KNOWN-ISSUES.md)。Registry 的完成标记不代表不存在缺陷。

Image、List、Spin与QRCode已按完整清单完成本轮验收；全库审计继续进行。查看[整改进展与实际示例](https://apollocmh.github.io/apollo-design-ui/guide/audit-progress.html)及对应提交证据。

## 安装

本仓库当前包版本为 `0.0.0`，尚未建立稳定版本发布承诺。请按源码方式使用，不要假定 npm 上已有可安装版本。

```bash
git clone https://github.com/apollocmh/apollo-design-ui.git
cd apollo-design-ui
# Node.js >= 22.12，pnpm 版本见 package.json 的 packageManager
pnpm install --frozen-lockfile
pnpm build
```

在同一 pnpm workspace 中添加 `@apollo-design/ui`、`@apollo-design/theme` 的 `workspace:*` 依赖。独立项目需要使用已构建的 workspace 包或打包后的包，并同时提供其 `@apollo-design/*` 依赖；不要只复制 UI 的 dist 目录。

## 快速开始

在应用入口按顺序引入令牌与组件样式：

```ts
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/style.css';
```

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Button, Space } from '@apollo-design/ui';

const count = ref(0);
</script>

<template>
  <Space>
    <Button type="primary" @click="count++">点击 {{ count }} 次</Button>
    <Button @click="count = 0">重置</Button>
  </Space>
</template>
```

按需样式、表单绑定和组件扩展点见各组件文档，不需要注册 React 适配层。

## 主题定制

```vue
<script setup lang="ts">
import { Button, ConfigProvider } from '@apollo-design/ui';
</script>

<template>
  <ConfigProvider :theme="{ token: { colorPrimary: '#6455ff', borderRadius: 8 } }">
    <Button type="primary">自定义主题</Button>
  </ConfigProvider>
</template>
```

也可以覆盖 `--apollo-*` CSS 变量。Zero Runtime 指组件样式规则在构建期产出；Vue 响应性、令牌派生与动态布局仍有运行时代码。详见 [主题指南](packages/docs/content/guide/theming.md) 和 [样式引入](packages/docs/content/guide/styles.md)。

## 组件文档

```bash
pnpm docs:dev
pnpm build:docs
pnpm docs:preview
```

打开开发服务器输出的地址。文档站包含组件总览、API、可运行 Demo、图标目录、主题及国际化指南。文档源码在 `packages/docs`，组件 API 和 Demo 与实现共置于 `packages/ui/src/<component>/`。

## 开发指南

先读 [项目规范入口](AGENTS.md) 与 [开发流程](WORKFLOW.md)。

| 文档 | 职责 |
|---|---|
| [架构](ARCHITECTURE.md) | 包边界、依赖方向、主题和构建 |
| [组件规范](COMPONENT-RULES.md) | Vue API、响应性、样式与无障碍 |
| [兼容政策](COMPATIBILITY.md) | 现有用户、弃用与迁移边界 |
| [测试标准](TESTING.md) | 契约、视觉与质量门禁 |
| [路线图](ROADMAP.md) | 当前工作的优先级与验收方向 |
| [Registry](registry/README.md) | 状态、依赖和历史参考数据 |

```bash
pnpm verify:component button  # 局部开发反馈
pnpm verify:full              # 项目门禁
pnpm verify:consumer          # 已构建包的消费端检查
```

Apollo 的公开 API 与明确契约是功能标准。Ant Design 等项目可作为设计参考和可选对照，不绑定 Apollo 的版本、组件范围或发布验收。

## 许可与来源

项目包声明为 MIT。第三方衍生素材与算法的来源说明保留在生成文件头和对应实现中；独立发展不改变原有许可与版权义务。发布包的完整许可文本分发仍需在正式发布前核对。
